"""Summarise one service request for the agent (crm-plugins-service-desk R15).

Input is masked by the backend. The model returns four short fields as JSON.
The output is checked: lengths, and no emails, phones or SR references (the
same guard as learned knowledge). A bad result raises so the backend keeps
the previous summary and shows "Summary not available" (R15.5).
"""
from __future__ import annotations

import logging
import re

from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.schemas import (
    SR_SUMMARY_FIELD_MAX,
    ServiceRequestSummaryRequest,
    ServiceRequestSummaryResponse,
)
from app.services.knowledge_candidate import personal_data_reason
from app.services.profile_merge import ProfileMergeError, parse_json_object
from app.tracing import span

logger = logging.getLogger("ai.service_request_summary")

FIELDS = ("overview", "customer_ask", "actions_taken", "next_step")
# Keep the prompt bounded: the newest lines matter most for "what next".
MAX_LINES = 200

SYSTEM_PROMPT = (
    "You summarise one customer service request for the support agent who will handle it. "
    "Reply with ONE JSON object and nothing else: "
    '{"overview": string, "customer_ask": string, "actions_taken": string, "next_step": string}\n'
    "Rules:\n"
    f"- Each field at most {SR_SUMMARY_FIELD_MAX} characters, plain sentences.\n"
    "- overview: what this request is about in one or two sentences.\n"
    "- customer_ask: what the customer wants.\n"
    "- actions_taken: what the bot or agents already did or told the customer; "
    '"Nothing yet." when nothing was done.\n'
    "- next_step: the most useful next action for the agent.\n"
    "- Never include names of people, email addresses, phone numbers, ticket or reference "
    "numbers. Placeholders like [email], [phone], [secure], [name], [ref] are hidden data: "
    "drop them, never restore them.\n"
    "- Only use what the request and the chat say. Do not invent facts.\n"
    "- Write in the language given, else in the customer's language.\n"
    "No markdown, no code fences, no explanation."
)


class ServiceRequestSummaryError(ProfileMergeError):
    """The model output is not a usable, PII-free summary."""


def _clean(value: object) -> str:
    return re.sub(r"\s+", " ", value).strip() if isinstance(value, str) else ""


class ServiceRequestSummaryService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._provider = provider

    @property
    def provider(self) -> LLMProvider:
        if self._provider is None:
            self._provider = get_llm_provider()
        return self._provider

    def summarize(self, request: ServiceRequestSummaryRequest) -> ServiceRequestSummaryResponse:
        lines = request.transcript[-MAX_LINES:]
        chat = "\n".join(f"{(l.from_ or 'unknown')}: {l.text.strip()}" for l in lines if l.text.strip())
        user = (
            (f"Language: {request.language}\n" if request.language else "")
            + f"Subject: {request.subject.strip()}\n"
            + (f"Description:\n{request.description.strip()}\n" if request.description else "")
            + (f"\nChat:\n{chat}" if chat else "\nChat: (none)")
        )
        provider = self.provider
        with span("service_request_summary", provider=getattr(provider, "name", None)) as sp:
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
            raise ServiceRequestSummaryError(str(exc)) from exc
        out: dict[str, str] = {}
        for field in FIELDS:
            text = _clean(data.get(field))
            if not text:
                raise ServiceRequestSummaryError(f"{field} is empty")
            if len(text) > SR_SUMMARY_FIELD_MAX:
                text = text[: SR_SUMMARY_FIELD_MAX - 1].rstrip() + "…"
            reason = personal_data_reason(text)
            if reason:
                raise ServiceRequestSummaryError(f"{field} {reason}")
            out[field] = text
        return ServiceRequestSummaryResponse(
            **out,
            tokens_used=int(getattr(result, "tokens_used", 0) or 0),
            provider=getattr(provider, "name", None) or "none",
            model=getattr(provider, "model", None) or "none",
        )
