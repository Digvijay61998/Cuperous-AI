"""POST /generate/service-request-summary (crm-plugins-service-desk R15). Stub provider, no network."""
import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import app.services.service_request_summary as srs
from app.main import app

client = TestClient(app)

GOOD = {
    "overview": "The lift on floor 3 stops between floors.",
    "customer_ask": "A technician visit this week.",
    "actions_taken": "The bot recorded the fault and shared the reference.",
    "next_step": "Call the customer to book a visit.",
}


class _Provider:
    name = "stub"
    model = "stub-model"

    def __init__(self, text=None, error=None):
        self.text = text if text is not None else json.dumps(GOOD)
        self.error = error
        self.messages = None

    def generate(self, messages):
        self.messages = messages
        if self.error:
            raise self.error
        return SimpleNamespace(text=self.text, tokens_used=9, prompt_tokens=6, completion_tokens=3, model="stub-model")


@pytest.fixture
def stub(monkeypatch):
    def install(**kw):
        p = _Provider(**kw)
        monkeypatch.setattr(srs, "get_llm_provider", lambda: p)
        return p

    return install


def post(**kw):
    body = {
        "subject": "Lift stuck",
        "description": "Customer reports the lift stops.",
        "transcript": [
            {"from": "visitor", "text": "The lift is stuck again"},
            {"from": "bot", "text": "I have recorded it."},
        ],
        **kw,
    }
    return client.post("/generate/service-request-summary", json=body)


def test_returns_four_fields(stub):
    p = stub()
    r = post(language="en")
    assert r.status_code == 200, r.text
    body = r.json()
    assert {k: body[k] for k in GOOD} == GOOD
    assert body["provider"] == "stub" and body["tokens_used"] == 9
    user = p.messages[1]["content"]
    assert "visitor: The lift is stuck again" in user and "Language: en" in user


def test_rejects_personal_data_and_refs(stub):
    stub(text=json.dumps({**GOOD, "next_step": "Email raj@example.com"}))
    assert post().status_code == 502
    stub(text=json.dumps({**GOOD, "overview": "About SR_ABC123"}))
    assert post().status_code == 502


def test_rejects_missing_fields_and_bad_json(stub):
    stub(text=json.dumps({k: v for k, v in GOOD.items() if k != "next_step"}))
    assert post().status_code == 502
    stub(text="not json")
    assert post().status_code == 502


def test_long_fields_are_cut(stub):
    stub(text=json.dumps({**GOOD, "overview": "word " * 200}))
    r = post()
    assert r.status_code == 200
    assert len(r.json()["overview"]) <= 400


def test_provider_down_is_502(stub):
    stub(error=RuntimeError("timeout"))
    assert post().status_code == 502


def test_only_the_last_lines_are_sent(stub):
    p = stub()
    lines = [{"from": "visitor", "text": f"line {i}"} for i in range(300)]
    assert post(transcript=lines).status_code == 200
    user = p.messages[1]["content"]
    assert "line 299" in user and "line 50\n" not in user and "line 99\n" not in user


def test_validates_input():
    assert client.post("/generate/service-request-summary", json={"subject": ""}).status_code == 422
