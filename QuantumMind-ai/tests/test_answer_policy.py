"""Unit tests for refusal detection, text repair, and prompt construction.

Pure functions — no Milvus, no API key, no network.
"""
import pytest

from app.services.answer_policy import (
    NO_CONTEXT_REPLY,
    build_system_prompt,
    is_refusal,
    repair_text,
)


# ---------------------------------------------------------------- refusals


@pytest.mark.parametrize(
    "answer",
    [
        "I don't have that information right now.",
        "I do not have that information.",
        "I don't have any information on that.",
        "I don't know.",
        "I can't answer that.",
        "I cannot help with that.",
        "I am unable to assist with that.",
        "That is not mentioned in the available material.",
        "No information available.",
        # Named subject rather than a pronoun — the form that slipped through a
        # pronoun-only pattern set and was returned as confident=true.
        "I can't provide information about integrating Nimbus with Salesforce.",
        "I can't provide a support phone number.",
        "I can't provide specific timelines for that.",
        # Wording the rewritten prompt itself encourages, so it must be covered.
        "I don't have a figure for that.",
        "I don't have a number for that.",
        "I don't have the specifics on that.",
        "I don't have a timeline for that.",
        "",
        "   ",
        None,
    ],
)
def test_refusals_are_detected(answer):
    assert is_refusal(answer) is True


@pytest.mark.parametrize(
    "answer",
    [
        "Starter costs ₹1,999 per month.",
        "No, Nimbus charges ₹0.80 for every Growth conversation above 10,000.",
        "Agents may approve refunds up to ₹5,000; above that needs a supervisor.",
        "Hi there! What can I help you with?",
        "Support runs Monday to Friday, 09:00-18:00 IST.",
    ],
)
def test_real_answers_are_not_refusals(answer):
    assert is_refusal(answer) is False


def test_long_partial_answer_with_a_caveat_is_not_a_refusal():
    # A long answer that delivers real content AND honestly flags a gap is the
    # best possible outcome for a partly-covered question. Downgrading it to
    # confident=false would send a solved question to a human.
    answer = (
        "Agents can approve refunds up to ₹5,000, and anything above that needs "
        "supervisor approval, so a ₹7,500 request goes to a supervisor. The "
        "request has to include the order ID, reason, amount and payment method. "
        "I don't have information on how long that approval usually takes."
    )
    assert is_refusal(answer) is False


def test_short_partial_answer_is_not_a_refusal():
    # THE case that broke a length-based test. Short, opens with a decline, and
    # still delivers the documented fact. It must be delivered, not escalated.
    answer = (
        "I don't have a figure for how long that takes. Refunds above ₹5,000 do "
        "require supervisor approval."
    )
    assert len(answer) < 320
    assert is_refusal(answer) is False


@pytest.mark.parametrize(
    "answer",
    [
        "I can't provide that information. Is there anything else?",
        # A long, helpful-sounding redirect. Offering to help with a topic names
        # it; it does not answer anything. Left uncaught, these score as
        # substantive on word count and silently suppress the human handoff.
        "I don't have a figure for that. However, I can help with information "
        "about response and resolution targets for different priority levels.",
        "I don't have that information. Let me know if you need help with "
        "anything else about your account or plan.",
        "I can't provide a support phone number. However, I can help you with "
        "any questions or issues you have right here!",
    ],
)
def test_decline_plus_redirect_is_still_a_refusal(answer):
    assert is_refusal(answer) is True


# ------------------------------------------------------------ text repair


def test_repairs_mojibake_currency():
    assert repair_text("Refunds up to \u25a05,000") == "Refunds up to ₹5,000"
    assert repair_text("costs \ufffd1,999 per month") == "costs ₹1,999 per month"


def test_repair_is_idempotent():
    once = repair_text("costs \u25a06,999")
    assert repair_text(once) == once == "costs ₹6,999"


def test_repair_leaves_non_currency_glyphs_alone():
    # No following digit, so this is a bullet or a shape, not a mangled symbol.
    assert repair_text("\u25a0 First step") == "\u25a0 First step"


@pytest.mark.parametrize("value", [None, ""])
def test_repair_handles_empty(value):
    assert repair_text(value) == ""


# --------------------------------------------------------------- prompting


def test_prompt_carries_company_and_context():
    prompt = build_system_prompt(company="Nimbus", context="Starter costs ₹1,999.")
    assert "Nimbus" in prompt
    assert "Starter costs ₹1,999." in prompt
    # No unresolved placeholder can reach the model.
    assert "{company}" not in prompt
    assert "{context}" not in prompt
    assert "{handoff_rule}" not in prompt


def test_handoff_rule_is_switched_by_the_flag():
    forbidden = build_system_prompt("Nimbus", "ctx", allow_handoff_offer=False)
    allowed = build_system_prompt("Nimbus", "ctx", allow_handoff_offer=True)
    assert "Never offer to connect" in forbidden
    assert "Never offer to connect" not in allowed
    assert "human colleague can pick this up" in allowed


def test_no_context_reply_does_not_blame_the_customer():
    # The string this replaced was "Sorry, I did not understand that. Please try
    # again." Both halves of that are wrong: we understood fine, and rephrasing
    # cannot conjure content we never ingested.
    lowered = NO_CONTEXT_REPLY.lower()
    assert "did not understand" not in lowered
    assert "try again" not in lowered
    assert "rephrase" not in lowered


def test_request_for_customer_input_is_not_a_refusal():
    # The noun list in the refusal patterns is deliberately closed. "I don't have
    # your order number" is the assistant asking the customer for something, not
    # declining for want of knowledge — downgrading it would escalate a
    # conversation that is progressing normally.
    answer = "I don't have your order number yet. Could you share it so I can look this up?"
    assert is_refusal(answer) is False


def test_a_figure_wins_over_offer_shaped_framing():
    # THE ordering case. "I can tell you that..." is offer-shaped words wrapping
    # a documented threshold. Judging it on framing alone discards the fact and
    # escalates a question that was answered.
    answer = (
        "I don't have a figure for that. However, I can tell you that refunds "
        "above ₹5,000 require supervisor approval, but the specific time frame "
        "isn't mentioned."
    )
    assert is_refusal(answer) is False
