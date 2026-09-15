"""Unit tests for smalltalk routing.

Pure string logic — no Milvus, no API key, no network.

The asymmetry these tests encode: a **false negative** (a greeting routed to
retrieval) costs one wasted search and produces a slightly stiff reply. A **false
positive** (a real question classified as smalltalk) replies "Glad that helped!"
to someone asking about a refund. So the not-smalltalk cases below are the ones
that matter most, and they outnumber the positive cases deliberately.
"""
import pytest

from app.services.conversation import classify_smalltalk, smalltalk_reply


@pytest.mark.parametrize(
    "message,kind",
    [
        ("hello", "greeting"),
        ("Hello!", "greeting"),
        ("hi", "greeting"),
        ("hii", "greeting"),
        ("hey there", "greeting"),
        ("hi team", "greeting"),
        ("good morning", "greeting"),
        ("Good Evening!!", "greeting"),
        ("namaste", "greeting"),
        ("yo", "greeting"),
        ("hello 👋", "greeting"),
        ("thanks", "thanks"),
        ("Thanks!", "thanks"),
        ("thank you", "thanks"),
        ("thanks a lot", "thanks"),
        ("ok thanks", "thanks"),
        ("thanks, that helps", "thanks"),
        ("that helped", "thanks"),
        ("got it", "thanks"),
        ("perfect, thanks", "thanks"),
        ("makes sense", "thanks"),
        ("bye", "goodbye"),
        ("goodbye", "goodbye"),
        ("see you", "goodbye"),
        ("take care", "goodbye"),
        ("that's all", "goodbye"),
        ("no thanks", "goodbye"),
        ("who are you", "identity"),
        ("Who are you?", "identity"),
        ("are you a bot", "identity"),
        ("is this a human", "identity"),
        ("what is your name", "identity"),
    ],
)
def test_smalltalk_is_classified(message, kind):
    match = classify_smalltalk(message)
    assert match is not None, f"{message!r} should be smalltalk"
    assert match.kind == kind


@pytest.mark.parametrize(
    "message",
    [
        # Real questions that merely open politely. Every one of these must reach
        # retrieval — replying "Glad that helped!" to any of them is the failure
        # this guard exists to prevent.
        "hi, how much is the Growth plan?",
        "hello, my refund was declined",
        "thanks, but how do I enable WhatsApp?",
        "ok so what is the SLA for P2?",
        "good morning, I need help with billing",
        "got it, but can agents approve a 7500 refund?",
        "bye, one last thing: what are your hours?",
        # Plain questions with no greeting at all.
        "What are your support hours?",
        "How much does Starter cost?",
        "my whatsapp is broken",
        "billing",
        "refund policy",
        "P2 SLA",
        # Short but substantive.
        "order 4812 missing",
        "connector delayed",
    ],
)
def test_real_questions_are_not_smalltalk(message):
    assert classify_smalltalk(message) is None, f"{message!r} must reach retrieval"


def test_long_message_is_never_smalltalk():
    # Over the token cap, so it cannot be smalltalk regardless of content.
    message = "thanks thanks thanks thanks thanks thanks thanks thanks"
    assert classify_smalltalk(message) is None


@pytest.mark.parametrize("message", ["", "   ", "👋", "!!!", "..."])
def test_contentless_messages_get_a_greeting(message):
    # A customer who sends only an emoji gets a warm opener, not a fallback
    # error. Anything is better than "I did not understand that".
    match = classify_smalltalk(message)
    assert match is not None
    assert match.kind == "greeting"


def test_non_string_input_does_not_raise():
    assert classify_smalltalk(None) is not None  # coerced to "", so a greeting
    assert classify_smalltalk(12345) is None


@pytest.mark.parametrize("kind", ["greeting", "thanks", "goodbye", "identity"])
def test_every_kind_has_a_reply(kind):
    match = classify_smalltalk(
        {"greeting": "hi", "thanks": "thanks", "goodbye": "bye", "identity": "who are you"}[
            kind
        ]
    )
    reply = smalltalk_reply(match, company="Nimbus")
    assert reply and reply[0].isupper()
    # No unresolved template placeholder ever reaches a customer.
    assert "{" not in reply


def test_identity_reply_names_the_company():
    match = classify_smalltalk("who are you")
    assert "Nimbus" in smalltalk_reply(match, company="Nimbus")
