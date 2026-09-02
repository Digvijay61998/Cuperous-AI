"""OpenAI and OpenAI-compatible providers.

Moonshot (Kimi K2) exposes an OpenAI-compatible API, so it reuses the same
client with a different base_url and API key. This is the cheapest default path
(gpt-4o-mini) and the recommended way to try Kimi K2 without self-hosting.
"""
import logging

from openai import OpenAI

from app.config import get_settings
from app.llm.base import LLMProvider, LLMResult

logger = logging.getLogger("ai.llm.openai")


class OpenAICompatibleProvider(LLMProvider):
    name = "openai"

    def __init__(
        self,
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: str,
        base_url: str,
        provider_name: str = "openai",
        timeout: float | None = None,
    ) -> None:
        super().__init__(model, temperature, max_tokens)
        if not api_key:
            raise ValueError(
                f"{provider_name} provider selected but its API key is not set"
            )
        self.name = provider_name
        # A client-level timeout is the only mechanism that actually closes the
        # socket. It is omitted entirely when not requested: passing
        # `timeout=None` to the SDK means "wait forever", which is a behaviour
        # change, not a no-op. Absent the kwarg the SDK keeps its own default.
        client_kwargs: dict = {"api_key": api_key, "base_url": base_url}
        if timeout is not None:
            client_kwargs["timeout"] = timeout
        self._client = OpenAI(**client_kwargs)

    def generate(self, messages: list[dict]) -> LLMResult:
        completion = self._client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        choice = completion.choices[0]
        text = (choice.message.content or "").strip()
        usage = completion.usage
        tokens = usage.total_tokens if usage else 0

        logger.info(
            "[MODEL RESPONSE] provider=%s model=%s finish_reason=%s "
            "prompt_tokens=%s completion_tokens=%s total_tokens=%s",
            self.name,
            completion.model,
            choice.finish_reason,
            getattr(usage, "prompt_tokens", "?"),
            getattr(usage, "completion_tokens", "?"),
            tokens,
        )
        if get_settings().debug_logs_enabled:
            logger.debug("[MODEL RESPONSE] raw completion: %s", completion.model_dump())

        return LLMResult(
            text=text,
            tokens_used=tokens,
            model=self.model,
            provider=self.name,
            prompt_tokens=getattr(usage, "prompt_tokens", 0) or 0,
            completion_tokens=getattr(usage, "completion_tokens", 0) or 0,
            finish_reason=choice.finish_reason,
        )
