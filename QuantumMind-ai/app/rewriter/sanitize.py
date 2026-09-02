"""Pure helpers for the query rewriter (PLAN.md Phase 1).

WHY THIS MODULE EXISTS
----------------------
Three pieces of rewriter logic are decisions about *strings*, not about providers:
which questions look context-dependent, how to strip a model's decorative
packaging off a response, and which tokens must survive a rewrite byte-for-byte.
Keeping them here, as functions of their arguments and nothing else, buys three
things:

  * **One definition of the pronoun list.** Requirement 1 criterion 3 defines the
    tokens that mark a question as context-dependent; Requirement 11 criterion 3
    defines the self-contained skip as the *negation* of that list plus a token
    count. Two copies of a nine-element frozenset would drift. One cannot.
    ``is_self_contained`` is written in terms of ``has_context_dependent_token``
    and ``SELF_CONTAINED_MIN_TOKENS`` so the relationship lives in code.
  * **An auditable classifier.** Requirement 8 criterion 6 is an "if and only if"
    rule. It is implemented literally, clause by clause, so a reviewer can check
    the code against the sentence.
  * **Cheap tests.** No ``Settings``, no logger, no provider, no ``os.environ``
    (CLAUDE.md hard rule 8). The property tests need no fixtures and no network.

Nothing here raises for any input, which is part of how ``rewrite()`` keeps its
never-raise contract (``app/rewriter/base.py``).

Requirements covered: 1.3, 3.11, 5.10, 8.6, 8.7, 8.8, 11.3.
"""
from __future__ import annotations

import re

# ---- context dependence (Req 1 c3, Req 11 c3) ----

#: The single definition. Requirement 1 criterion 3's context-dependence test and
#: Requirement 11 criterion 3's skip heuristic both read THIS frozenset.
CONTEXT_DEPENDENT_TOKENS: frozenset[str] = frozenset(
    {"it", "they", "them", "that", "this", "those", "these", "one", "there"}
)

#: Req 11 c3 says "more than 8 whitespace-delimited tokens", so the comparison is
#: strictly greater than this value.
SELF_CONTAINED_MIN_TOKENS: int = 8

# ---- sanitisation (Req 3 c11) ----

# str.strip() with no argument also strips Unicode whitespace. The requirement
# says ASCII whitespace, so the set is spelled out.
_ASCII_WHITESPACE = " \t\n\r\v\f"

_QUOTE_CHARS = "\"'"
_FENCE = "```"

#: Req 3 c11's steps are applied repeatedly until the string stops changing, which
#: is what makes `sanitise_response` idempotent. Models nest a fence inside quotes
#: and quotes inside a fence with equal enthusiasm; a single fixed-order pass would
#: leave residue that depends on the nesting. Four iterations is far beyond any
#: observed nesting. It is a deliberate bound, not a fixed point in the abstract:
#: five or more nested layers would exit unconverged.
_SANITISE_MAX_ITERATIONS = 4

#: A markdown language tag is a short bare word on the fence's opening line.
_LANGUAGE_TAG_RE = re.compile(r"[A-Za-z0-9_+.\-]{1,20}")

# ---- Literal_Identifier classification (Req 8 c6) ----

