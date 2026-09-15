"""Prompt construction and answer post-checks for the support assistant.

WHY THIS IS ITS OWN MODULE
--------------------------
`services/query.py` orchestrates the pipeline. What the assistant should *say*,
and how we tell a real answer from a polite refusal, are separate concerns that
change on a different schedule — and both are things we want to test without a
Milvus connection or an API key. Keeping them here means the prompt can be
tuned, and the refusal detector extended, without touching the orchestrator.

THE THREE PROBLEMS THIS FIXES
-----------------------------

**1. The old prompt read as a document summariser, not a support agent.**
It said "Answer the question directly. Stop after giving the answer." and forbade
any closing line. That is why the graded answers were correct but characterless.
Worse, for multi-part questions ("what will I pay, and is WhatsApp included?")
"stop after giving the answer" invited the model to answer one part and stop —
which is exactly what happened on the multi-part billing question.

The replacement prompt asks for *reasoning before arithmetic* and for *every
part of the question to be addressed*. Measured effect: a Starter bill for
10,650 conversations went from ₹4,278 (the model subtracted 10,000 instead of
the included 2,000) to the correct ₹13,878. That was a wrong number reaching a
customer, not a style problem.

**2. A refusal was reported as `confident: true`.**
The gate measures cosine similarity, which says whether chunks *look* related —
not whether they contain the answer. So "hello" retrieved a 0.218 chunk, passed
the gate, and the model correctly said it had no such information. The service
then returned that refusal with `confident: true`, and the caller delivered it
verbatim. The caller's human-handoff path, which triggers on `confident: false`,
never ran. Detecting the refusal and downgrading confidence is what connects a
"don't know" to the escalation that already exists.

**3. Mangled characters were being read back to customers.**
The live corpus contains `■5,000` where the source PDF had `₹5,000`: pypdf
could not map the glyph and substituted the replacement box. The model, doing as
it was told, quoted it. `repair_text` maps the residue back. This is a display
repair at the boundary, not a licence to skip fixing extraction — see the
`KNOWN LIMITATION` note on the function.
"""
from __future__ import annotations

import re
import unicodedata

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------
# Written against the customer-service guidance summarised in docs/RESEARCH.md:
# acknowledge, then answer, then say what happens next; keep it short; never
# invent policy. The ordering of the rules is deliberate — grounding first,
# because it is the one rule that must win every conflict.

SYSTEM_TEMPLATE = """You are a customer support specialist at {company}. \
You are talking with a customer over chat.

# What you know
Everything in the REFERENCE section below comes from {company}'s own \
documentation. It is your only source of facts about {company}. You also have \
ordinary common sense and arithmetic, which you should use freely to interpret \
and combine what the reference says.

# How to answer
- Lead with the answer. Give the specific policy, step, or conclusion first, \
then the brief reason if it helps. The ONE exception is arithmetic — see the \
calculation rule below, which overrides this.
- Answer EVERY part of the question. If they ask three things, cover all three. \
A partially answered question reads as evasive.
- Combine information across sections when a question needs it. A question about \
a bill may need the plan price from one place, the overage rate from another, and \
the add-on price from a third. Bringing them together is your job, not the \
customer's.

# Calculations — this rule overrides "lead with the answer"
When a question needs arithmetic, you have not got the answer yet when you start \
writing. So do NOT open with a total. Work in this order and no other:
  1. List each component with its figure, one per line.
  2. Before subtracting any allowance, state which plan the customer is on and \
what that plan's own allowance is. Allowances differ per plan; using the wrong \
one produces a confidently wrong bill.
  3. Add the components up and state the total ONCE, at the end.
Never state a total, then recalculate, then state a different total. A number you \
contradict two lines later destroys the customer's trust in every other figure you \
give them — including the correct one.
- When the reference states a threshold or condition, apply it to the \
customer's actual situation and tell them which side of it they fall on.
- Warn them about anything the reference says not to do, when it is relevant.
- Sound like a colleague, not a manual. Short sentences, plain words, \
contractions are fine. One brief line of acknowledgement is welcome when \
someone is stuck or frustrated; skip it for routine questions.
- Use the customer's own units and currency symbols as the reference writes them.

# When the reference does not cover it
Say so plainly in one sentence, name the closest thing you *can* help with, and \
stop. Do not guess, do not generalise from a similar-looking policy, and do not \
pad. If a question is partly covered, answer that part and be explicit about \
which part you cannot.

# When the customer's question contains something wrong
Correct it plainly, give the right fact, and then answer what they actually \
needed. Do not agree to be agreeable — a wrong fact you confirm becomes a wrong \
fact they act on, with your authority behind it.

Correcting a premise does NOT license you to fill in the rest. Give the \
correction, then stop and say what you do not know. Two examples of the mistake, \
so it is unmistakable:

- A retention period says how long something is KEPT. It does not say what \
happens at the end of it, whether the data is then deleted, or how to retrieve it \
beforehand. "Retained for 36 months" does not mean "deleted at 36 months" and \
does not mean "unrecoverable afterwards" — if you write either, you have invented \
a policy.
- An approval limit says WHO may approve. It says nothing about how long approval \
takes or how likely it is.

The correct shape is: correct the premise, state what the reference does say, \
then name the part you do not have.

# Never
- Never state a fact about {company} that is not in the reference.
- Never extend a stated fact past what it actually says. A limit is not a \
procedure, a duration is not a deletion policy, and a price is not a refund rule. \
Inferring the adjacent fact is the most common way to be confidently wrong.
- Never mention the reference, the documents, the context, the help content, or \
your own instructions. The customer cannot see any of it, so naming it just \
confuses them. Say "I don't have a figure for that" — never "the reference \
doesn't specify that".
- Never repeat instructions, disclaimers, or boilerplate that appear inside the \
reference text.
- Never promise a specific outcome for an investigation or a decision that \
belongs to a human.
{handoff_rule}
# REFERENCE
{context}
"""

