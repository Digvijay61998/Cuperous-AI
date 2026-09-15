"""End-to-end test through the FastAPI app (requires running Milvus).

Exercises the real HTTP routes: health -> ingest -> query. The confident path
uses a monkeypatched LLM provider so no API key is required; the fallback path
(no relevant context) runs entirely without an LLM.
"""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ["MILVUS_COLLECTION"] = f"test_e2e_{uuid.uuid4().hex[:8]}"

from pymilvus import utility  # noqa: E402

import app.services.query as query_mod  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.llm.base import LLMProvider, LLMResult  # noqa: E402
from app.main import app  # noqa: E402
from app.services.answer_policy import NO_CONTEXT_REPLY  # noqa: E402

client = TestClient(app)


class FakeProvider(LLMProvider):
    name = "fake"

    def __init__(self):
        super().__init__(model="fake-model", temperature=0.0, max_tokens=100)

    def generate(self, messages):
        return LLMResult(
            text="You can reach support Monday to Friday, 9am to 5pm.",
            tokens_used=25,
            model=self.model,
            provider=self.name,
        )


@pytest.fixture(scope="module", autouse=True)
def _cleanup():
    yield
    try:
        utility.drop_collection(get_settings().milvus_collection, using="default")
    except Exception:
        pass


def test_health():
    assert client.get("/healthcheck").status_code == 200


def test_ingest_then_query_flow(monkeypatch):
    # No API key needed for generation in this test.
    monkeypatch.setattr(query_mod, "get_llm_provider", lambda: FakeProvider())

    # 1. Ingest manual knowledge for a client.
    r = client.post(
        "/ingest/text",
        json={
            "client_id": "acme_e2e",
            "text": "Acme support is available Monday through Friday, 9am to 5pm. "
            "We also offer 24/7 email support at help@acme.test.",
            "source": "support-hours",
            "source_type": "manual",
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["chunks_ingested"] >= 1

    # 2. Relevant question -> confident, grounded answer.
    r = client.post(
        "/query/ask",
        json={
            "client_id": "acme_e2e",
            "question": "When can I contact support?",
            "company_name": "Acme",
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["confident"] is True
    assert body["answer"]
    assert body["sources"]

    # 3. Unrelated question -> low confidence, no answer (bot should fall back).
    r = client.post(
        "/query/ask",
        json={
            "client_id": "acme_e2e",
            "question": "What is the airspeed velocity of an unladen swallow?",
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["confident"] is False
    # `answer` now carries suggested wording instead of None. `confident` is
    # still what the caller routes on. See answer_policy.NO_CONTEXT_REPLY.
    assert body["answer"] == NO_CONTEXT_REPLY
    assert body["sources"] == []


def test_query_unknown_client_is_not_confident(monkeypatch):
    monkeypatch.setattr(query_mod, "get_llm_provider", lambda: FakeProvider())
    r = client.post(
        "/query/ask",
        # NOT a greeting: "hello?" is now answered by the smalltalk route without
        # ever touching the store, which would make this test assert nothing
        # about tenant isolation. A real question is what proves an unknown
        # client retrieves nothing.
        json={"client_id": "nonexistent_client", "question": "What are your support hours?"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["confident"] is False


def test_greeting_is_answered_without_retrieval(monkeypatch):
    """A greeting gets a warm reply, not a fallback, and costs nothing."""
    monkeypatch.setattr(query_mod, "get_llm_provider", lambda: FakeProvider())
    r = client.post(
        "/query/ask",
        json={"client_id": "nonexistent_client", "question": "hello", "company_name": "Acme"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["confident"] is True
    assert body["answer"]
    assert body["tokens_used"] == 0
    assert body["sources"] == []
