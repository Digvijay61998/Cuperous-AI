"""Unit tests for the configurable LLM provider factory (no network calls)."""
import pytest

from app.config import Settings
from app.llm.anthropic_provider import AnthropicProvider
from app.llm.factory import build_provider
from app.llm.openai_provider import OpenAICompatibleProvider


def _settings(**overrides) -> Settings:
    base = dict(
        llm_model="gpt-4o-mini",
        llm_temperature=0.3,
        llm_max_tokens=256,
        openai_api_key="sk-test",
        moonshot_api_key="ms-test",
        anthropic_api_key="ak-test",
    )
    base.update(overrides)
    return Settings(**base)


def test_openai_provider_is_default():
    provider = build_provider(_settings(llm_provider="openai"))
    assert isinstance(provider, OpenAICompatibleProvider)
    assert provider.name == "openai"
    assert provider.model == "gpt-4o-mini"


def test_moonshot_uses_openai_compatible_client_with_moonshot_host():
    provider = build_provider(
        _settings(llm_provider="moonshot", llm_model="moonshot-v1-8k")
    )
    assert isinstance(provider, OpenAICompatibleProvider)
    assert provider.name == "moonshot"
    assert str(provider._client.base_url).startswith("https://api.moonshot.cn")


def test_anthropic_provider_selected():
    provider = build_provider(
        _settings(llm_provider="anthropic", llm_model="claude-3-5-haiku-latest")
    )
    assert isinstance(provider, AnthropicProvider)
    assert provider.name == "anthropic"


def test_missing_api_key_raises():
    with pytest.raises(ValueError):
        build_provider(_settings(llm_provider="openai", openai_api_key=""))


def test_unknown_provider_raises():
    # The Literal type blocks bad values at construction, so mutate afterwards to
    # exercise the factory's defensive branch.
    s = _settings(llm_provider="openai")
    s.llm_provider = "llama"
    with pytest.raises(ValueError):
        build_provider(s)
