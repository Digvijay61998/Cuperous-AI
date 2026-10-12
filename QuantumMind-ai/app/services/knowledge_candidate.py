"""Generalise an agent resolution into a reusable Q&A (crm-incident-handover R21.1).

Input is pre-masked by the backend. The model rewrites one customer's problem
and the agent's fix into a question any customer could ask and an answer that
works for all of them. The output is checked here (lengths, no personal data,
no ticket refs, no leftover placeholders); a bad result raises so the backend
retries and finally records the failure (R12.9). The backend runs its own PII
guard again before anything is stored.
"""
from __future__ import annotations

import logging
import re

from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.schemas import (
    KNOWLEDGE_ANSWER_MAX,
    KNOWLEDGE_ANSWER_MIN,
    KNOWLEDGE_QUESTION_MAX,
    KNOWLEDGE_QUESTION_MIN,
    KnowledgeCandidateRequest,
    KnowledgeCandidateResponse,
)
from app.services.profile_merge import ProfileMergeError, parse_json_object
from app.tracing import span

logger = logging.getLogger("ai.knowledge_candidate")

SYSTEM_PROMPT = (
    "You turn one solved customer support case into a reusable FAQ entry. "
    "Reply with ONE JSON object and nothing else: "
    '{"question": string, "answer": string}\n'
    "Rules:\n"
    f"- question: {KNOWLEDGE_QUESTION_MIN} to {KNOWLEDGE_QUESTION_MAX} characters, written as "
    "a general question any customer could ask about this kind of problem.\n"
    f"- answer: {KNOWLEDGE_ANSWER_MIN} to {KNOWLEDGE_ANSWER_MAX} characters, the general fix "
    "or explanation from the agent's resolution, addressed to a customer.\n"
    "- Never include names of people, email addresses, phone numbers, ticket or "
    "reference numbers, account numbers, addresses, or anything that identifies "
    "one customer.\n"
    "- Placeholders like [email], [phone], [secure], [name] and [ref] are hidden data: drop them, "
    "never restore them.\n"
    "- Only use what the resolution says. Do not invent steps, prices or promises.\n"
    "No markdown, no code fences, no explanation."
)

# Output guard. Deliberately broad: a false reject only costs one learned entry.
_EMAIL_RE = re.compile(r"[A-Za-z0-9!#$%&'*+/=?^_`{|}~.\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}")
_PHONE_RE = re.compile(r"\+?\d[\d\s().\-]{5,}\d")
_TICKET_RE = re.compile(r"\bSR[_\-][A-Za-z0-9_\-]{4,}", re.IGNORECASE)
_PLACEHOLDER_RE = re.compile(r"\[(?:email|phone|secure|name|ref)\]", re.IGNORECASE)


class KnowledgeCandidateError(ProfileMergeError):
    """The model output is not a usable, PII-free Q&A."""


def _digits(s: str) -> int:
    return len(re.sub(r"\D", "", s))


def personal_data_reason(text: str) -> str | None:
    """Why ``text`` is not safe to publish, or None."""
    if _EMAIL_RE.search(text):
        return "contains an email address"
    for m in _PHONE_RE.finditer(text):
        if _digits(m.group(0)) >= 7:
            return "contains a phone number"
    if _TICKET_RE.search(text):
        return "contains a ticket reference"
    if _PLACEHOLDER_RE.search(text):
        return "contains a hidden-data placeholder"
    return None


def _clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip() if isinstance(value, str) else ""


class KnowledgeCandidateService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._provider = provider

    @property
    def provider(self) -> LLMProvider:
        if self._provider is None:
            self._provider = get_llm_provider()
        return self._provider

    def generate(self, request: KnowledgeCandidateRequest) -> KnowledgeCandidateResponse:
        user = (
            (f"Company: {request.company}\n" if request.company else "")
            + f"Customer problem:\n{request.problem.strip()}\n\n"
            + f"Agent resolution:\n{request.resolution.strip()}"
        )
        provider = self.provider
        with span("knowledge_candidate", provider=getattr(provider, "name", None)) as sp:
            result = provider.generate(
                [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user}]
            )
            sp.record_tokens(
                prompt=getattr(result, "prompt_tokens", 0),
                completion=getattr(result, "completion_tokens", 0),
                total=getattr(result, "tokens_used", 0),
                model=getattr(result, "model", None),
            )
        try:
            data = parse_json_object(result.text)
        except ProfileMergeError as exc:
            raise KnowledgeCandidateError(str(exc)) from exc
        question, answer = _clean(data.get("question")), _clean(data.get("answer"))
        if not (KNOWLEDGE_QUESTION_MIN <= len(question) <= KNOWLEDGE_QUESTION_MAX):
            raise KnowledgeCandidateError(f"question length {len(question)} out of range")
        if not (KNOWLEDGE_ANSWER_MIN <= len(answer) <= KNOWLEDGE_ANSWER_MAX):
            raise KnowledgeCandidateError(f"answer length {len(answer)} out of range")
        for label, text in (("question", question), ("answer", answer)):
            reason = personal_data_reason(text)
            if reason:
                raise KnowledgeCandidateError(f"{label} {reason}")
        return KnowledgeCandidateResponse(
            question=question,
            answer=answer,
            tokens_used=int(getattr(result, "tokens_used", 0) or 0),
            provider=getattr(provider, "name", None) or "none",
            model=getattr(provider, "model", None) or "none",
        )
