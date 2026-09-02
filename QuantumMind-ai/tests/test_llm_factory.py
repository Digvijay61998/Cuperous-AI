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
    s = _settings(llm_provider="openai")
    provider = build_provider(s.llm_provider, s.llm_model, s.llm_temperature, s.llm_max_tokens, s)
    assert isinstance(provider, OpenAICompatibleProvider)
    assert provider.name == "openai"
    assert provider.model == "gpt-4o-mini"


def test_moonshot_uses_openai_compatible_client_with_moonshot_host():
    s = _settings(llm_provider="moonshot", llm_model="moonshot-v1-8k")
    provider = build_provider(s.llm_provider, s.llm_model, s.llm_temperature, s.llm_max_tokens, s)
    assert isinstance(provider, OpenAICompatibleProvider)
    assert provider.name == "moonshot"
    assert str(provider._client.base_url).startswith("https://api.moonshot.cn")


def test_anthropic_provider_selected():
    s = _settings(llm_provider="anthropic", llm_model="claude-3-5-haiku-latest")
    provider = build_provider(s.llm_provider, s.llm_model, s.llm_temperature, s.llm_max_tokens, s)
    assert isinstance(provider, AnthropicProvider)
    assert provider.name == "anthropic"


def test_missing_api_key_raises():
    s = _settings(llm_provider="openai", openai_api_key="")
    with pytest.raises(ValueError):
        build_provider(s.llm_provider, s.llm_model, s.llm_temperature, s.llm_max_tokens, s)


def test_unknown_provider_raises():
    # The provider name is now an explicit argument rather than a Settings
    # field, so the unknown value is passed straight in to exercise the
    # factory's defensive branch — no post-construction mutation needed.
    s = _settings(llm_provider="openai")
    with pytest.raises(ValueError):
        build_provider("llama", s.llm_model, s.llm_temperature, s.llm_max_tokens, s)
