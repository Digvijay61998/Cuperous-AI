"""LLM provider abstraction.

A provider takes a list of chat messages and returns generated text plus a token
count. Concrete providers wrap OpenAI, Moonshot (Kimi K2), or Anthropic. Swapping
providers is a config change (LLM_PROVIDER), not a code change.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class LLMResult:
    text: str
    tokens_used: int
    model: str
    provider: str
    # Split token counts, when the provider reports them. Needed for cost
    # attribution in tracing (prompt and completion tokens are priced
    # differently). Default 0 so existing callers and fake providers in tests
    # keep working unchanged.
    prompt_tokens: int = 0
    completion_tokens: int = 0
    # Provider-reported stop reason, when available. Useful for spotting silent
    # truncation against llm_max_tokens.
    finish_reason: str | None = None


class LLMProvider(ABC):
    """Common interface every LLM backend implements."""

    name: str = "base"

    def __init__(self, model: str, temperature: float, max_tokens: int) -> None:
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    @abstractmethod
    def generate(self, messages: list[dict]) -> LLMResult:
        """Generate a completion.

        ``messages`` follows the OpenAI chat format:
        ``[{"role": "system"|"user"|"assistant", "content": "..."}]``.
        """
        raise NotImplementedError
