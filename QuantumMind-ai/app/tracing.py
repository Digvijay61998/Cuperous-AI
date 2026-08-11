"""Lightweight in-process tracing for the RAG pipeline.

Phase 0.5 of PLAN.md. The goal is to answer, for every request: which stage took
how long, how many tokens it burned, and what it cost.

Design constraints that shaped this module:

  * **No new dependencies.** Pure stdlib. An OpenTelemetry exporter can be
    layered on later by reading the same span tree (see ``current_trace()``),
    but we are not taking on that dependency to get value today.
  * **Reuses the existing request id.** ``middleware.py`` already establishes a
    correlation id per request; a trace is keyed by it so logs and traces line
    up without a second identifier.
  * **Never breaks the request.** Tracing failures are swallowed. A metrics bug
    must not turn a working answer into a 500.
  * **Cheap when off.** With ``AI_TRACING=false`` the span manager degrades to
    a timing no-op that still records latency (useful) but skips serialisation.

Usage::

    with span("retrieval", top_k=5) as s:
        hits = store.search(...)
        s.set(hit_count=len(hits))

    with span("generation") as s:
        result = provider.generate(messages)
        s.record_tokens(prompt=120, completion=45, model="gpt-4o-mini")

At the end of a request, ``finish_trace()`` logs one structured summary line.
"""
from __future__ import annotations

import json
import logging
import time
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any, Iterator

logger = logging.getLogger("ai.trace")

# ---------------------------------------------------------------------------
# Cost table (USD per 1M tokens)
# ---------------------------------------------------------------------------
# Deliberately approximate and easy to edit. The point is not billing accuracy;
# it is spotting *relative* regressions. A sudden 3x jump in cost per query is a
# context regression, and that signal survives imprecise unit prices.
#
# Keys are matched by longest prefix so "gpt-4o-mini-2024-07-18" resolves to the
# "gpt-4o-mini" entry without needing an exhaustive list of dated snapshots.
_PRICE_PER_MTOK: dict[str, tuple[float, float]] = {
    # model prefix          (prompt, completion)
    "gpt-4o-mini":          (0.15, 0.60),
    "gpt-4o":               (2.50, 10.00),
    "gpt-4.1-mini":         (0.40, 1.60),
    "gpt-4.1":              (2.00, 8.00),
    "claude-3-5-haiku":     (0.80, 4.00),
    "claude-3-5-sonnet":    (3.00, 15.00),
    "claude-sonnet-4":      (3.00, 15.00),
    "claude-haiku-4":       (1.00, 5.00),
    "moonshot-v1-8k":       (0.15, 0.15),
    "moonshot-v1-32k":      (0.30, 0.30),
    "kimi":                 (0.15, 0.15),
}

_UNKNOWN_MODEL_COST = 0.0


