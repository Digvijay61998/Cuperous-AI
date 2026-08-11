"""RAG evaluation metrics (PLAN.md Phase 0.2).

Implements the four-metric set that the literature converges on, split by the
layer it diagnoses. That split is the whole point: when an answer is wrong you
need to know whether *retrieval* fetched the wrong chunks or the *generator*
hallucinated despite good context.

    Retriever
      context_recall     did we retrieve the sources that contain the answer?
      context_precision  were the retrieved chunks actually relevant?

    Generator
      faithfulness       is every claim in the answer supported by the context?
      answer_relevancy   does the answer actually address the question?
      answer_correctness does the answer match the reference answer?

    Gate
      confidence_accuracy did we answer when we should, and decline when we should?

Two scoring modes
-----------------
``deterministic`` (default)
    No LLM, no API key, no cost, fully reproducible. Uses source-overlap for
    retrieval metrics and lexical/embedding overlap for generation metrics.
    Good enough to detect regressions, which is what CI needs.

``judge``
    Adds LLM-as-judge scoring for faithfulness and answer relevancy, which are
    genuinely hard to approximate lexically. Needs an API key and costs money.

We deliberately did not take a dependency on RAGAS. Its metric *definitions* are
the reference we implement against, but pulling in the package would drag
LangChain and a large dependency tree into a service whose whole design point is
a small footprint. If we later want RAGAS's exact prompts we can add it as a
dev-only extra behind the ``judge`` mode.
"""
from __future__ import annotations

import logging
import math
import re
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger("eval.metrics")

# Words carrying no discriminative signal for lexical overlap.
_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can",
    "could", "did", "do", "does", "for", "from", "had", "has", "have", "how",
    "i", "if", "in", "into", "is", "it", "its", "may", "me", "might", "must",
    "my", "of", "on", "or", "our", "shall", "should", "so", "some", "that",
    "the", "their", "them", "then", "there", "these", "they", "this", "those",
    "to", "was", "we", "were", "what", "when", "where", "which", "who", "will",
    "with", "would", "you", "your",
}

_TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9\-_./@]*")
# Punctuation that is meaningful *inside* a token but never at its edge.
# Keeping it internal preserves "qm-4471-b", "err_timeout_502", "3.2" and
# "returns@acme.test"; stripping it at the edges stops "friday." from being a
# different token than "friday", which would otherwise silently depress every
# faithfulness and correctness score.
_TOKEN_EDGE = ".-_/@"


def _tokens(text: str, drop_stopwords: bool = True) -> set[str]:
    """Lowercase tokens, keeping SKU-ish punctuation *inside* tokens intact.

    ``QM-4471-B`` and ``ERR_TIMEOUT_502`` must survive as single tokens —
    splitting them would destroy exactly the signal the exact-match cases exist
    to measure. Trailing sentence punctuation is stripped so ``Friday.`` and
    ``Friday`` compare equal.
    """
    if not text:
        return set()
    out: set[str] = set()
    for raw in _TOKEN_RE.findall(text.lower()):
        token = raw.strip(_TOKEN_EDGE)
        if not token or len(token) < 2:
            continue
        if drop_stopwords and token in _STOPWORDS:
            continue
        out.add(token)
    return out


def _f1(precision: float, recall: float) -> float:
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


