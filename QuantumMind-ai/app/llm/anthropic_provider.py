"""Anthropic (Claude) provider.

Anthropic's API keeps the system prompt separate from the message list, so we
split it out before calling the SDK.
"""
import logging

from anthropic import Anthropic

from app.llm.base import LLMProvider, LLMResult

logger = logging.getLogger(__name__)


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(
        self,
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: str,
    ) -> None:
        super().__init__(model, temperature, max_tokens)
        if not api_key:
            raise ValueError("anthropic provider selected but ANTHROPIC_API_KEY is not set")
        self._client = Anthropic(api_key=api_key)

    def generate(self, messages: list[dict]) -> LLMResult:
        # Extract the system prompt; Anthropic takes it as a top-level arg.
        system_parts = [m["content"] for m in messages if m["role"] == "system"]
        system_prompt = "\n\n".join(system_parts)
        chat = [m for m in messages if m["role"] != "system"]

        response = self._client.messages.create(
            model=self.model,
            system=system_prompt or None,
            messages=chat,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        text = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        ).strip()
        tokens = 0
        if getattr(response, "usage", None):
            tokens = (response.usage.input_tokens or 0) + (response.usage.output_tokens or 0)
        return LLMResult(
            text=text,
            tokens_used=tokens,
            model=self.model,
            provider=self.name,
        )
