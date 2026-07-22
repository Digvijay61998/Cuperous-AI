"""LLM provider factory: picks a backend based on settings.llm_provider."""
import logging
from functools import lru_cache

from app.config import Settings, get_settings
from app.llm.anthropic_provider import AnthropicProvider
from app.llm.base import LLMProvider
from app.llm.openai_provider import OpenAICompatibleProvider

logger = logging.getLogger(__name__)


def build_provider(settings: Settings) -> LLMProvider:
    provider = settings.llm_provider.lower()
    logger.info("Initializing LLM provider: %s (model=%s)", provider, settings.llm_model)

    if provider == "openai":
        return OpenAICompatibleProvider(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            provider_name="openai",
        )
    if provider == "moonshot":
        # Moonshot (Kimi K2) is OpenAI-compatible: same client, different host.
        return OpenAICompatibleProvider(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            api_key=settings.moonshot_api_key,
            base_url=settings.moonshot_base_url,
            provider_name="moonshot",
        )
    if provider == "anthropic":
        return AnthropicProvider(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            api_key=settings.anthropic_api_key,
        )

    raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")


@lru_cache
def get_llm_provider() -> LLMProvider:
    """Cached provider singleton."""
    return build_provider(get_settings())