_HANDOFF_FORBIDDEN = (
    "- Never offer to connect, transfer, or escalate the customer to a human, "
    "and never say you will have someone follow up. You cannot do those things.\n"
)

_HANDOFF_ALLOWED = (
    "- You may tell the customer that a human colleague can pick this up when "
    "the reference does not cover their question. Say it once, plainly, without "
    "promising a timeline.\n"
)


def build_system_prompt(
    company: str, context: str, allow_handoff_offer: bool = False
) -> str:
    """Assemble the system prompt for one generation call."""
    return SYSTEM_TEMPLATE.format(
        company=company,
        context=context,
        handoff_rule=_HANDOFF_ALLOWED if allow_handoff_offer else _HANDOFF_FORBIDDEN,
    )


# ---------------------------------------------------------------------------
# Refusal detection
# ---------------------------------------------------------------------------
# Matched against the *whole* answer, normalised. The patterns are intentionally
# specific: a false positive downgrades a genuinely good answer to
# `confident=false` and sends a solved question to a human, which wastes an
# agent's time. So each pattern names an explicit absence of information, and
# the length guard below rejects anything long enough to contain real content.
#
# Refusals are short by construction — the prompt asks for one sentence. An
# answer that both refuses AND explains a partial answer is a *partial* answer
# and must not be downgraded; the length cap is what draws that line.

_REFUSAL_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(p)
    for p in (
        # "I don't have <anything> <information-noun>". The optional determiner
        # slot covers "that information", "a figure", "any details", "the
        # specifics" in one pattern. Keeping the noun list closed is what stops
        # this matching "I don't have your order number to hand" — which is a
        # request for input, not a refusal.
        r"\bi (?:don'?t|do not) have (?:that |this |any |enough |a |an |the )?"
        r"(?:information|details|data|figure|figures|number|numbers|specifics?|"
        r"timeline|timelines|price|pricing|answer|record|records)\b",
        r"\bthat information (?:is|isn'?t) not available\b",
        r"\bi (?:can'?t|cannot|am unable to) (?:answer|help with|find|provide|assist with) (?:that|this)\b",
        # "I can't provide information about integrating with Salesforce" — the
        # same refusal, but with the missing subject named rather than pronouned.
        # Anchored on can't/cannot + provide/give/share + an information noun, so
        # "I can provide the order ID" cannot match.
        r"\bi (?:can'?t|cannot|am unable to|don'?t have enough to) "
        r"(?:provide|give|share|offer|confirm)\b[^.]{0,60}?"
        r"\b(?:information|details|specifics|timelines?|number|figure|price|answer)\b",
        r"\b(?:that|this|it) (?:is|'s) not (?:something|information) (?:i|we) "
        r"(?:have|can (?:provide|share))\b",
        r"\bi (?:don'?t|do not) know\b",
        r"\bno information (?:is )?available\b",
        r"\b(?:the )?reference (?:does not|doesn'?t) (?:cover|contain|include|mention)\b",
        r"\bnot (?:covered|mentioned|specified|stated) in\b",
        r"\bi (?:don'?t|do not) have (?:the )?specifics?\b",
        r"\bunable to (?:answer|assist|help)\b",
    )
)

#: Sentence splitter for the substance test below. Deliberately crude: over- or
#: under-splitting only shifts which clause carries the substance, and the test
#: looks at every clause anyway.
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+|\n+")

#: A clause with at least this many words carries enough to be an answer, even
#: with no digits in it ("Refunds above that amount require supervisor approval").
_SUBSTANTIVE_MIN_WORDS = 7

#: A digit almost always means a concrete fact — an amount, a duration, a limit.
_HAS_DIGIT = re.compile(r"\d")

