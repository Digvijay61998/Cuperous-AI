"""Integration tests for the ingestion pipeline (requires running Milvus)."""
import os
import uuid

import pytest

os.environ["MILVUS_COLLECTION"] = f"test_ingest_{uuid.uuid4().hex[:8]}"

from pymilvus import utility  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.services.ingestion import IngestionService  # noqa: E402
from app.services.vector_store import VectorStoreService  # noqa: E402


@pytest.fixture(scope="module")
def service():
    store = VectorStoreService()
    svc = IngestionService(store=store)
    yield svc
    utility.drop_collection(get_settings().milvus_collection, using="default")


def test_ingest_website_creates_searchable_chunks(service):
    long_content = (
        "Acme Corp was founded in 1998 and is headquartered in Berlin. "
        "We manufacture precision robotics for warehouse automation. "
    ) * 10  # force multiple chunks

    count = service.ingest_website_pages(
        client_id="acme",
        bot_id="bot1",
        pages=[
            {
                "url": "https://acme.test/about",
                "title": "About Acme",
                "content": long_content,
            }
        ],
    )
    assert count > 1, "long content should split into multiple chunks"

    results = service.store.search("acme", "Where is Acme headquartered?", top_k=3)
    assert results
    assert "berlin" in results[0]["text"].lower()
    assert results[0]["source_url"] == "https://acme.test/about"


def test_reingest_same_url_replaces_chunks(service):
    url = "https://acme.test/hours"
    service.ingest_website_pages(
        client_id="acme",
        pages=[{"url": url, "title": "Hours", "content": "We are open 9am to 5pm."}],
    )
    # Re-ingest with different content for the same URL.
    service.ingest_website_pages(
        client_id="acme",
        pages=[{"url": url, "title": "Hours", "content": "We are open 24 hours a day."}],
    )

    results = service.store.search("acme", "opening hours", top_k=5)
    joined = " ".join(r["text"].lower() for r in results if r["source_url"] == url)
    assert "24 hours" in joined
    assert "9am to 5pm" not in joined


def test_ingest_text_and_delete(service):
    client = "textco"
    count = service.ingest_text(
        client_id=client,
        text="Our premium plan costs $49 per month and includes priority support.",
        source="pricing",
        source_type="manual",
    )
    assert count >= 1
    assert service.store.search(client, "how much is premium", top_k=1)

    removed = service.delete_source(client, "pricing")
    assert removed == count
    assert service.store.search(client, "how much is premium", top_k=1) == []
