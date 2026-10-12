"""Structured "this visitor needs a human" signal (AI_Handover_Signal).

The backend raises an agent alert ONLY on `QueryResponse.handover is True`; it
never reads the answer text. So everything that decides `handover` lives here,
and it is deliberately conservative: a false positive pings a human for nothing,
which is exactly the noise this signal exists to remove.

Two sources, both pure functions:

1. ``detect_human_request`` — a deterministic check on the VISITOR'S QUESTION
   for an explicit request to speak to a person ("talk to an agent", "real
   person please", "agent se baat karni hai"). Never applied to the answer: an
   answer that says "I can't connect you to an agent" must not escalate.

2. ``extract_handover_tag`` — the model may end its answer with a machine tag
   ``<<HANDOVER: reason>>`` when the request needs something only a human can do.
   The tag is stripped before the answer is returned, so the visitor never sees
   it, and its presence (not any wording) is the signal.
"""
from __future__ import annotations

import re

#: Upper bound mirrored by the backend (Req 3.8).
MAX_HANDOVER_REASON_LENGTH = 200

EXPLICIT_REQUEST_REASON = "Visitor asked to speak with a human"
AI_DEFAULT_REASON = "Request needs a human colleague"

_TARGET = (
    r"(?:human(?:\s+being)?|person|people|agent|representative|rep|someone|somebody|"
    r"staff|operator|specialist|executive|engineer|team|support(?:\s+team)?|"
    r"customer\s+(?:service|support|care)|live\s+(?:agent|chat|person|support))"
)
_FILLER = r"(?:(?:a|an|the|your|some|real|live|actual|human|member\s+of|of|staff|support)\s+){0,4}"

_EXPLICIT_PATTERNS = [
    # talk/speak/chat to|with (a) <target>
    rf"\b(?:talk|speak|chat)(?:\s+(?:directly|now))?\s+(?:to|with)\s+{_FILLER}{_TARGET}\b",
    # connect/transfer/put/get me (to|through|with) <target>
    rf"\b(?:connect|transfer|put|get|forward|pass)\s+me\s+(?:to|through(?:\s+to)?|with)?\s*{_FILLER}{_TARGET}\b",
    # want/need/request a human / real person / live agent / representative
    r"\b(?:want|need|request|prefer|ask\s+for)\s+(?:to\s+(?:talk|speak)\s+(?:to|with)\s+)?(?:a|an|some)?\s*"
    r"(?:human|real\s+person|actual\s+person|live\s+(?:agent|person|chat|support)|representative|human\s+agent)\b",
    # real/live/actual person|human|agent anywhere ("real person please")
    r"\b(?:real|live|actual)\s+(?:person|human|agent)\b",
    # human agent / human support
    r"\bhuman\s+(?:agent|support|help|assistance)\b",
    # a bare one-word request: "agent", "human please", "representative!"
    r"^(?:an?\s+)?(?:agent|human|representative|operator|person)(?:\s+(?:please|pls|now))?$",
    # Hindi / Marathi (romanised)
    r"\b(?:agent|insaan|insan|aadmi|vyakti|kisi|manus|mansa|maanus)\s*(?:se|sh?i)\s+(?:baat|bol|bolaych|bolaycha|bolayche|bolnay)",
    r"\b(?:baat|bolna|bolaycha)\s+(?:karni|karna|karvaa?o|aahe)\b.*\b(?:agent|insaan|insan|executive)\b",
    # Devanagari
    r"(?:एजेंट|इंसान|किसी\s+व्यक्ति|प्रतिनिधि|माणसा|एजंट)\s*(?:से|शी)\s*(?:बात|बोल)",
]
_EXPLICIT_RE = [re.compile(p, re.IGNORECASE | re.UNICODE) for p in _EXPLICIT_PATTERNS]

# A negation in the few words before a match cancels it:
# "I don't want to talk to an agent", "no need to speak to a person".
_NEGATION_RE = re.compile(
    r"\b(?:don'?t|do\s+not|dont|never|no\s+need\s+to|not|without|nahi|nako)\b(?:\s+\S+){0,3}\s*$",
    re.IGNORECASE,
)

# The model's machine tag. Tolerant of spacing/case and a missing colon, and of
# the tag appearing anywhere (models do not always put it last).
_TAG_RE = re.compile(r"<<\s*HANDOVER\s*:?\s*(.*?)\s*>>", re.IGNORECASE | re.DOTALL)

HANDOVER_TAG_INSTRUCTION = """
# Handing over to a human (machine signal)
If the customer explicitly asks to speak with a person, OR their request needs \
something only a human colleague can do (an account change, a booking, a \
complaint, a refund or credit decision, an on-site visit, or an emergency or \
safety issue), answer them as usual and then add ONE final line, exactly in \
this form:
<<HANDOVER: a short reason, under 20 words>>
The customer never sees that line. Do not mention it, and do not tell the \
customer you are transferring them. Do NOT add it when you can fully answer \
from the reference, and never add it just because the words "agent", "human" \
or "support" appear in the question or the answer.
"""


def _normalise(text: str) -> str:
    text = re.sub(r"\s+", " ", str(text or "")).strip().lower()
    return re.sub(r"^[^\w\u0900-\u097F]+|[^\w\u0900-\u097F]+$", "", text)


def detect_human_request(question: str, company: str | None = None) -> str | None:
    """Return a reason when the visitor explicitly asks for a human, else None.

    ``company`` lets "talk to KONE" count as asking for the company's people.
    """
    text = _normalise(question)
    if not text:
        return None

    patterns = list(_EXPLICIT_RE)
    name = _normalise(company) if company else ""
    # "our company" is QueryService's placeholder when no name is configured.
    if name and name != "our company":
        patterns.append(
            re.compile(
                rf"\b(?:talk|speak|chat)\s+(?:to|with)\s+(?:someone\s+(?:at|from)\s+)?{re.escape(name)}\b",
                re.IGNORECASE,
            )
        )

    for rx in patterns:
        for m in rx.finditer(text):
            if _NEGATION_RE.search(text[: m.start()]):
                continue
            return EXPLICIT_REQUEST_REASON
    return None


def extract_handover_tag(answer: str | None) -> tuple[str | None, str | None]:
    """Strip every handover tag from ``answer``.

    Returns ``(clean_answer, reason)`` where ``reason`` is None when no tag was
    present. A tag with no text yields the default reason. ``clean_answer`` keeps
    ``None`` as ``None``.
    """
    if answer is None:
        return None, None
    reasons = [m.group(1).strip() for m in _TAG_RE.finditer(answer)]
    if not reasons:
        return answer, None
    clean = _TAG_RE.sub("", answer)
    clean = re.sub(r"[ \t]+\n", "\n", clean)
    clean = re.sub(r"\n{3,}", "\n\n", clean).strip()
    reason = next((r for r in reasons if r), "") or AI_DEFAULT_REASON
    return clean, truncate_reason(reason)


def truncate_reason(reason: str | None) -> str | None:
    if reason is None:
        return None
    reason = re.sub(r"\s+", " ", reason).strip()
    return reason[:MAX_HANDOVER_REASON_LENGTH] or None
