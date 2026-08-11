"""Unit tests for the evaluation metrics (PLAN.md Phase 0.2).

These guard the harness itself. If a metric silently changes meaning, every
number in PLAN.md section 7 becomes incomparable to the ones before it — so the
scoring functions need tests as much as the pipeline does.

No Milvus, no API key.
"""
from eval.metrics import (
    CaseScore,
    aggregate,
    answer_correctness_lexical,
    answer_relevancy_lexical,
    context_precision,
    context_precision_at_k,
    context_recall,
    fact_coverage,
    faithfulness_lexical,
)


# ------------------------------------------------------------------ recall
def test_context_recall_all_expected_sources_found():
    assert context_recall(["a", "b"], ["a", "b", "c"]) == 1.0


def test_context_recall_partial():
    assert context_recall(["a", "b"], ["a", "c"]) == 0.5


def test_context_recall_none_found():
    assert context_recall(["a"], ["x", "y"]) == 0.0


def test_context_recall_undefined_when_nothing_expected():
    """Out-of-scope cases expect no sources; recall must not drag the mean down."""
    assert context_recall([], []) == 1.0
    assert context_recall([], ["anything"]) == 1.0


# --------------------------------------------------------------- precision
def test_context_precision_all_relevant():
    assert context_precision(["a"], ["a", "a"]) == 1.0


def test_context_precision_half_relevant():
    assert context_precision(["a"], ["a", "b"]) == 0.5


def test_context_precision_nothing_retrieved():
    assert context_precision(["a"], []) == 0.0
    # Nothing expected and nothing retrieved is the correct outcome.
    assert context_precision([], []) == 1.0


def test_context_precision_retrieved_when_none_expected_is_zero():
    assert context_precision([], ["a"]) == 0.0


def test_precision_at_k_rewards_relevant_chunks_ranked_first():
    """Ranking matters: an LLM attends unevenly across a long context."""
    first = context_precision_at_k(["a"], ["a", "x", "y"])
    last = context_precision_at_k(["a"], ["x", "y", "a"])
    assert first > last
    assert first == 1.0


# ----------------------------------------------------------- faithfulness
def test_faithfulness_full_when_answer_drawn_from_context():
    score = faithfulness_lexical(
        "Support is open Monday to Friday.",
        ["Support is open Monday to Friday, 9am to 5pm."],
    )
    assert score == 1.0


def test_faithfulness_penalises_invented_content():
    grounded = faithfulness_lexical("Support is open Monday.", ["Support is open Monday."])
    invented = faithfulness_lexical(
        "Support is open Monday and we also operate a spaceport in Bolivia.",
        ["Support is open Monday."],
    )
    assert invented < grounded


def test_faithfulness_zero_without_context():
    assert faithfulness_lexical("anything", []) == 0.0


def test_faithfulness_zero_for_empty_answer():
    assert faithfulness_lexical("", ["some context"]) == 0.0


# -------------------------------------------------------------- relevancy
def test_relevancy_high_when_answer_addresses_question():
    score = answer_relevancy_lexical(
        "Support is open Monday to Friday.", "When is support open?"
    )
    assert score > 0.5


def test_relevancy_low_for_deflection():
    on_topic = answer_relevancy_lexical(
        "Support is open Monday to Friday.", "When is support open?"
    )
    off_topic = answer_relevancy_lexical(
        "Our shipping rates vary by destination.", "When is support open?"
    )
    assert off_topic < on_topic


# ------------------------------------------------------------ correctness
def test_correctness_perfect_match():
    assert answer_correctness_lexical("30 days", "30 days") == 1.0


def test_correctness_penalises_padding():
    """F1, not plain overlap — verbosity should cost something."""
    tight = answer_correctness_lexical("Returns accepted within 30 days.",
                                       "Returns accepted within 30 days.")
    padded = answer_correctness_lexical(
        "Returns accepted within 30 days, and here is a great deal of additional "
        "unrelated commentary about warehouses and logistics and weather.",
        "Returns accepted within 30 days.",
    )
    assert padded < tight


def test_correctness_when_no_ground_truth_expected():
    # Out-of-scope: an empty answer is correct, any answer is not.
    assert answer_correctness_lexical("", None) == 1.0
    assert answer_correctness_lexical("I made something up", None) == 0.0


# ----------------------------------------------------------- fact coverage
def test_fact_coverage_all_present():
    assert fact_coverage("Free shipping over $50 applies.", ["$50"]) == 1.0


