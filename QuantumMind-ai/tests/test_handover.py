"""Unit tests for the AI_Handover_Signal.

Pure functions plus a stubbed QueryService — no Milvus, no API key, no network.
"""
from types import SimpleNamespace

import pytest

from app.schemas import QueryResponse
from app.services.handover import (
    AI_DEFAULT_REASON,
    EXPLICIT_REQUEST_REASON,
    MAX_HANDOVER_REASON_LENGTH,
    detect_human_request,
    extract_handover_tag,
)


# ------------------------------------------------------------- explicit request

@pytest.mark.parametrize(
    "question",
    [
        "I want to talk to a human",
        "Can you connect me to a real person please?",
        "agent",
        "Agent please",
        "human",
        "I need to speak with a customer service representative",
        "Transfer me to your support team.",
        "let me speak to someone",
        "can i chat with a live agent",
        "I'd like to talk to an actual person",
        "put me through to an operator",
        "I need human support",
        "mujhe kisi agent se baat karni hai",
        "agent se baat karni hai",
        "मुझे एजेंट से बात करनी है",
        "  TALK TO A HUMAN!!! ",
    ],
)
def test_explicit_human_request_is_detected(question):
    assert detect_human_request(question) == EXPLICIT_REQUEST_REASON


@pytest.mark.parametrize(
    "question",
    [
        "When is support open?",
        "Can I email your support team on a weekend?",
        "I don't want to talk to an agent, just tell me the return window",
        "no need to speak to a person, what's the price?",
        "Is the Widget Pro made by humans or robots?",
        "Do your support agents work on federal holidays?",
        "How fast do priority support customers get a response?",
        "What does the agent field in the invoice mean?",
        "humanity",
        "hello",
        "",
        "   ",
    ],
)
def test_passing_mentions_do_not_hand_over(question):
    assert detect_human_request(question) is None


def test_talk_to_company_counts_as_human_request():
    assert detect_human_request("talk to kone", company="KONE") == EXPLICIT_REQUEST_REASON
    assert detect_human_request("I want to speak with someone at KONE", company="KONE")
    # Without the company name it is not an explicit human request.
    assert detect_human_request("talk to kone") is None
    # The generic default company name never matches.
    assert detect_human_request("talk to our company", company="our company") is None


# ------------------------------------------------------------------ model tag

def test_tag_is_stripped_and_returned_as_reason():
    answer = "I'm sorry your lift is stuck.\n<<HANDOVER: Safety issue needs a technician>>"
    clean, reason = extract_handover_tag(answer)
    assert clean == "I'm sorry your lift is stuck."
    assert reason == "Safety issue needs a technician"


@pytest.mark.parametrize(
    "answer",
    [
        "Text <<handover: x>>",
        "Text <<HANDOVER x>>",
        "<< HANDOVER : x >> Text",
        "Text\n\n<<HANDOVER: x>>\n",
    ],
)
def test_tag_variants_never_leak(answer):
    clean, reason = extract_handover_tag(answer)
    assert "<<" not in clean and "HANDOVER" not in clean.upper()
    assert clean == "Text"
    assert reason == "x"


def test_empty_tag_gets_default_reason():
    assert extract_handover_tag("Ok. <<HANDOVER>>") == ("Ok.", AI_DEFAULT_REASON)
    assert extract_handover_tag("Ok. <<HANDOVER:   >>") == ("Ok.", AI_DEFAULT_REASON)


def test_no_tag_means_no_handover_even_if_text_mentions_agents():
    answer = "I can't connect you to an agent from here, but you can call our support line."
    assert extract_handover_tag(answer) == (answer, None)


def test_tag_reason_is_capped():
    _, reason = extract_handover_tag("x <<HANDOVER: " + "y" * 500 + ">>")
    assert len(reason) == MAX_HANDOVER_REASON_LENGTH


def test_none_answer_passes_through():
    assert extract_handover_tag(None) == (None, None)


# ------------------------------------------------------------------- schema

def test_query_response_defaults_handover_false():
    r = QueryResponse(answer="hi", confident=True, provider="p", model="m")
    assert r.handover is False and r.handover_reason is None
    assert r.model_dump()["handover"] is False


def test_query_response_rejects_overlong_reason():
    with pytest.raises(Exception):
        QueryResponse(
            answer="hi", confident=True, provider="p", model="m",
            handover=True, handover_reason="z" * 201,
        )


# ------------------------------------------------------- QueryService wiring

class _Store:
    def __init__(self, hits):
        self._hits = hits

    def search(self, *_a, **_k):
        return self._hits


class _Provider:
    name = "stub"
    model = "stub-model"
    temperature = 0.0
    max_tokens = 100

    def __init__(self, text):
        self.text = text
        self.messages = None

    def generate(self, messages):
        self.messages = messages
        return SimpleNamespace(
            text=self.text, tokens_used=10, prompt_tokens=8, completion_tokens=2,
            model="stub-model", provider="stub", finish_reason="stop",
        )


class _Rewriter:
    def rewrite(self, question, history):
        return SimpleNamespace(
            search_query=question, strategy="none", was_rewritten=False,
            tokens_used=0, prompt_tokens=0, completion_tokens=0, model=None, error=None,
        )


def _service(answer_text, hits, **settings):
    from app.services.query import QueryService

    svc = QueryService(
        store=_Store(hits), provider=_Provider(answer_text), rewriter=_Rewriter()
    )
    if settings:
        # Per-instance copy: never mutates the cached global settings.
        svc.settings = svc.settings.model_copy(update=settings)
    return svc


HIT = [{"text": "Support is open Mon-Fri 9-5.", "score": 0.9, "source_url": None}]


def test_generated_answer_with_tag_sets_handover_and_strips_tag():
    svc = _service("We can help with that.\n<<HANDOVER: Account change>>", HIT)
    r = svc.answer_question("c", "please change my billing address")
    assert r.handover is True
    assert r.handover_reason == "Account change"
    assert "HANDOVER" not in r.answer
    assert "<<HANDOVER" in svc._provider.messages[0]["content"]  # instruction in prompt


def test_generated_answer_mentioning_agents_without_tag_is_not_handover():
    svc = _service("Our agents are available Monday to Friday.", HIT)
    r = svc.answer_question("c", "When are your agents available?")
    assert r.handover is False and r.handover_reason is None


def test_explicit_request_sets_handover_on_no_context_path():
    svc = _service("unused", hits=[])
    r = svc.answer_question("c", "I want to talk to a human")
    assert r.confident is False
    assert r.handover is True
    assert r.handover_reason == EXPLICIT_REQUEST_REASON


def test_signal_disabled_never_hands_over_and_never_leaks_tag():
    svc = _service("Sure.\n<<HANDOVER: x>>", HIT, handover_signal_enabled=False)
    r = svc.answer_question("c", "I want to talk to a human")
    assert r.handover is False
    assert "HANDOVER" not in r.answer
    assert "<<HANDOVER" not in svc._provider.messages[0]["content"]
