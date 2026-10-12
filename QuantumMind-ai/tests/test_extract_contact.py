"""POST /extract/contact with a stub provider: no API key, no network."""
import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import app.services.extract_contact as extract_mod
from app.main import app

client = TestClient(app)


class _Provider:
    name = "stub"
    model = "stub-model"
    temperature = 0.0
    max_tokens = 100

    def __init__(self, text=None, error=None):
        self.text = text
        self.error = error
        self.messages = None

    def generate(self, messages):
        self.messages = messages
        if self.error:
            raise self.error
        return SimpleNamespace(
            text=self.text, tokens_used=10, prompt_tokens=8, completion_tokens=2,
            model="stub-model", provider="stub", finish_reason="stop",
        )


@pytest.fixture
def stub(monkeypatch):
    def install(**kwargs):
        provider = _Provider(**kwargs)
        monkeypatch.setattr(extract_mod, "get_llm_provider", lambda: provider)
        return provider

    return install


def _post(text):
    return client.post("/extract/contact", json={"text": text})


def test_extracts_name_email_phone(stub):
    provider = stub(text=json.dumps(
        {"name": "Raj Kumar", "email": "Raj.Kumar@Example.com", "phone": "+91 98765-43210"}
    ))
    r = _post("Hi, I'm Raj Kumar, mail me at Raj.Kumar@Example.com or call +91 98765-43210")
    assert r.status_code == 200
    assert r.json() == {"name": "Raj Kumar", "email": "raj.kumar@example.com", "phone": "+919876543210"}
    assert provider.messages[0]["role"] == "system"
    assert "JSON" in provider.messages[0]["content"]


def test_fenced_json_is_accepted(stub):
    stub(text='```json\n{"name": null, "email": "a@b.io", "phone": null}\n```')
    assert _post("reach me at a@b.io").json() == {"name": None, "email": "a@b.io", "phone": None}


def test_hallucinated_email_is_dropped(stub):
    stub(text=json.dumps({"name": "Raj Kumar", "email": "raj@example.com", "phone": None}))
    r = _post("my name is Raj Kumar")
    assert r.status_code == 200
    assert r.json() == {"name": "Raj Kumar", "email": None, "phone": None}


@pytest.mark.parametrize(
    "phone, text",
    [
        ("12345", "call 12345"),                       # too short
        ("1234567890123456", "call 1234567890123456"),  # too long
        ("9876543210", "my number is 555 0101 999"),    # not in text
        ("call me", "call me maybe"),                    # not a number
    ],
)
def test_invalid_phone_is_dropped(stub, phone, text):
    stub(text=json.dumps({"name": None, "email": None, "phone": phone}))
    r = _post(text)
    assert r.status_code == 200
    assert r.json()["phone"] is None


def test_hallucinated_name_is_dropped(stub):
    stub(text=json.dumps({"name": "Priya Shah", "email": None, "phone": None}))
    assert _post("hello, my lift is not working").json()["name"] is None


def test_llm_error_falls_back_to_regex(stub):
    stub(error=RuntimeError("provider down"))
    r = _post("I'm Raj, email RAJ@example.com, phone (022) 555-1234")
    assert r.status_code == 200
    assert r.json() == {"name": None, "email": "raj@example.com", "phone": "0225551234"}


def test_llm_invalid_json_falls_back_to_regex(stub):
    stub(text="Sure! The email is raj@example.com")
    r = _post("contact raj@example.com or +44 20 7946 0958")
    assert r.status_code == 200
    assert r.json() == {"name": None, "email": "raj@example.com", "phone": "+442079460958"}


def test_llm_wrong_shape_falls_back_to_regex(stub):
    stub(text=json.dumps({"name": ["x"], "email": 5}))
    r = _post("write to x@y.com")
    assert r.status_code == 200
    assert r.json() == {"name": None, "email": "x@y.com", "phone": None}


def test_provider_construction_failure_falls_back(monkeypatch):
    def boom():
        raise ValueError("Unknown LLM provider")

    monkeypatch.setattr(extract_mod, "get_llm_provider", boom)
    r = _post("x@y.com")
    assert r.status_code == 200
    assert r.json() == {"name": None, "email": "x@y.com", "phone": None}


@pytest.mark.parametrize("text", ["", "   \n\t "])
def test_empty_text_is_422(stub, text):
    stub(text="{}")
    assert _post(text).status_code == 422


def test_missing_text_is_422():
    assert client.post("/extract/contact", json={}).status_code == 422


def test_too_long_text_is_422(stub):
    stub(text="{}")
    assert _post("a" * 2001).status_code == 422
    # Whitespace around a 2000-char body is stripped before the length check.
    assert _post("  " + "a" * 2000 + "  ").status_code == 200