def test_fact_coverage_partial():
    assert fact_coverage("We ship to Canada.", ["Canada", "Mexico"]) == 0.5


def test_fact_coverage_is_case_insensitive():
    assert fact_coverage("email RETURNS@ACME.TEST", ["returns@acme.test"]) == 1.0


def test_fact_coverage_no_requirements():
    assert fact_coverage("anything", []) == 1.0


def test_fact_coverage_preserves_skus_and_codes():
    """The exact-match cases depend on these surviving intact."""
    assert fact_coverage("Model QM-4471-B costs $249.99", ["QM-4471-B"]) == 1.0
    assert fact_coverage("Error ERR_TIMEOUT_502 occurred", ["ERR_TIMEOUT_502"]) == 1.0


# ------------------------------------------------------------- aggregation
def _answered(case_id: str, **kw) -> CaseScore:
    base = dict(
        expected_confident=True,
        actual_confident=True,
        confidence_correct=True,
        answer="an answer",
        context_recall=1.0,
        context_precision=1.0,
        faithfulness=1.0,
        answer_relevancy=1.0,
        answer_correctness=1.0,
        fact_coverage=1.0,
        latency_ms=100.0,
    )
    base.update(kw)
    return CaseScore(case_id=case_id, **base)


def test_aggregate_empty():
    assert aggregate([])["case_count"] == 0


def test_generation_metrics_exclude_correctly_declined_cases():
    """Mixing 'correctly refused' into 'answered badly' would be meaningless."""
    declined = CaseScore(
        case_id="OOS-01",
        expected_confident=False,
        actual_confident=False,
        confidence_correct=True,
        tags=["out_of_scope"],
    )
    summary = aggregate([_answered("SH-01", tags=["baseline"]), declined])
    # Faithfulness averages only the one answered case, so it stays 1.0.
    assert summary["faithfulness"] == 1.0
    assert summary["answered_count"] == 1
    assert summary["case_count"] == 2


def test_false_negative_rate_counts_wrongly_declined():
    wrongly_declined = CaseScore(
        case_id="MT-01",
        expected_confident=True,
        actual_confident=False,
        confidence_correct=False,
        tags=["multi_turn"],
    )
    summary = aggregate([_answered("SH-01"), wrongly_declined])
    assert summary["false_negative_rate"] == 0.5
    assert summary["false_positive_rate"] == 0.0
    assert summary["confidence_accuracy"] == 0.5


def test_false_positive_rate_counts_wrongly_answered():
    hallucinated = CaseScore(
        case_id="OOS-01",
        expected_confident=False,
        actual_confident=True,
        confidence_correct=False,
        answer="I made this up",
        tags=["out_of_scope"],
    )
    summary = aggregate([hallucinated])
    assert summary["false_positive_rate"] == 1.0


def test_by_tag_reports_none_for_inapplicable_metrics():
    """An all-out_of_scope tag has undefined recall — must be None, not 0.0.

    Reporting 0.0 would read as '0% recall' when the truth is 'not applicable',
    and that misreading is exactly what makes people distrust a dashboard.
    """
    declined = CaseScore(
        case_id="OOS-01",
        expected_confident=False,
        actual_confident=False,
        confidence_correct=True,
        tags=["out_of_scope"],
    )
    summary = aggregate([declined])
    tag = summary["by_tag"]["out_of_scope"]
    assert tag["context_recall"] is None
    assert tag["context_precision"] is None
    assert tag["faithfulness"] is None
    # Confidence accuracy is always meaningful.
    assert tag["confidence_accuracy"] == 1.0


def test_by_tag_slices_independently():
    summary = aggregate([
        _answered("SH-01", tags=["baseline"]),
        CaseScore(
            case_id="MT-01",
            expected_confident=True,
            actual_confident=False,
            confidence_correct=False,
            context_recall=0.0,
            tags=["multi_turn"],
        ),
    ])
    assert summary["by_tag"]["baseline"]["context_recall"] == 1.0
    assert summary["by_tag"]["multi_turn"]["context_recall"] == 0.0


def test_latency_percentiles():
    scores = [_answered(f"C-{i}", latency_ms=float(i * 100)) for i in range(1, 11)]
    summary = aggregate(scores)
    assert 400 <= summary["latency_p50_ms"] <= 700
    assert summary["latency_p95_ms"] >= summary["latency_p50_ms"]
