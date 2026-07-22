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