_ASCII_LETTERS = frozenset("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
_ASCII_DIGITS = frozenset("0123456789")

_ASCII_LOWER_TABLE = str.maketrans(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"
)

#: The characters Req 8 c6's pre-step keeps: ASCII letters, ASCII digits, and
#: `-`, `_`, `.`, `@`. Everything else is stripped from both ends of a token.
_PERMITTED_CHARS = _ASCII_LETTERS | _ASCII_DIGITS | frozenset("-_.@")

#: Clause (a)'s character class. Note the absence of `.` — that is what excludes
#: `QM.4471` from clause (a), and it is load-bearing (see `_is_identifier`).
_CLAUSE_A_CHARS = _ASCII_LETTERS | _ASCII_DIGITS | frozenset("-_")

_IDENTIFIER_MIN_CHARS = 2
_IDENTIFIER_MAX_CHARS = 64


# ---------------------------------------------------------------- tokenisation


def tokens_of(text: str) -> list[str]:
    """Whitespace-delimited tokens, in order.

    Plain ``str.split()``: the requirements speak of "whitespace-delimited
    tokens" without narrowing the whitespace class, and splitting on more kinds
    of whitespace can only raise the token count, which errs towards attempting a
    rewrite rather than skipping one.
    """
    return text.split()


def _ascii_lower(text: str) -> str:
    """Lowercase ASCII letters only.

    ``str.lower`` is Unicode-aware, and the requirements say "ASCII
    case-insensitive comparison". The difference is not academic: ``"K"`` (U+212A
    KELVIN SIGN) lowercases to ``"k"`` under Unicode rules, which would let a
    homoglyph masquerade as a case-altered ASCII identifier.
    """
    return text.translate(_ASCII_LOWER_TABLE)


def _normalise_token(token: str) -> str:
    """Lowercase a token and drop its bounding punctuation.

    Req 1 c3 compares tokens "under ASCII case-insensitive comparison". Taken to
    the letter that would leave ``"that."`` and ``"one?"`` unmatched, and a
    pronoun test that misses the end of a sentence is not a pronoun test. So
    surrounding non-alphanumeric characters come off first.

    The direction of this reading is deliberately the safe one: it makes
    ``has_context_dependent_token`` fire *more* often, which makes the
    Requirement 11 skip trigger *less* often, which costs tokens rather than
    recall.
    """
    return _ascii_lower(token.strip(".,;:!?()[]{}\"'`“”‘’…-–—"))


def has_context_dependent_token(question: str) -> bool:
    """True when any token of ``question`` is in ``CONTEXT_DEPENDENT_TOKENS``."""
    return any(
        _normalise_token(token) in CONTEXT_DEPENDENT_TOKENS
        for token in tokens_of(question)
    )


def is_self_contained(question: str) -> bool:
    """Req 11 c3: no listed pronoun/demonstrative AND more than 8 tokens.

    Both halves read the definitions above, which is the whole reason this module
    exists: Req 1 c3's list and Req 11 c3's negation of it cannot drift apart.
    """
    if has_context_dependent_token(question):
        return False
    return len(tokens_of(question)) > SELF_CONTAINED_MIN_TOKENS


# --------------------------------------------------------------- sanitisation


def _strip_one_quote_pair(text: str) -> str:
    """Remove ONE surrounding pair of matching ASCII single or double quotes."""
    if len(text) >= 2 and text[0] in _QUOTE_CHARS and text[-1] == text[0]:
        return text[1:-1]
    return text


def _strip_one_code_fence(text: str) -> str:
    """Remove ONE surrounding markdown fence plus the language tag on its line.

    The language tag is only dropped when a newline exists, otherwise
    ```` ```query``` ```` would lose its payload. A fence whose opening line is
    blank (the common ```` ```\\nquery\\n``` ```` shape) drops that blank line too.
    """
    if len(text) < 2 * len(_FENCE):
        return text
    if not text.startswith(_FENCE) or not text.endswith(_FENCE):
        return text

    inner = text[len(_FENCE) : -len(_FENCE)]
    newline = inner.find("\n")
    if newline == -1:
        return inner

    opening = inner[:newline].strip(_ASCII_WHITESPACE)
    if opening == "" or _LANGUAGE_TAG_RE.fullmatch(opening):
        return inner[newline + 1 :]
    return inner


def sanitise_response(raw: str) -> str:
    """Strip a model's decorative packaging off a rewrite response (Req 3 c11).

    The ordering is normative: (1) strip ASCII whitespace, (2) remove one matching
    ASCII quote pair, (3) remove one markdown fence and its language tag, then
    re-strip — repeated until the string stops changing, bounded at
    ``_SANITISE_MAX_ITERATIONS``.

    This function performs sanitisation ONLY. The empty test (Req 3 c4), the
    length test (Req 3 c5) and identifier validation (Req 8) run *after* it, in
    ``llm_rewriter``, and their placement after this step is load-bearing: an
    empty check before sanitisation would let ``'""'`` through as non-empty and
    hand an empty string to the embedder.
    """
    text = raw
    for _ in range(_SANITISE_MAX_ITERATIONS):
        before = text
        text = text.strip(_ASCII_WHITESPACE)
        text = _strip_one_quote_pair(text)
        text = _strip_one_code_fence(text)
        text = text.strip(_ASCII_WHITESPACE)
        if text == before:
            break
    return text


# ------------------------------------------------- Literal_Identifier detection


def _strip_identifier_edges(token: str) -> str:
    """Req 8 c6 pre-step: drop leading/trailing chars outside the permitted set."""
    start, end = 0, len(token)
    while start < end and token[start] not in _PERMITTED_CHARS:
        start += 1
    while end > start and token[end - 1] not in _PERMITTED_CHARS:
        end -= 1
    return token[start:end]


def _clause_a(token: str) -> bool:
    """Every char in ``[A-Za-z0-9_-]``, and at least one letter and one digit.

    Matches ``QM-4471-B``, ``ERR_TIMEOUT_502``, ``ORD12345``. Rejects ``widget``
    (no digit), ``4471`` (no letter) and ``QM.4471`` (`.` is not in the class).
    """
    if not all(char in _CLAUSE_A_CHARS for char in token):
        return False
    return any(c in _ASCII_LETTERS for c in token) and any(
        c in _ASCII_DIGITS for c in token
    )


def _clause_b(token: str) -> bool:
    """Exactly one ``@``, >=1 permitted char before it, >=2 dot-groups after it.

    Matches ``returns@acme.test``. Rejects ``@acme.test`` (nothing before),
    ``a@b`` (one group after) and ``a@@b.c`` (two ``@``).
    """
    if token.count("@") != 1:
        return False
    local, _, domain = token.partition("@")
    if not any(char in _PERMITTED_CHARS for char in local):
        return False
    return len(domain.split(".")) >= 2


def _clause_c(token: str) -> bool:
    """Leading ``v``/``V`` then >=2 dot-separated groups of ASCII digits.

    Matches ``v2.4.15``, ``V1.0``. Rejects ``3.2`` (no prefix), ``version2.4``
    (the group before the dot is not all digits) and ``v2`` (one group).

    ``v2`` is nonetheless an identifier *overall*, because clause (a) accepts it
    — Req 8 c6 is a disjunction over the three clauses. Only the clause-level
    verdict is negative here.

    ``str.isdigit`` is deliberately not used: it accepts non-ASCII digits.
    """
    if not token or token[0] not in "vV":
        return False
    groups = token[1:].split(".")
    if len(groups) < 2:
        return False
    return all(group and all(c in _ASCII_DIGITS for c in group) for group in groups)


def _is_identifier(stripped: str) -> bool:
    """Req 8 c6's "if and only if", applied to an already edge-stripped token.

    CONFIRMED EXCLUSIONS — do not "fix" these:

      * ``3.2`` is NOT an identifier. It fails (a) because `.` is outside that
        clause's character class, fails (b) for want of an ``@``, and fails (c)
        for want of the ``v`` prefix.
      * ``$249.99`` strips to ``249.99`` and is NOT an identifier, for the same
        three reasons.

    Requirement 8's note records this as a reviewed trade-off: a classifier that
    fired on bare numerics would fire on prices, quantities and dates, freezing
    them byte-for-byte and blocking far more legitimate rewrites than it would
    save. Dropping clause (c)'s prefix requirement re-opens that decision.

    KNOWN OVER-FIRE, ALSO SPECIFIED: ``9am-5pm`` satisfies clause (a) — letters,
    digits, only permitted characters — so it is classified as an identifier even
    though no human would call it one. The effect is conservative: a rewrite that
    drops it is rejected and we fall back to the original question. Req 8 c6 says
    "if and only if", so this is the specified behaviour and is not a defect.
    """
    if not _IDENTIFIER_MIN_CHARS <= len(stripped) <= _IDENTIFIER_MAX_CHARS:
        return False
    return _clause_a(stripped) or _clause_b(stripped) or _clause_c(stripped)


def literal_identifiers(text: str) -> list[str]:
    """Every ``Literal_Identifier`` in ``text``, first-appearance order (Req 8 c6).

    NEVER lowercases its output. Case preservation is exactly what Req 8 c3 needs
    in order to detect a re-cased identifier, so lowercasing happens only inside
    comparisons. Exact duplicates collapse; two spellings of the same identifier
    (``QM-1`` and ``qm-1``) are two entries, because each has to be validated.
    """
    found: list[str] = []
    seen: set[str] = set()
    for token in tokens_of(text):
        stripped = _strip_identifier_edges(token)
        if stripped in seen or not _is_identifier(stripped):
            continue
        seen.add(stripped)
        found.append(stripped)
    return found


def validate_literal_identifiers(
    original: str, candidate: str
) -> tuple[bool, str | None]:
    """Check that ``candidate`` preserved every identifier of ``original``.

    Returns ``(True, None)`` when it did. Otherwise ``(False, reason)``:

      * present case-insensitively but not byte-for-byte -> Req 8 c3
      * absent entirely -> Req 8 c2

    Identifiers that appear only in the ``History_Window`` are not this
    function's business (Req 8 c7); those are repaired, not rejected, by
    ``restore_history_identifier_case``.
    """
    lowered_candidate = _ascii_lower(candidate)
    for identifier in literal_identifiers(original):
        if identifier in candidate:
            continue
        if _ascii_lower(identifier) in lowered_candidate:
            return False, f"case-altered identifier: {identifier}"
        return False, f"dropped identifier: {identifier}"
    return True, None


def restore_history_identifier_case(candidate: str, history_text: str) -> str:
    """Rewrite re-cased ``History_Window`` identifiers to the history spelling.

    Req 8 c7 says a history-only identifier need not appear in the candidate at
    all; Req 8 c8 says that if it does appear with altered case, the emitted
    ``Search_Query`` carries the history spelling and ``was_rewritten`` stays
    ``True``. This is the one place the pipeline REPAIRS rather than rejects,
    because the identifier came from the history and the model's re-casing
    carries no user intent worth preserving.

    Runs AFTER ``validate_literal_identifiers``, so an identifier the user typed
    has already been enforced and cannot be silently overwritten here.
    """
    result = candidate
    # Longest first: a case-only substitution cannot corrupt a longer identifier,
    # but ordering by length keeps that true even if the rule ever widens.
    for identifier in sorted(
        literal_identifiers(history_text), key=len, reverse=True
    ):
        result = re.sub(
            re.escape(identifier),
            lambda _match, spelling=identifier: spelling,
            result,
            flags=re.IGNORECASE | re.ASCII,
        )
    return result
