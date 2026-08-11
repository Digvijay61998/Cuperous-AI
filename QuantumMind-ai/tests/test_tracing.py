"""Unit tests for the tracing layer (PLAN.md Phase 0.5).

No Milvus, no API key. The contract we care about most: tracing must never break
a request, so several tests deliberately exercise the failure paths.
"""
import logging

from app.tracing import (
    Span,
    current_trace,
    estimate_cost_usd,
    finish_trace,
    span,
    span_summary,
    start_trace,
)


# ---------------------------------------------------------------- cost table
def test_cost_estimate_known_model():
    # 1M prompt tokens at $0.15 / 1M.
    assert estimate_cost_usd("gpt-4o-mini", 1_000_000, 0) == 0.15
    # 1M completion tokens at $0.60 / 1M.
    assert estimate_cost_usd("gpt-4o-mini", 0, 1_000_000) == 0.60


def test_cost_estimate_uses_longest_prefix_match():
    """A dated snapshot must resolve to its base model, not a shorter prefix."""
    dated = estimate_cost_usd("gpt-4o-mini-2024-07-18", 1_000_000, 0)
    assert dated == estimate_cost_usd("gpt-4o-mini", 1_000_000, 0)
    # And must NOT fall back to the more expensive "gpt-4o" entry.
    assert dated != estimate_cost_usd("gpt-4o", 1_000_000, 0)


def test_cost_estimate_unknown_model_is_zero_not_an_error():
    assert estimate_cost_usd("some-local-llama", 1000, 1000) == 0.0
    assert estimate_cost_usd("", 1000, 1000) == 0.0


# -------------------------------------------------------------------- spans
def test_span_records_duration_and_attributes():
    start_trace("t-1")
    with span("retrieval", top_k=5) as sp:
        sp.set(hit_count=3)

    trace = current_trace()
    assert trace is not None
    assert len(trace.spans) == 1
    recorded = trace.spans[0]
    assert recorded.name == "retrieval"
    assert recorded.duration_ms is not None and recorded.duration_ms >= 0
    assert recorded.attributes["top_k"] == 5
    assert recorded.attributes["hit_count"] == 3
    finish_trace()


def test_span_works_with_no_active_trace():
    """Services are instrumented unconditionally, so this must not raise."""
    finish_trace()  # ensure nothing is active
    with span("orphan") as sp:
        sp.set(x=1)
    assert current_trace() is None


def test_span_records_error_and_reraises():
    start_trace("t-err")
    try:
        with span("boom"):
            raise ValueError("kaboom")
    except ValueError:
        pass
    else:  # pragma: no cover
        raise AssertionError("exception should propagate")

    trace = current_trace()
    assert trace.spans[0].error is not None
    assert "ValueError" in trace.spans[0].error
    assert "kaboom" in trace.spans[0].error
    finish_trace()


def test_token_and_cost_aggregation_across_spans():
    start_trace("t-tokens")
    with span("generation") as sp:
        sp.record_tokens(prompt=1_000_000, completion=0, model="gpt-4o-mini")
    with span("judge") as sp:
        sp.record_tokens(prompt=1_000_000, completion=0, model="gpt-4o-mini")

    trace = current_trace()
    assert trace.total_tokens == 2_000_000
    assert abs(trace.total_cost_usd - 0.30) < 1e-9
    finish_trace()


def test_record_tokens_keeps_provider_reported_total():
    """When a provider reports only a combined total, don't invent a split."""
    sp = Span(name="generation", start=0.0)
    sp.record_tokens(prompt=0, completion=0, total=137, model="gpt-4o-mini")
    assert sp.total_tokens == 137


# -------------------------------------------------------------------- trace
def test_finish_trace_returns_payload_and_clears_state():
    start_trace("t-fin")
    with span("stage-a"):
        pass
    payload = finish_trace()

    assert payload is not None
    assert payload["trace_id"] == "t-fin"
    assert [s["name"] for s in payload["spans"]] == ["stage-a"]
    # State cleared, so a later request cannot inherit these spans.
    assert current_trace() is None


def test_finish_trace_with_no_trace_returns_none():
    finish_trace()
    assert finish_trace() is None


def test_span_summary_is_human_readable():
    start_trace("t-sum")
    with span("retrieval"):
        pass
    with span("generation"):
        pass
    summary = span_summary()
    assert "retrieval=" in summary
    assert "generation=" in summary
    finish_trace()


def test_span_summary_with_no_trace():
    finish_trace()
    assert span_summary() == "-"


def test_tracing_disabled_still_returns_payload(monkeypatch):
    """With AI_TRACING=false we skip the log line but keep the data available."""
    from app.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(type(settings), "tracing_enabled", property(lambda self: False))

    start_trace("t-off")
    with span("stage"):
        pass
    payload = finish_trace()
    assert payload is not None
    assert payload["trace_id"] == "t-off"


def test_finish_trace_survives_unserialisable_attributes(caplog):
    """A metrics bug must not turn a working answer into a 500."""

    class Unserialisable:
        def __repr__(self):
            raise RuntimeError("cannot repr")

    start_trace("t-bad")
    with span("stage") as sp:
        sp.set(bad=Unserialisable())

    with caplog.at_level(logging.ERROR):
        # Must not raise, whatever happens during serialisation.
        finish_trace()
    assert current_trace() is None
