"""Unit tests for the RAG query engine.

The vector store and LLM provider are both faked, so these run without Milvus or
any real API key.
"""
from app.llm.base import LLMProvider, LLMResult
from app.schemas import ChatMessage
from app.services.query import QueryService


class FakeStore:
    def __init__(self, hits):
        self._hits = hits
        self.last_query = None

    def search(self, client_id, query, top_k=None):
        self.last_query = (client_id, query, top_k)
        return self._hits


class FakeProvider(LLMProvider):
    name = "fake"

    def __init__(self):
        super().__init__(model="fake-model", temperature=0.0, max_tokens=100)
        self.last_messages = None

    def generate(self, messages):
        self.last_messages = messages
        return LLMResult(
            text="Our support line is open 9 to 5.",
            tokens_used=42,
            model=self.model,
            provider=self.name,
        )


def test_confident_answer_when_relevant_context_found():
    store = FakeStore(
        [
            {"text": "Support is open 9am-5pm.", "source_url": "https://x.test/faq", "score": 0.8},
            {"text": "We reply within 24 hours.", "source_url": "https://x.test/faq", "score": 0.55},
        ]
    )
    provider = FakeProvider()
    svc = QueryService(store=store, provider=provider)

    resp = svc.answer_question(
        client_id="acme",
        question="When is support open?",
        company_name="Acme",
    )

    assert resp.confident is True
    assert resp.answer == "Our support line is open 9 to 5."
    assert resp.tokens_used == 42
    assert resp.provider == "fake"
    assert len(resp.sources) == 2
    # Company name is injected into the system prompt.
    assert "Acme" in provider.last_messages[0]["content"]
    # The retrieved context is included in the system prompt.
    assert "9am-5pm" in provider.last_messages[0]["content"]


def test_low_confidence_when_no_relevant_context():
    # Both hits are below the default min_similarity_score (0.15).
    store = FakeStore(
        [
            {"text": "Unrelated marketing copy.", "source_url": "", "score": 0.10},
            {"text": "More noise.", "source_url": "", "score": 0.05},
        ]
    )
    provider = FakeProvider()
    svc = QueryService(store=store, provider=provider)

    resp = svc.answer_question(client_id="acme", question="Do you sell rockets?")

    assert resp.confident is False
    assert resp.answer is None
    assert resp.sources == []
    # LLM must NOT be called when there is no grounded context (saves cost).
    assert provider.last_messages is None


def test_chat_history_included_in_prompt():
    store = FakeStore(
        [{"text": "The premium plan is $49/mo.", "source_url": "", "score": 0.9}]
    )
    provider = FakeProvider()
    svc = QueryService(store=store, provider=provider)

    history = [
        ChatMessage(role="user", content="What plans do you have?"),
        ChatMessage(role="assistant", content="We have basic and premium."),
    ]
    svc.answer_question(
        client_id="acme",
        question="How much is premium?",
        chat_history=history,
    )

    roles = [m["role"] for m in provider.last_messages]
    contents = [m["content"] for m in provider.last_messages]
    assert roles == ["system", "user", "assistant", "user"]
    assert "What plans do you have?" in contents
    assert contents[-1] == "How much is premium?"
