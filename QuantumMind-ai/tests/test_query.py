"""Unit tests for the RAG query engine.

The vector store and LLM provider are both faked, so these run without Milvus or
any real API key.
"""
from app.llm.base import LLMProvider, LLMResult
from app.schemas import ChatMessage
from app.services.answer_policy import NO_CONTEXT_REPLY
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
    # `answer` now carries suggested wording rather than None. The flag is what
    # callers route on; the text exists so a caller without its own copy is not
    # forced to invent "Sorry, I did not understand that". See
    # answer_policy.NO_CONTEXT_REPLY.
    assert resp.answer == NO_CONTEXT_REPLY
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


# ---------------------------------------------------------------------------
# Smalltalk routing, the relative floor, and the refusal downgrade
# ---------------------------------------------------------------------------


def test_greeting_answered_without_retrieval_or_generation():
    # A greeting must not reach the store OR the LLM. Before this route existed,
    # "hello" retrieved a 0.218 chunk, cleared the 0.15 gate, and the model
    # correctly reported that no chunk answers "hello" — so the customer who
    # said hi received "I don't have that information right now."
    store = FakeStore([{"text": "Support is open 9am-5pm.", "source_url": "", "score": 0.9}])
    provider = FakeProvider()
    svc = QueryService(store=store, provider=provider)

    resp = svc.answer_question(client_id="acme", question="hello", company_name="Acme")

    assert resp.confident is True
    assert "help" in resp.answer.lower()
    assert resp.tokens_used == 0
    assert store.last_query is None, "a greeting must not hit the vector store"
    assert provider.last_messages is None, "a greeting must not hit the LLM"


def test_real_question_still_goes_through_retrieval():
    store = FakeStore([{"text": "Starter costs 1999.", "source_url": "", "score": 0.7}])
    provider = FakeProvider()
    svc = QueryService(store=store, provider=provider)

    svc.answer_question(client_id="acme", question="hi, how much is Starter?")

    assert store.last_query is not None
    assert provider.last_messages is not None


def test_relative_floor_drops_noise_behind_a_strong_match():
    # 0.21 alongside a 0.74 is noise; the same 0.21 alone would be the best we
    # have and must be kept. Default floor is 0.45, so the cutoff is 0.333.
    store = FakeStore(
        [
            {"text": "Strong match.", "source_url": "", "score": 0.74},
            {"text": "Decent match.", "source_url": "", "score": 0.40},
            {"text": "Noise riding along.", "source_url": "", "score": 0.21},
        ]
    )
    provider = FakeProvider()
    svc = QueryService(store=store, provider=provider)

    resp = svc.answer_question(client_id="acme", question="What is the plan price?")

    assert len(resp.sources) == 2
    assert "Noise riding along." not in provider.last_messages[0]["content"]


def test_relative_floor_never_empties_a_passing_result():
    # A single weak-but-passing chunk is the best we have. The top chunk is kept
    # unconditionally, so the relative floor can never turn a confident answer
    # into a decline.
    store = FakeStore([{"text": "Weak but all we have.", "source_url": "", "score": 0.16}])
    provider = FakeProvider()
    svc = QueryService(store=store, provider=provider)

    resp = svc.answer_question(client_id="acme", question="Anything on this?")

    assert len(resp.sources) == 1
    assert resp.confident is True


class RefusingProvider(FakeProvider):
    def generate(self, messages):
        self.last_messages = messages
        return LLMResult(
            text="I don't have that information right now.",
            tokens_used=17,
            model=self.model,
            provider=self.name,
        )


def test_refusal_is_reported_as_not_confident():
    # Cosine said the chunks looked related; the model read them and says they do
    # not contain the answer. The model is the better judge. Reporting
    # confident=false is what lets the caller escalate to a human instead of
    # delivering the refusal as though it were an answer.
    store = FakeStore([{"text": "Unrelated but similar-looking.", "source_url": "", "score": 0.6}])
    provider = RefusingProvider()
    svc = QueryService(store=store, provider=provider)

    resp = svc.answer_question(client_id="acme", question="Do you ship to Mars?")

    assert resp.confident is False
    # The wording still travels so the caller can show something human.
    assert resp.answer
    # Citing chunks for a refusal would be misleading.
    assert resp.sources == []
    # Tokens were genuinely spent and must still be reported for billing.
    assert resp.tokens_used == 17


def test_mojibake_never_reaches_the_model_or_the_customer():
    store = FakeStore(
        [{"text": "Refunds up to \u25a05,000 are fine.", "source_url": "", "score": 0.8}]
    )
    provider = FakeProvider()
    svc = QueryService(store=store, provider=provider)

    svc.answer_question(client_id="acme", question="What is the refund limit?")

    context = provider.last_messages[0]["content"]
    assert "₹5,000" in context
    assert "\u25a0" not in context