# ---------------------------------------------------------------------------
# Result containers
# ---------------------------------------------------------------------------
@dataclass
class CaseScore:
    """Metrics for one evaluation case."""

    case_id: str
    tags: list[str] = field(default_factory=list)

    # Gate
    expected_confident: bool = True
    actual_confident: bool = False
    confidence_correct: bool = False

    # Retriever
    context_recall: float = 0.0
    context_precision: float = 0.0

    # Generator
    faithfulness: float = 0.0
    answer_relevancy: float = 0.0
    answer_correctness: float = 0.0
    fact_coverage: float = 0.0

    # Operational
    latency_ms: float = 0.0
    tokens_used: int = 0
    cost_usd: float = 0.0

    # Diagnostics
    retrieved_sources: list[str] = field(default_factory=list)
    top_score: float | None = None
    answer: str | None = None
    error: str | None = None
    notes: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "case_id": self.case_id,
            "tags": self.tags,
            "expected_confident": self.expected_confident,
            "actual_confident": self.actual_confident,
            "confidence_correct": self.confidence_correct,
            "context_recall": round(self.context_recall, 4),
            "context_precision": round(self.context_precision, 4),
            "faithfulness": round(self.faithfulness, 4),
            "answer_relevancy": round(self.answer_relevancy, 4),
            "answer_correctness": round(self.answer_correctness, 4),
            "fact_coverage": round(self.fact_coverage, 4),
            "latency_ms": round(self.latency_ms, 2),
            "tokens_used": self.tokens_used,
            "cost_usd": round(self.cost_usd, 8),
            "retrieved_sources": self.retrieved_sources,
            "top_score": self.top_score,
            "answer": self.answer,
            "error": self.error,
            "notes": self.notes,
        }


# ---------------------------------------------------------------------------
# Retriever metrics
# ---------------------------------------------------------------------------
def context_recall(expected_sources: list[str], retrieved_sources: list[str]) -> float:
    """Fraction of expected sources that appear in the retrieved set.

    This is the single most important retrieval metric for us: if the source
    containing the answer never got retrieved, no amount of prompt engineering
    downstream can save the answer.

    Undefined when nothing is expected (out-of-scope cases) — returns 1.0 so it
    does not drag the aggregate down.
    """
    if not expected_sources:
        return 1.0
    retrieved = set(retrieved_sources)
    hit = sum(1 for s in expected_sources if s in retrieved)
    return hit / len(expected_sources)


def context_precision(
    expected_sources: list[str],
    retrieved_sources: list[str],
) -> float:
    """Fraction of retrieved chunks that came from an expected source.

    Rewards a tight context window. Low precision means we are burning context
    budget — and inviting distraction — on irrelevant chunks. This is the metric
    a reranker (Phase 2) should move most.
    """
    if not retrieved_sources:
        return 0.0 if expected_sources else 1.0
    if not expected_sources:
        return 0.0
    expected = set(expected_sources)
    hit = sum(1 for s in retrieved_sources if s in expected)
    return hit / len(retrieved_sources)


def context_precision_at_k(
    expected_sources: list[str],
    retrieved_sources: list[str],
) -> float:
    """Rank-aware precision — rewards putting relevant chunks first.

    Mean of precision@k over the positions where a relevant chunk appears. An
    LLM attends unevenly across a long context, so ordering genuinely matters.
    """
    if not expected_sources or not retrieved_sources:
        return context_precision(expected_sources, retrieved_sources)
    expected = set(expected_sources)
    precisions: list[float] = []
    hits = 0
    for i, src in enumerate(retrieved_sources, start=1):
        if src in expected:
            hits += 1
            precisions.append(hits / i)
    if not precisions:
        return 0.0
    return sum(precisions) / len(precisions)


# ---------------------------------------------------------------------------
# Generator metrics — deterministic approximations
# ---------------------------------------------------------------------------
def faithfulness_lexical(answer: str, contexts: list[str]) -> float:
    """Approximate groundedness: what share of the answer's content words appear
    in the retrieved context?

    A low score means the answer introduced vocabulary absent from the context —
    a hallucination signal. This is a proxy, not proof: an LLM can paraphrase
    faithfully and score lower than it deserves. Treat movement over runs as the
    signal, not the absolute value. Use ``judge`` mode when you need rigour.
    """
    if not answer:
        return 0.0
    if not contexts:
        return 0.0
    answer_tokens = _tokens(answer)
    if not answer_tokens:
        return 1.0
    context_tokens = _tokens(" ".join(contexts))
    supported = answer_tokens & context_tokens
    return len(supported) / len(answer_tokens)


