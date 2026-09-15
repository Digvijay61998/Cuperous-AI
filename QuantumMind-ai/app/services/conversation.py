"""Conversational reflexes that must not go through retrieval.

WHY THIS MODULE EXISTS
----------------------
The pipeline had exactly one behaviour for every input: embed it, search, gate,
generate. That is right for a question and wrong for everything else a human
types into a support chat.

Measured against the live service before this module existed:

    "hello"              -> retrieved 4 chunks (top 0.218, above the 0.15 gate)
                            -> "I don't have that information right now."
    "hi there"           -> retrieved nothing -> confident=false -> the caller's
                            fallback: "Sorry, I did not understand that."
    "thanks, that helps" -> same
    "who are you?"       -> same

Every one of those is a *correct* execution of the naive pipeline and a
completely unacceptable customer experience. A greeting is not a knowledge-base
lookup; embedding it and searching a policy corpus is a category error. The fix
is a routing decision made *before* retrieval, which is the pattern the adaptive
RAG literature calls skipping retrieval for simple prompts — see
`docs/RESEARCH.md`.

WHY IT IS DETERMINISTIC AND NOT AN LLM CALL
-------------------------------------------
An LLM intent classifier would cost a round trip on the single cheapest,
highest-volume, most predictable turn in the whole conversation. Greetings are a
closed set of a few dozen surface forms. Matching them costs microseconds, never
fails, needs no API key, and is trivially testable. Reach for a model when the
input space is open; a greeting's is not.

WHY THE MATCH IS DELIBERATELY NARROW
------------------------------------
A false positive here is far worse than a false negative. Mistaking a real
question for smalltalk means answering "Happy to help!" to someone asking about
a refund. So the classifier only fires when the *whole* message is smalltalk:
short, and composed entirely of greeting tokens. "hi" matches. "hi, why was my
refund declined?" does not — it falls through to the normal RAG path, which is
exactly right. Every rule below is written to fail towards retrieval.

Requirement mapping: this is PLAN.md task 7.4 (adaptive retrieval — skip
retrieval entirely for greetings/chitchat), pulled forward because it is the
defect customers hit first.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

SmalltalkKind = Literal["greeting", "thanks", "goodbye", "identity"]

# ---------------------------------------------------------------------------
# Surface forms
# ---------------------------------------------------------------------------
# Ordered by specificity: `identity` and `thanks` are checked before `greeting`
# so "thanks, hi" reads as thanks rather than as a greeting. Each entry is a
# whole-message pattern, anchored, because a partial match is how a real
# question gets misrouted.

_GREETING_WORDS = (
    "hi",
    "hii",
    "hiii",
    "hey",
    "heya",
    "hello",
    "helo",
    "hlo",
    "yo",
    "sup",
    "howdy",
    "greetings",
    "namaste",
    "namaskar",
    "hola",
    "salaam",
    "salam",
    "gm",
    "ge",
    # Multi-word forms are matched as phrases below; listing the joined form
    # here too costs nothing and catches "goodmorning".
    "goodmorning",
    "goodafternoon",
    "goodevening",
)

_GREETING_PHRASES = (
    "good morning",
    "good afternoon",
    "good evening",
    "good day",
)

_THANKS_PHRASES = (
    "thanks",
    "thank you",
    "thankyou",
    "thx",
    "ty",
    "tysm",
    "much appreciated",
    "appreciate it",
    "appreciated",
    "that helps",
    "that helped",
    "got it",
    "understood",
    "makes sense",
    "perfect",
    "great",
    "awesome",
    "cool",
    "nice",
    "ok",
    "okay",
    "k",
)

_GOODBYE_PHRASES = (
    "bye",
    "goodbye",
    "good bye",
    "see you",
    "see ya",
    "cya",
    "later",
    "take care",
    "good night",
    "goodnight",
    "gn",
    "that's all",
    "thats all",
    "nothing else",
    "no thanks",
    "no thank you",
    "im done",
    "i'm done",
    # "that will be all" is deliberately absent: `will` is a strong question
    # marker ("will I be charged for this?") and the marker guard rejects the
    # whole message on sight. Keeping `will` as a marker is worth more than
    # catching one rare sign-off, which falls through to retrieval — a mildly
    # stiff reply rather than a wrong one.
)

_IDENTITY_PHRASES = (
    "who are you",
    "who r u",
    "what are you",
    "who is this",
    "are you a bot",
    "are you a robot",
    "are you human",
    "are you a real person",
    "am i talking to a human",
    "am i talking to a bot",
    "is this a bot",
    "is this a human",
    "your name",
    "whats your name",
    "what is your name",
)

# Filler that may surround smalltalk without changing what it is: "ok thanks!",
# "hello there", "hi team". Stripped before the whole-message comparison.
_FILLER_WORDS = frozenset(
    {
        "a",
        "again",
        "all",
        "and",
        "so",
        "there",
        "team",
        "everyone",
        "guys",
        "sir",
        "madam",
        "maam",
        "ma'am",
        "folks",
        "please",
        "pls",
        "plz",
        "very",
        "much",
        # "a lot" as an intensifier: "thanks a lot". Harmless as filler because
        # a message that is only filler matches nothing and falls through.
        "lot",
        "lots",
        "really",
        "just",
        "well",
        "then",
        "now",
        "you",
        "u",
        "your",
        "my",
        "friend",
        "buddy",
        "mate",
        "bro",
        "dear",
        "hope",
        "doing",
        "fine",
        "morning",
        "evening",
        "afternoon",
        "day",
        "night",
    }
)

# A message longer than this cannot be pure smalltalk, whatever it contains.
# "thanks, but my WhatsApp connector is still showing Connected while messages
# are delayed" is 14 tokens and is unambiguously a support question.
_MAX_SMALLTALK_TOKENS = 6

# Punctuation and emoji are stripped before matching. Emoji ranges are handled
# by dropping anything that is neither alphanumeric nor an intra-word
# apostrophe; that is broader than an emoji list and needs no maintenance.
_KEEP = re.compile(r"[^a-z0-9'\s]+")
_WS = re.compile(r"\s+")

# ---------------------------------------------------------------------------
# Questions that look like smalltalk but are not
# ---------------------------------------------------------------------------
# A message containing any of these is never smalltalk, regardless of length or
# token composition. This is the guard that keeps "ok, how much?" on the RAG
# path. Deliberately generous: every token here is one that only appears in a
# genuine information request.
_QUESTION_MARKERS = frozenset(
    {
        "how",
        "what",
        "when",
        "where",
        "which",
        "why",
        "can",
        "could",
        "should",
        "would",
        "does",
        "do",
        "did",
        "is",
        "are",
        "was",
        "will",
        "cost",
        "price",
        "pricing",
        "plan",
        "refund",
        "bill",
        "billing",
        "charge",
        "sla",
        "help",
        "issue",
        "problem",
        "error",
        "broken",
        "not",
        "cant",
        "cannot",
        "need",
        "want",
        "wrong",
        "failed",
        "delayed",
    }
)

# `identity` is exempt from the marker guard: "who are you" is built entirely
# out of marker tokens, and it is still smalltalk. The phrase list for identity
# is exact-match only, so exempting it is safe.
_MARKER_EXEMPT: frozenset[str] = frozenset({"identity"})


@dataclass(frozen=True)
class SmalltalkMatch:
    """A classified non-question turn."""

    kind: SmalltalkKind
    #: The normalised message the decision was made on. Traced, never shown.
    normalised: str


def _normalise(message: str) -> str:
    """Lowercase, strip punctuation and emoji, collapse whitespace."""
    lowered = message.lower()
    stripped = _KEEP.sub(" ", lowered)
    return _WS.sub(" ", stripped).strip()


def _content_tokens(normalised: str) -> list[str]:
    """Tokens with filler removed. Filler-only input yields an empty list."""
    return [t for t in normalised.split() if t not in _FILLER_WORDS]


def _matches_phrase_set(normalised: str, tokens: list[str], phrases: tuple[str, ...]) -> bool:
    """True when the message *is* built entirely out of `phrases`.

    The test is a **complete cover**: walking the content tokens left to right,
    every one must be consumed by some phrase in the set, longest phrase first.
    So "thanks that helps" is covered by `thanks` + `that helps`, and "ok thanks"
    by `ok` + `thanks`.

    Requiring a *complete* cover is what keeps this safe. "thanks, how much is
    Growth?" leaves `how`, `much` and `growth` unconsumed, so it falls through to
    retrieval — which is the correct handling. A containment test instead of a
    cover test would have matched it on `thanks` alone and replied "Glad that
    helped!" to a pricing question.
    """
    if not tokens:
        return False
    # Longest first so "that helps" is tried before "that" could be, and so a
    # two-word phrase is never split across two single-word matches.
    ordered = sorted(phrases, key=lambda p: len(p.split()), reverse=True)
    i = 0
    while i < len(tokens):
        for phrase in ordered:
            parts = phrase.split()
            if tokens[i : i + len(parts)] == parts:
                i += len(parts)
                break
        else:
            return False
    return True


def classify_smalltalk(message: str) -> SmalltalkMatch | None:
    """Classify `message` as smalltalk, or return None to use retrieval.

    Never raises: a non-string is coerced, and every branch is a pure string
    comparison. Returning None is always the safe outcome, so any doubt resolves
    to None.
    """
    if not isinstance(message, str):
        message = str(message or "")

    normalised = _normalise(message)
    if not normalised:
        # An empty or emoji-only message. Treated as a greeting so the customer
        # gets a warm opener instead of a fallback error.
        return SmalltalkMatch(kind="greeting", normalised=normalised)

    raw_tokens = normalised.split()
    if len(raw_tokens) > _MAX_SMALLTALK_TOKENS:
        return None

    # Identity first, and exempt from the marker guard (see _MARKER_EXEMPT).
    if normalised in _IDENTITY_PHRASES:
        return SmalltalkMatch(kind="identity", normalised=normalised)

    # Any genuine question marker sends this down the retrieval path.
    if any(t in _QUESTION_MARKERS for t in raw_tokens):
        return None

    # Two token views, tried in this order, and the order is load-bearing.
    #
    # Filler stripping and multi-word phrases are in direct conflict: "morning"
    # is filler in "good morning to you" but essential to the phrase "good
    # morning", and "you" is filler in "hi you" but essential to "thank you".
    # Stripping first therefore breaks the very phrases it is meant to help.
    #
    # So the raw tokens are matched first, where multi-word phrases are still
    # intact. Only if that fails do we retry on the stripped view, which is what
    # lets "thanks a lot" and "hi team" through. Trying raw first can only ever
    # match more, never less, and never matches something the stripped view
    # would have rejected.
    for tokens in (raw_tokens, _content_tokens(normalised)):
        if not tokens:
            # Filler only ("there", "please"). Nothing to look up.
            return SmalltalkMatch(kind="greeting", normalised=normalised)
        if _matches_phrase_set(normalised, tokens, _GOODBYE_PHRASES):
            return SmalltalkMatch(kind="goodbye", normalised=normalised)
        if _matches_phrase_set(normalised, tokens, _THANKS_PHRASES):
            return SmalltalkMatch(kind="thanks", normalised=normalised)
        if _matches_phrase_set(
            normalised, tokens, _GREETING_PHRASES + _GREETING_WORDS
        ):
            return SmalltalkMatch(kind="greeting", normalised=normalised)

    return None


# ---------------------------------------------------------------------------
# Replies
# ---------------------------------------------------------------------------
# Written as a human colleague would open a chat: warm, one line, and it hands
# the turn straight back. No "how may I assist you today" — that is the phrasing
# customers read as a script.
#
# `company` is interpolated for identity only. A greeting that names the company
# reads like an IVR menu; a greeting that does not reads like a person.

_REPLIES: dict[SmalltalkKind, str] = {
    "greeting": "Hi there! What can I help you with?",
    "thanks": "Glad that helped. Anything else you need a hand with?",
    "goodbye": "Thanks for stopping by. Reach out any time you need us.",
    "identity": (
        "I'm the {company} support assistant. I can answer questions about "
        "your account, plans, and policies. What do you need?"
    ),
}


def smalltalk_reply(match: SmalltalkMatch, company: str) -> str:
    """The reply for a classified smalltalk turn."""
    template = _REPLIES[match.kind]
    return template.format(company=company)