def estimate_cost_usd(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Best-effort cost estimate. Returns 0.0 for unrecognised models.

    Longest-prefix match so dated model snapshots resolve to their base price.
    """
    if not model:
        return _UNKNOWN_MODEL_COST
    key = model.lower()
    match = max(
        (p for p in _PRICE_PER_MTOK if key.startswith(p)),
        key=len,
        default=None,
    )
    if match is None:
        return _UNKNOWN_MODEL_COST
    p_price, c_price = _PRICE_PER_MTOK[match]
    return (prompt_tokens * p_price + completion_tokens * c_price) / 1_000_000


# ---------------------------------------------------------------------------
# Span / Trace
# ---------------------------------------------------------------------------
@dataclass
class Span:
    """One pipeline stage."""

    name: str
    start: float
    duration_ms: float | None = None
    attributes: dict[str, Any] = field(default_factory=dict)
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    model: str | None = None
    error: str | None = None

    def set(self, **attrs: Any) -> None:
        """Attach arbitrary attributes to this span."""
        self.attributes.update(attrs)

    def record_tokens(
        self,
        *,
        prompt: int = 0,
        completion: int = 0,
        total: int | None = None,
        model: str | None = None,
    ) -> None:
        """Record token usage and derive an estimated cost.

        ``total`` is accepted separately because some providers only report a
        combined number; we keep whatever the provider actually gave us rather
        than inventing a split.
        """
        self.prompt_tokens = prompt
        self.completion_tokens = completion
        self.total_tokens = total if total is not None else (prompt + completion)
        self.model = model
        if model:
            self.cost_usd = estimate_cost_usd(model, prompt, completion)

    def as_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "name": self.name,
            "duration_ms": round(self.duration_ms or 0.0, 2),
        }
        if self.attributes:
            out["attributes"] = self.attributes
        if self.total_tokens:
            out["tokens"] = {
                "prompt": self.prompt_tokens,
                "completion": self.completion_tokens,
                "total": self.total_tokens,
            }
        if self.model:
            out["model"] = self.model
        if self.cost_usd:
            out["cost_usd"] = round(self.cost_usd, 8)
        if self.error:
            out["error"] = self.error
        return out


@dataclass
class Trace:
    """All spans for a single request."""

    trace_id: str
    start: float
    spans: list[Span] = field(default_factory=list)
    attributes: dict[str, Any] = field(default_factory=dict)

    @property
    def total_tokens(self) -> int:
        return sum(s.total_tokens for s in self.spans)

    @property
    def total_cost_usd(self) -> float:
        return sum(s.cost_usd for s in self.spans)

    def set(self, **attrs: Any) -> None:
        self.attributes.update(attrs)

    def as_dict(self) -> dict[str, Any]:
        return {
            "trace_id": self.trace_id,
            "duration_ms": round((time.perf_counter() - self.start) * 1000, 2),
            "total_tokens": self.total_tokens,
            "total_cost_usd": round(self.total_cost_usd, 8),
            "attributes": self.attributes,
            "spans": [s.as_dict() for s in self.spans],
        }


_current_trace: ContextVar[Trace | None] = ContextVar("current_trace", default=None)


def start_trace(trace_id: str) -> Trace:
    """Begin a trace for this request. Safe to call more than once."""
    trace = Trace(trace_id=trace_id, start=time.perf_counter())
    _current_trace.set(trace)
    return trace


def current_trace() -> Trace | None:
    return _current_trace.get()


def finish_trace(level: int = logging.INFO) -> dict[str, Any] | None:
    """Emit the trace as one structured log line and clear it.

    Returns the serialised trace so callers (tests, the eval harness) can assert
    on it without parsing logs.
    """
    trace = _current_trace.get()
    if trace is None:
        return None
    _current_trace.set(None)
    try:
        payload = trace.as_dict()
    except Exception:  # pragma: no cover - defensive; tracing must never break a request
        logger.exception("[TRACE] failed to serialise trace")
        return None

    from app.config import get_settings

    if not get_settings().tracing_enabled:
        return payload

    try:
        logger.log(level, "[TRACE] %s", json.dumps(payload, default=str))
    except Exception:  # pragma: no cover
        logger.exception("[TRACE] failed to log trace")
    return payload


@contextmanager
def span(name: str, **attributes: Any) -> Iterator[Span]:
    """Time a pipeline stage and attach it to the current trace.

    Works with no active trace (the span is simply discarded), so services can
    be instrumented unconditionally and still be usable from unit tests and
    scripts that never start a trace.
    """
    s = Span(name=name, start=time.perf_counter(), attributes=dict(attributes))
    try:
        yield s
    except Exception as exc:
        s.error = f"{type(exc).__name__}: {exc}"
        raise
    finally:
        s.duration_ms = (time.perf_counter() - s.start) * 1000
        trace = _current_trace.get()
        if trace is not None:
            trace.spans.append(s)


def span_summary() -> str:
    """Compact ``stage=12ms`` string for human-readable log lines."""
    trace = _current_trace.get()
    if trace is None:
        return "-"
    return " ".join(f"{s.name}={(s.duration_ms or 0):.0f}ms" for s in trace.spans)
