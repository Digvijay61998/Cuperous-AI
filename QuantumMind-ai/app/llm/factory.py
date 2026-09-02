"""LLM provider factory.

Two entry points, deliberately split:

``build_provider(provider, model, temperature, max_tokens, ...)``
    Constructs a provider. The four *configuration* values arrive as explicit
    arguments — none of them is read from an ambient ``Settings`` (Req 5 c14).
    Credentials (``api_key``, ``base_url``) still come from ``Settings``, which
    is the only sanctioned config source (CLAUDE.md rule 8).

``get_provider(provider, model, temperature, max_tokens)``
    The cached lookup. Keyed on exactly those four scalars and nothing else
    (Req 5 c13).

Why the split rather than one ``lru_cache``'d ``build_provider``: caching the
constructor would force ``settings`` into the cache key, and ``Settings`` is a
Pydantic model — hashable only by identity, which would make the key
process-global by the back door. Worse, a credential in an ``lru_cache`` key is
both a leak surface and a correctness bug: two callers asking for the same four
configuration values must share one instance regardless of how their
credentials resolved. Keeping the key provably four scalars requires the
credential-reading code to live outside the cached function.
"""
import logging
from functools import lru_cache
from typing import Literal

from app.config import Settings, get_settings
from app.llm.anthropic_provider import AnthropicProvider
from app.llm.base import LLMProvider
from app.llm.openai_provider import OpenAICompatibleProvider

logger = logging.getLogger(__name__)

ProviderName = Literal["openai", "moonshot", "anthropic"]


def build_provider(
    provider: ProviderName | str,
    model: str,
    temperature: float,
    max_tokens: int,
    settings: Settings | None = None,
    timeout: float | None = None,
) -> LLMProvider:
    """Construct a provider bound to the four given configuration values.

    ``settings`` supplies credentials only. ``timeout`` is forwarded to the SDK
    client constructor when given; ``None`` means "leave the SDK default alone",
    so the generation path is byte-identical to its pre-Phase-1 behaviour.
    """
    settings = settings or get_settings()
    name = (provider or "").strip().lower()
    logger.info("Initializing LLM provider: %s (model=%s)", name, model)

    if name == "openai":
        return OpenAICompatibleProvider(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            provider_name="openai",
            timeout=timeout,
        )
    if name == "moonshot":
        # Moonshot (Kimi K2) is OpenAI-compatible: same client, different host.
        return OpenAICompatibleProvider(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=settings.moonshot_api_key,
            base_url=settings.moonshot_base_url,
            provider_name="moonshot",
            timeout=timeout,
        )
    if name == "anthropic":
        return AnthropicProvider(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=settings.anthropic_api_key,
            timeout=timeout,
        )

    raise ValueError(f"Unknown LLM provider: {provider}")


@lru_cache(maxsize=32)
def get_provider(
    provider: str, model: str, temperature: float, max_tokens: int
) -> LLMProvider:
    """Cached on exactly those four values (Req 5 c13).

    Credentials are read inside ``build_provider`` and never appear in the key.

    ``maxsize=32`` rather than unbounded: the key is caller-supplied, so an
    unbounded cache becomes a slow memory leak once per-tenant model selection
    arrives in a later phase. 32 distinct provider configurations per process is
    far beyond anything Phase 1 or 2 needs, and evicting an LLM client is
    harmless — it holds an HTTP connection pool, not state.
    """
    return build_provider(provider, model, temperature, max_tokens)


def get_llm_provider() -> LLMProvider:
    """The process-default generation provider.

    Back-compat shim for callers that want "whatever the process is configured
    for". Not itself cached: it delegates to ``get_provider``, which is — a
    second cache here would be redundant.
    """
    s = get_settings()
    return get_provider(
        s.llm_provider, s.llm_model, s.llm_temperature, s.llm_max_tokens
    )