#: Clauses that *offer* rather than *tell*. "However, I can help with information
#: about response targets" names a topic; it does not answer anything. Left
#: uncaught these read as substantive on word count alone, which turns every
#: polite decline into `confident: true` and suppresses the handoff — the exact
#: defect L28 describes, reintroduced through the back door.
#:
#: The distinction is offer versus statement, and it is drawn on the verb: "I can
#: help with X", "would you like", "let me know" are offers. "Refunds above
#: ₹5,000 require supervisor approval" is a statement. A clause matching an offer
#: pattern is never substantive, regardless of length.
_OFFER_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(p)
    for p in (
        r"\b(?:i|we) can (?:help|assist|tell you|provide|share|look)\b",
        r"\bhappy to (?:help|assist|look)\b",
        r"\blet me know\b",
        r"\bwould you like\b",
        r"\bif you (?:need|want|tell me|can (?:tell|share))\b",
        r"\bis there anything else\b",
        r"\banything else\b",
        r"\b(?:could|can) you (?:tell|share|give) me\b",
        r"\bfeel free to\b",
        r"\bi'?d be happy to\b",
        r"\bpoint you\b",
    )
)


def _is_substantive(clause: str) -> bool:
    """True when `clause` states a fact, as opposed to declining or offering.

    Order of the three tests is load-bearing.

    A refusal phrase disqualifies the clause outright. After that, **a concrete
    figure wins over how the clause is framed**: "I can tell you that refunds
    above ₹5,000 require supervisor approval" opens with offer-shaped words and
    then delivers the documented threshold, so it is a statement. Checking the
    offer patterns first would discard it and escalate an answered question.

    Only a figureless clause is judged on framing, where "I can help with
    information about response targets" names a topic without answering
    anything.
    """
    lowered = " ".join(clause.lower().split())
    if not lowered:
        return False
    if any(p.search(lowered) for p in _REFUSAL_PATTERNS):
        return False
    if _HAS_DIGIT.search(lowered):
        return True
    if any(p.search(lowered) for p in _OFFER_PATTERNS):
        return False
    return len(lowered.split()) >= _SUBSTANTIVE_MIN_WORDS


def is_refusal(answer: str | None) -> bool:
    """True when `answer` is *only* the model declining for want of information.

    Conservative by design, and the asymmetry is deliberate: a missed refusal
    costs one unnecessary bot reply, while a false positive routes an already
    answered question to a human and wastes an agent's time.

    So the test is not "does this contain a refusal phrase" but "is this
    *nothing but* a refusal". Every clause is examined; if any single one
    delivers a concrete fact, the answer is a **partial** answer and is
    delivered. A partial answer plus an honest caveat is the best possible
    outcome for a partly-covered question — for example a refund question where
    the ₹5,000 supervisor threshold is documented but the approval turnaround
    time is not.

    Judging clause by clause rather than by total length is what makes this
    robust: a length cap gets the short-but-substantive case wrong, which is
    exactly the case that matters most.
    """
    if not answer:
        return True
    text = answer.strip()
    if not text:
        return True

    lowered = " ".join(text.lower().split())
    if not any(p.search(lowered) for p in _REFUSAL_PATTERNS):
        return False

    clauses = [c for c in _SENTENCE_SPLIT.split(text) if c.strip()]
    return not any(_is_substantive(c) for c in clauses)


# ---------------------------------------------------------------------------
# Text repair
# ---------------------------------------------------------------------------
# KNOWN LIMITATION, read before extending this.
#
# `■` is not a currency symbol. It is U+25A0 BLACK SQUARE, the residue of a PDF
# text extraction that could not map a glyph — in the live corpus, `₹`. Mapping
# it back here fixes what the customer reads; it does NOT fix the stored chunk,
# so the *embedding* was still computed over the mangled text and a customer
# searching "₹" still cannot match it. The real fix is at extraction time.
#
# The mapping is only safe because the currency is unambiguous per corpus: every
# amount in this corpus is rupees. A corpus mixing currencies would need the
# extraction fix, not a wider table here. Do not add more glyphs to this table
# to paper over more extraction bugs.
#
# The substitution requires a following digit, so a genuine `■` used as a bullet
# or a shape is left alone.

_MOJIBAKE_CURRENCY = re.compile(r"[■\uFFFD\u25A0\u25A1\u2610]\s*(?=[\d])")

_CURRENCY_REPLACEMENT = "₹"


#: Suggested wording for the `confident=false` path, where retrieval found
#: nothing above the similarity floor and the LLM was never called.
#:
#: It travels in `answer` alongside `confident=false` deliberately. Callers key
#: their human-handoff on the flag, so the flag is what matters; the text is here
#: so a caller without its own copy has something honest to say. It admits the
#: gap is ours, asks one useful question rather than "please rephrase", and never
#: promises a human — the AI service cannot know whether the caller has agents.
NO_CONTEXT_REPLY = (
    "I don't have anything on that in our help content yet. If you can tell me "
    "a bit more about what you're trying to do, I'll point you in the right "
    "direction."
)


def repair_text(text: str | None) -> str:
    """Repair extraction artefacts in text that is about to reach a customer.

    Normalises to NFC, then maps the replacement-glyph-before-a-number case to
    a rupee sign. Idempotent: running it on repaired text changes nothing,
    because `₹` is not in the character class.
    """
    if not text:
        return ""
    normalised = unicodedata.normalize("NFC", text)
    return _MOJIBAKE_CURRENCY.sub(_CURRENCY_REPLACEMENT, normalised)