def answer_relevancy_lexical(answer: str, question: str) -> float:
    """Approximate whether the answer engages with the question's subject.

    Uses recall of question content words, capped at 1.0. A short answer that
    reuses the question's key nouns scores well; a generic deflection does not.
    """
    if not answer or not question:
        return 0.0
    q_tokens = _tokens(question)
    if not q_tokens:
        return 1.0
    a_tokens = _tokens(answer)
    overlap = q_tokens & a_tokens
    return min(1.0, len(overlap) / len(q_tokens))


def answer_correctness_lexical(answer: str, ground_truth: str | None) -> float:
    """Token-level F1 against the reference answer.

    F1 rather than plain overlap so a rambling answer that happens to contain the
    right words is penalised for the padding.
    """
    if ground_truth is None:
        return 1.0 if not answer else 0.0
    if not answer:
        return 0.0
    a = _tokens(answer)
    g = _tokens(ground_truth)
    if not g:
        return 1.0
    if not a:
        return 0.0
    overlap = len(a & g)
    precision = overlap / len(a)
    recall = overlap / len(g)
    return _f1(precision, recall)


def fact_coverage(answer: str, expected_facts: list[str]) -> float:
    """Share of required substrings present in the answer.

    Deliberately a substring check, case-insensitive: for facts like ``$50``,
    ``14.99`` or ``returns@acme.test`` exact presence is what we care about, and
    tokenisation would only get in the way.
    """
    if not expected_facts:
        return 1.0
    if not answer:
        return 0.0
    low = answer.lower()
    hit = sum(1 for f in expected_facts if str(f).lower() in low)
    return hit / len(expected_facts)


# ---------------------------------------------------------------------------
# Generator metrics — LLM as judge
# ---------------------------------------------------------------------------
_FAITHFULNESS_PROMPT = """You are evaluating whether an AI answer is grounded in \
the context it was given.

CONTEXT:
{context}

ANSWER:
{answer}

Break the ANSWER into individual factual claims. For each claim decide whether it \
is directly supported by the CONTEXT.

Reply with ONLY a JSON object, no other text:
{{"total_claims": <int>, "supported_claims": <int>, "unsupported": ["<claim>", ...]}}
"""

_RELEVANCY_PROMPT = """You are evaluating whether an AI answer addresses the \
user's question.

QUESTION:
{question}

ANSWER:
{answer}

Score how well the ANSWER addresses the QUESTION on a 0-10 scale, where:
  10 = fully and directly answers the question
   5 = partially answers, or answers with significant irrelevant content
   0 = does not address the question at all

Reply with ONLY a JSON object, no other text:
{{"score": <int 0-10>, "reason": "<one short sentence>"}}
"""


def _judge_json(provider: Any, prompt: str) -> dict[str, Any] | None:
    """Run one judge call and parse its JSON reply.

    Returns None on any failure — a judge outage must degrade the metric, never
    fail the run.
    """
    import json

    try:
        result = provider.generate([{"role": "user", "content": prompt}])
    except Exception:
        logger.warning("[EVAL] judge call failed", exc_info=True)
        return None

    text = (result.text or "").strip()
    # Models like wrapping JSON in fences despite instructions.
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE).strip()
    try:
        return json.loads(text)
    except Exception:
        # Last resort: grab the first {...} block.
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        logger.warning("[EVAL] judge returned unparseable output: %r", text[:200])
        return None


def faithfulness_judge(provider: Any, answer: str, contexts: list[str]) -> float | None:
    """LLM-scored groundedness: supported claims / total claims."""
    if not answer or not contexts:
        return None
    payload = _judge_json(
        provider,
        _FAITHFULNESS_PROMPT.format(
            context="\n\n---\n\n".join(contexts),
            answer=answer,
        ),
    )
    if not payload:
        return None
    total = payload.get("total_claims") or 0
    supported = payload.get("supported_claims") or 0
    if total <= 0:
        return None
    return max(0.0, min(1.0, supported / total))


