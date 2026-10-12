"""POST /knowledge/candidate and /knowledge/similar (crm-incident-handover task 8.1).

Candidate: stub provider, no network. Similar: a fake vector store for the
endpoint logic, plus one Milvus integration test for the source-prefix filter
(needs the docker-compose Milvus, like test_vector_store.py).
"""
import json
import os
import uuid
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import app.routers.knowledge as knowledge_router
import app.services.knowledge_candidate as kc
from app.main import app
from app.services.knowledge_candidate import personal_data_reason

client = TestClient(app)

GOOD = {
    "question": "What should I do if the lift door does not close?",
    "answer": "Check that nothing blocks the door sill, then press the door-close button. If it still does not close, report a fault so a technician can reset the door operator.",
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
        return SimpleNamespace(text=self.text, tokens_used=7, prompt_tokens=5, completion_tokens=2, model="stub-model")


@pytest.fixture
def stub(monkeypatch):
    def install(**kw):
        p = _Provider(**kw)
        monkeypatch.setattr(kc, "get_llm_provider", lambda: p)
        return p
    return install


def post(**kw):
    body = {"problem": "Lift door on floor 3 does not close", "resolution": "Reset the door operator remotely.", **kw}
    return client.post("/knowledge/candidate", json=body)


def test_returns_a_generalised_qa(stub):
    p = stub()
    r = post(company="Acme")
    assert r.status_code == 200, r.text
    assert r.json()["question"] == GOOD["question"]
    assert r.json()["answer"].startswith("Check that nothing")
    assert "Acme" in p.messages[1]["content"]
    assert "Reset the door operator" in p.messages[1]["content"]


@pytest.mark.parametrize(
    "q,a",
    [
        ("short?", GOOD["answer"]),
        ("x" * 501, GOOD["answer"]),
        (GOOD["question"], "too short"),
        (GOOD["question"], "y" * 2001),
        ("Why did raj@example.com get no reply?", GOOD["answer"]),
        (GOOD["question"], "Call us on +91 98765 43210 for help with the door."),
        (GOOD["question"], "Your request SR_ABC123 was fixed by resetting the door."),
        (GOOD["question"], "We emailed you at [email] with the door reset steps."),
    ],
)
def test_bad_or_unsafe_output_is_a_502(stub, q, a):
    stub(text=json.dumps({"question": q, "answer": a}))
    assert post().status_code == 502


@pytest.mark.parametrize("text", ["not json", json.dumps(["x"]), json.dumps({"question": 5, "answer": None})])
def test_malformed_output_is_a_502(stub, text):
    stub(text=text)
    assert post().status_code == 502


def test_provider_error_is_a_502(stub):
    stub(error=RuntimeError("timeout"))
    assert post().status_code == 502


def test_request_validation(stub):
    stub()
    assert post(problem="").status_code == 422
    assert post(resolution="z" * 2001).status_code == 422


def test_personal_data_guard_allows_ordinary_numbers():
    assert personal_data_reason("Floor 3, lift 2, wait 30 minutes and retry in 2026.") is None
    assert personal_data_reason("Order 4471 is shipped.") is None
    assert personal_data_reason("Call 0201234567") == "contains a phone number"


# ------------------------------------------------------------------ similar
class _FakeStore:
    def __init__(self, hits):
        self.hits = hits
        self.calls = []

    def search_source_prefix(self, client_id, text, prefix, top_k=3):
        self.calls.append((client_id, text, prefix, top_k))
        return self.hits


def test_similar_returns_the_best_incident_match(monkeypatch):
    store = _FakeStore([
        {"source": "incident:a", "score": 0.71, "text": "x"},
        {"source": "incident:b", "score": 0.93, "text": "y"},
        {"source": "faq", "score": 0.99, "text": "z"},  # never trusted from outside the prefix
    ])
    monkeypatch.setattr(knowledge_router, "get_vector_store", lambda: store)
    r = client.post("/knowledge/similar", json={"client_id": "acme", "text": "door does not close"})
    assert r.status_code == 200
    assert r.json() == {"best": {"source": "incident:b", "score": 0.93}}
    assert store.calls[0][2] == "incident:"


def test_similar_with_no_match_is_empty(monkeypatch):
    monkeypatch.setattr(knowledge_router, "get_vector_store", lambda: _FakeStore([]))
    assert client.post("/knowledge/similar", json={"client_id": "acme", "text": "x"}).json() == {}


@pytest.mark.parametrize("prefix", ["incident%", 'a"b', "", "x" * 65, "in cident:"])
def test_similar_rejects_unsafe_prefixes(monkeypatch, prefix):
    monkeypatch.setattr(knowledge_router, "get_vector_store", lambda: _FakeStore([]))
    r = client.post("/knowledge/similar", json={"client_id": "acme", "text": "x", "source_prefix": prefix})
    assert r.status_code == 422


@pytest.mark.skipif(os.environ.get("SKIP_MILVUS") == "1", reason="needs Milvus")
def test_prefix_filter_on_real_milvus(monkeypatch):
    monkeypatch.setenv("MILVUS_COLLECTION", f"test_kn_{uuid.uuid4().hex[:8]}")
    from pymilvus import utility

    from app.config import get_settings
    from app.services.vector_store import VectorStoreService

    get_settings.cache_clear() if hasattr(get_settings, "cache_clear") else None
    store = VectorStoreService()
    try:
        store.add_documents("acme", "b", [
            {"text": "Q: Lift door does not close. A: Reset the door operator.", "source": "incident:1", "source_url": "", "source_type": "manual"},
            {"text": "Q: Lift door does not close. A: Reset the door operator.", "source": "faq", "source_url": "", "source_type": "manual"},
        ])
        store.add_documents("other", "b", [
            {"text": "Q: Lift door does not close. A: Reset it.", "source": "incident:9", "source_url": "", "source_type": "manual"},
        ])
        hits = store.search_source_prefix("acme", "lift door will not close", "incident:")
        assert hits and all(h["source"].startswith("incident:") for h in hits)
        assert {h["source"] for h in hits} == {"incident:1"}  # tenant isolation
        assert hits[0]["score"] > 0.5
    finally:
        assert store.collection_name.startswith("test_kn_")  # never drop a real collection
        utility.drop_collection(store.collection_name, using=store._alias)
        # Later tests must see the real settings again.
        get_settings.cache_clear() if hasattr(get_settings, "cache_clear") else None
