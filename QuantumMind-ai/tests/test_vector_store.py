"""Integration tests for the multi-tenant Milvus vector store.

Requires a running Milvus (see docker-compose.yml). Uses a throwaway collection
so it never touches real data, and drops it on teardown.
"""
import os
import uuid

import pytest

# Use an isolated collection for the test run.
os.environ["MILVUS_COLLECTION"] = f"test_kb_{uuid.uuid4().hex[:8]}"

from pymilvus import utility  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.services.vector_store import VectorStoreService  # noqa: E402


@pytest.fixture(scope="module")
def store():
    svc = VectorStoreService()
    yield svc
    # Cleanup: drop the throwaway collection.
    utility.drop_collection(get_settings().milvus_collection, using="default")


def test_add_and_search_returns_relevant_chunk(store):
    store.add_documents(
        client_id="acme",
        bot_id="bot1",
        chunks=[
            {
                "text": "Acme Corp business hours are Monday to Friday, 9am to 5pm.",
                "source": "faq",
                "source_url": "https://acme.test/faq",
                "source_type": "manual",
            },
            {
                "text": "Acme Corp offers free shipping on orders over $50.",
                "source": "faq",
                "source_url": "https://acme.test/faq",
                "source_type": "manual",
            },
        ],
    )

    results = store.search("acme", "What time do you open?", top_k=2)
    assert results, "expected at least one result"
    # The business-hours chunk should rank first.
    assert "hours" in results[0]["text"].lower()
    assert results[0]["score"] > 0.2


def test_tenant_isolation(store):
    store.add_documents(
        client_id="globex",
        bot_id="bot9",
        chunks=[
            {
                "text": "Globex sells industrial widgets and gadgets.",
                "source": "about",
                "source_url": "https://globex.test/about",
                "source_type": "manual",
            }
        ],
    )

    # Query as acme; Globex's data must never appear.
    results = store.search("acme", "industrial widgets and gadgets", top_k=5)
    joined = " ".join(r["text"].lower() for r in results)
    assert "globex" not in joined
    assert "widgets" not in joined


def test_delete_by_source(store):
    client = "deltacorp"
    store.add_documents(
        client_id=client,
        bot_id="b",
        chunks=[
            {
                "text": "Delta return policy allows returns within 30 days.",
                "source": "policy",
                "source_url": "https://delta.test/policy",
                "source_type": "manual",
            }
        ],
    )
    assert store.search(client, "return policy", top_k=1)

    removed = store.delete_by_source(client, "policy")
    assert removed == 1

    # Nothing should remain for that client.
    assert store.search(client, "return policy", top_k=1) == []
