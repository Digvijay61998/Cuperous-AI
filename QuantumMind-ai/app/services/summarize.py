"""Free-form summarisation of a completed template submission.

This is intentionally NOT part of the RAG query pipeline. `/query/ask` embeds
the question, retrieves tenant-scoped chunks, and gates `confident` on
knowledge-base similarity — so a "summarise this booking" request, which has no
matching KB content, short-circuits to confident=false before the LLM is ever
called. Summarising arbitrary form data needs the raw provider call instead,
which is what this service uses (get_llm_provider().generate), bypassing
retrieval and the confidence gate entirely.

The backend already has a deterministic fallback (summariseSubmission), so this
service only has to produce the *nicer* version; the caller is responsible for
falling back if the call fails.
"""
import logging

from app.config import get_settings
from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.logging_utils import banner
from app.schemas import SummarizeResponse
from app.services.answer_policy import repair_text

logger = logging.getLogger("ai.summarize")

# Bound the amount of submitted data we put in the prompt. A form is a handful
# of short fields; anything past this is almost certainly a pasted blob or an
# attachment payload that adds cost without improving the confirmation.
_MAX_FIELDS = 40
_MAX_VALUE_CHARS = 500


def _humanize_key(key: str) -> str:
    return (
        key.replace("_", " ")
        .replace("-", " ")
        .strip()
        .title()
    )


def _render_value(value) -> str:
    if isinstance(value, (list, tuple)):
        return ", ".join(str(v) for v in value)
    if isinstance(value, dict):
        return ", ".join(f"{_humanize_key(str(k))}: {v}" for k, v in value.items())
    return str(value)


def _format_data(data: dict) -> str:
    lines: list[str] = []
    for i, (key, value) in enumerate(data.items()):
        if i >= _MAX_FIELDS:
            break
        if value is None or value == "":
            continue
        rendered = _render_value(value)[:_MAX_VALUE_CHARS]
        lines.append(f"- {_humanize_key(str(key))}: {rendered}")
    return "\n".join(lines)


class SummarizeService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self.settings = get_settings()
        self._provider = provider

    @property
    def provider(self) -> LLMProvider:
        if self._provider is None:
            self._provider = get_llm_provider()
        return self._provider

    def summarize_submission(
        self,
        data: dict,
        action: str | None = None,
        company_name: str | None = None,
        template_name: str | None = None,
    ) -> SummarizeResponse:
        company = company_name or "our team"
        what = action or template_name or "their request"
        formatted = _format_data(data or {})

        banner(
            logger,
            "[AI SERVICE] Summarise submission",
            {
                "Company": company,
                "Action": what,
                "Fields": len(data or {}),
            },
        )

        system_prompt = (
            f"You are a warm, concise assistant for {company}. A customer just "
            f"completed {what} through a form in chat. Write a short confirmation "
            "message (1-2 sentences) that summarises the key details they "
            "submitted and thanks them. Only state facts present in the details "
            "below - never invent times, prices, names, or availability. Do not "
            "add a subject line, greeting header, or signature; write it as a "
            "single friendly chat message."
        )
        user_prompt = (
            "Here are the details the customer submitted:\n"
            f"{formatted or '(no fields provided)'}\n\n"
            "Write the confirmation message now."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        result = self.provider.generate(messages)
        answer = repair_text(result.text) or ""

        banner(
            logger,
            "[AI SERVICE] Summary generated",
            {
                "Provider": result.provider,
                "Model": result.model,
                "Tokens": result.tokens_used,
                "Answer": (answer[:200] + "...") if len(answer) > 200 else answer,
            },
        )

        return SummarizeResponse(
            answer=answer,
            tokens_used=result.tokens_used,
            provider=result.provider,
            model=result.model,
        )