def answer_relevancy_judge(provider: Any, answer: str, question: str) -> float | None:
    """LLM-scored answer relevancy, normalised to 0-1."""
    if not answer:
        return None
    payload = _judge_json(
        provider,
        _RELEVANCY_PROMPT.format(question=question, answer=answer),
    )
    if not payload:
        return None
    score = payload.get("score")
    if score is None:
        return None
    try:
        return max(0.0, min(1.0, float(score) / 10.0))
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------
def _mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    k = (len(ordered) - 1) * pct
    lo = math.floor(k)
    hi = math.ceil(k)
    if lo == hi:
        return ordered[int(k)]
    return ordered[lo] * (hi - k) + ordered[hi] * (k - lo)


def aggregate(scores: list[CaseScore]) -> dict[str, Any]:
    """Roll per-case scores into headline numbers plus per-tag breakdowns.

    Generation metrics are averaged **only over cases that actually produced an
    answer**. Including declined out-of-scope cases would mix "correctly refused"
    into "answered badly" and make the number meaningless.
    """
    if not scores:
        return {"case_count": 0}

    answered = [s for s in scores if s.actual_confident and s.answer]
    expected_answer = [s for s in scores if s.expected_confident]
    expected_decline = [s for s in scores if not s.expected_confident]

    summary: dict[str, Any] = {
        "case_count": len(scores),
        "answered_count": len(answered),
        "error_count": sum(1 for s in scores if s.error),
        # --- retriever ---
        "context_recall": _mean([s.context_recall for s in expected_answer]),
        "context_precision": _mean([s.context_precision for s in expected_answer]),
        # --- generator (answered cases only) ---
        "faithfulness": _mean([s.faithfulness for s in answered]),
        "answer_relevancy": _mean([s.answer_relevancy for s in answered]),
        "answer_correctness": _mean([s.answer_correctness for s in answered]),
        "fact_coverage": _mean([s.fact_coverage for s in answered]),
        # --- gate ---
        "confidence_accuracy": _mean(
            [1.0 if s.confidence_correct else 0.0 for s in scores]
        ),
        "false_negative_rate": _mean(
            [0.0 if s.actual_confident else 1.0 for s in expected_answer]
        ),
        "false_positive_rate": _mean(
            [1.0 if s.actual_confident else 0.0 for s in expected_decline]
        ),
        # --- operational ---
        "latency_p50_ms": _percentile([s.latency_ms for s in scores], 0.50),
        "latency_p95_ms": _percentile([s.latency_ms for s in scores], 0.95),
        "total_tokens": sum(s.tokens_used for s in scores),
        "total_cost_usd": sum(s.cost_usd for s in scores),
    }

    # Per-tag breakdown so we can see, e.g., that multi_turn is at 0.0 while
    # baseline is at 0.9 — the aggregate alone would hide that.
    by_tag: dict[str, dict[str, Any]] = {}
    all_tags = sorted({t for s in scores for t in s.tags})
    for tag in all_tags:
        tagged = [s for s in scores if tag in s.tags]
        tag_answered = [s for s in tagged if s.actual_confident and s.answer]
        # Retrieval metrics are only defined for cases that are supposed to
        # retrieve something. For an all-out_of_scope tag this list is empty, and
        # _mean returns 0.0 — which would read as "0% recall" when the correct
        # reading is "not applicable". Report None in that case so the table can
        # print a dash instead of a misleading zero.
        tag_expected = [s for s in tagged if s.expected_confident]
        by_tag[tag] = {
            "case_count": len(tagged),
            "context_recall": (
                _mean([s.context_recall for s in tag_expected])
                if tag_expected
                else None
            ),
            "context_precision": (
                _mean([s.context_precision for s in tag_expected])
                if tag_expected
                else None
            ),
            "faithfulness": (
                _mean([s.faithfulness for s in tag_answered])
                if tag_answered
                else None
            ),
            "answer_correctness": (
                _mean([s.answer_correctness for s in tag_answered])
                if tag_answered
                else None
            ),
            "fact_coverage": (
                _mean([s.fact_coverage for s in tag_answered])
                if tag_answered
                else None
            ),
            # Always defined: "did we make the right answer/decline call?"
            "confidence_accuracy": _mean(
                [1.0 if s.confidence_correct else 0.0 for s in tagged]
            ),
        }
    summary["by_tag"] = by_tag

    return summary
