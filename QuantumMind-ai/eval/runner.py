"""Evaluation harness runner (PLAN.md Phase 0).

Ingests the golden corpus into an isolated Milvus collection, runs every case
through the real ``QueryService``, scores the results, and writes a JSON report.

    python -m eval.runner                    # deterministic, no API key needed
    python -m eval.runner --mode judge       # + LLM-as-judge (needs a key)
    python -m eval.runner --tags multi_turn  # only multi-turn cases
    python -m eval.runner --baseline         # also write results/baseline.json
    python -m eval.runner --compare          # diff against baseline, exit 1 on regression

Isolation
---------
Every run creates its own collection (``eval_<8 hex>``) and drops it in teardown,
so a run can never touch production data or another concurrent run. The client id
is likewise namespaced per run.

The collection name is **forced**, not defaulted. An earlier version used
``os.environ.setdefault``, which silently did nothing whenever ``MILVUS_COLLECTION``
was already set — and it always is, because ``.env`` sets it and the Makefile
passes ``--env-file .env``. The harness therefore ran against the production
collection and dropped it in teardown. Do not weaken this back to a default.

Why this drives the real service
--------------------------------
The harness calls ``QueryService.answer_question`` — the same code path the HTTP
route uses. Reimplementing a simplified pipeline for evaluation would measure the
harness, not the product.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# The collection name must be set before app.config is imported anywhere, because
# Settings is an lru_cache'd singleton that reads the environment once.
_RUN_ID = uuid.uuid4().hex[:8]
_EVAL_COLLECTION = f"eval_{_RUN_ID}"
# Assign, never setdefault: `.env` sets MILVUS_COLLECTION and the Makefile passes
# --env-file, so a setdefault would leave the production collection in place and
# teardown would then DROP it. This assignment is the only thing standing between
# an eval run and production data loss.
os.environ["MILVUS_COLLECTION"] = _EVAL_COLLECTION
# Keep harness output readable; the service's debug banners would drown it.
os.environ.setdefault("AI_DEBUG_LOGS", "false")
os.environ.setdefault("AI_TRACING", "false")

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from eval.metrics import (  # noqa: E402
    CaseScore,
    aggregate,
    answer_correctness_lexical,
    answer_relevancy_judge,
    answer_relevancy_lexical,
    context_precision,
    context_recall,
    fact_coverage,
    faithfulness_judge,
    faithfulness_lexical,
)

logger = logging.getLogger("eval.runner")


# ---------------------------------------------------------------------------
# Dataset loading
# ---------------------------------------------------------------------------
def load_dataset(path: Path) -> dict[str, Any]:
    """Load the golden dataset.

    Uses PyYAML when available and falls back to a JSON sibling file otherwise,
    so the harness has no hard new runtime dependency.
    """
    if not path.exists():
        raise FileNotFoundError(f"golden dataset not found: {path}")

    text = path.read_text(encoding="utf-8")

    if path.suffix in (".yaml", ".yml"):
        try:
            import yaml  # type: ignore
        except ImportError as exc:  # pragma: no cover
            raise ImportError(
                "PyYAML is required to read the YAML golden dataset. "
                "Install it with `pip install pyyaml`, or provide "
                f"{path.with_suffix('.json')} instead."
            ) from exc
        data = yaml.safe_load(text)
    else:
        data = json.loads(text)

    if not isinstance(data, dict) or "cases" not in data:
        raise ValueError(f"malformed dataset (expected a mapping with 'cases'): {path}")
    return data


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------
class EvalRunner:
    def __init__(
        self,
        *,
        mode: str = "deterministic",
        tags: list[str] | None = None,
        case_ids: list[str] | None = None,
        company_name: str = "Acme",
    ) -> None:
        self.mode = mode
        self.tags = set(tags or [])
        self.case_ids = set(case_ids or [])
        self.company_name = company_name
        self.client_id = f"eval_{_RUN_ID}"
        self._judge = None

    # ------------------------------------------------------------------ setup
    @property
    def judge(self):
        """Lazily built judge provider — only when --mode judge is used."""
        if self._judge is None and self.mode == "judge":
            from app.config import get_settings
            from app.llm.factory import build_provider

            settings = get_settings()
            # Judge with eval_judge_model, independent of the model under test.
            judge_settings = settings.model_copy(
                update={"llm_model": settings.eval_judge_model, "llm_temperature": 0.0}
            )
            self._judge = build_provider(judge_settings)
            logger.info("[EVAL] judge model: %s", settings.eval_judge_model)
        return self._judge

    def ingest_corpus(self, corpus: list[dict[str, Any]]) -> int:
        """Load the golden corpus into the isolated eval collection."""
        from app.services.ingestion import IngestionService

        service = IngestionService()
        total = 0
        for doc in corpus:
            count = service.ingest_text(
                client_id=self.client_id,
                text=doc["text"],
                source=doc["source"],
                source_type=doc.get("source_type", "manual"),
            )
            total += count
            logger.info(
                "[EVAL] ingested %-20s -> %d chunk(s)", doc["source"], count
            )
        return total

    # ------------------------------------------------------------------ cases
    def _select(self, cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
        selected = cases
        if self.case_ids:
            selected = [c for c in selected if c["id"] in self.case_ids]
        if self.tags:
            selected = [
                c for c in selected if self.tags & set(c.get("tags") or [])
            ]
        return selected

    def run_case(self, case: dict[str, Any]) -> CaseScore:
        """Run one case through the real query service and score it."""
        from app.schemas import ChatMessage
        from app.services.query import QueryService

        case_id = case["id"]
        question = case["question"]
        expected_sources = case.get("expected_sources") or []
        expected_facts = case.get("expected_facts") or []
        expect_confident = bool(case.get("expect_confident", True))
        ground_truth = case.get("ground_truth")

        score = CaseScore(
            case_id=case_id,
            tags=list(case.get("tags") or []),
            expected_confident=expect_confident,
        )

        history = [
            ChatMessage(role=t["role"], content=t["content"])
            for t in (case.get("chat_history") or [])
        ]

        service = QueryService()
        start = time.perf_counter()
        try:
            response = service.answer_question(
                client_id=self.client_id,
                question=question,
                chat_history=history,
                company_name=self.company_name,
            )
        except Exception as exc:
            score.error = f"{type(exc).__name__}: {exc}"
            score.latency_ms = (time.perf_counter() - start) * 1000
            logger.error("[EVAL] %s FAILED: %s", case_id, score.error)
            return score
        score.latency_ms = (time.perf_counter() - start) * 1000

        score.actual_confident = response.confident
        score.confidence_correct = response.confident == expect_confident
        score.answer = response.answer
        score.tokens_used = response.tokens_used

        # Cost estimate for the run budget line.
        from app.tracing import estimate_cost_usd

        # We only have a combined token count on the response, so attribute it
        # all as prompt tokens — context dominates in RAG, and this keeps the
        # estimate on the conservative side rather than inventing a split.
        score.cost_usd = estimate_cost_usd(response.model, response.tokens_used, 0)

        # ---- retriever metrics -------------------------------------------
        # sources[].source_url is empty for manual ingests, so we cannot read the
        # source name back off the response. Query the store directly for the
        # metadata we need. This keeps the golden dataset able to assert on
        # source names, which is the only stable identity a chunk has.
        retrieved_sources = self._retrieved_sources(question, history, response)
        score.retrieved_sources = retrieved_sources
        score.top_score = (
            round(response.sources[0].score, 4) if response.sources else None
        )
        score.context_recall = context_recall(expected_sources, retrieved_sources)
        score.context_precision = context_precision(
            expected_sources, retrieved_sources
        )

        # ---- generator metrics -------------------------------------------
        contexts = [s.text for s in response.sources]
        if response.answer:
            score.fact_coverage = fact_coverage(response.answer, expected_facts)
            score.answer_correctness = answer_correctness_lexical(
                response.answer, ground_truth
            )

            judged_faith = None
            judged_rel = None
            if self.mode == "judge" and self.judge is not None:
                judged_faith = faithfulness_judge(
                    self.judge, response.answer, contexts
                )
                judged_rel = answer_relevancy_judge(
                    self.judge, response.answer, question
                )

            if judged_faith is not None:
                score.faithfulness = judged_faith
                score.notes.append("faithfulness=judge")
            else:
                score.faithfulness = faithfulness_lexical(response.answer, contexts)
                score.notes.append("faithfulness=lexical")

            if judged_rel is not None:
                score.answer_relevancy = judged_rel
                score.notes.append("relevancy=judge")
            else:
                score.answer_relevancy = answer_relevancy_lexical(
                    response.answer, question
                )
                score.notes.append("relevancy=lexical")
        elif not expect_confident:
            # Correctly declined. Generation metrics do not apply; aggregate()
            # excludes unanswered cases so these zeros never reach the average.
            score.notes.append("correctly_declined")

        self._log_case(score, expected_sources)
        return score

    def _retrieved_sources(self, question, history, response) -> list[str]:
        """Map retrieved chunk text back to source names.

        ``QueryResponse.sources`` carries text and an optional URL but not the
        logical ``source`` field, and manual ingests leave ``source_url`` empty.
        Rather than change the public response shape for the harness's benefit,
        we look the chunks up by text in the store.
        """
        if not response.sources:
            return []
        from app.services.vector_store import get_vector_store

        store = get_vector_store()
        try:
            return store.sources_for_texts(
                self.client_id, [s.text for s in response.sources]
            )
        except Exception:
            logger.warning("[EVAL] could not resolve source names", exc_info=True)
            return []

    @staticmethod
    def _log_case(score: CaseScore, expected_sources: list[str]) -> None:
        if score.error:
            mark = "ERR "
        elif score.confidence_correct and score.context_recall >= 0.999:
            mark = "PASS"
        elif score.confidence_correct:
            mark = "WARN"
        else:
            mark = "FAIL"
        logger.info(
            "[EVAL] %s %-7s conf=%-5s recall=%.2f prec=%.2f facts=%.2f "
            "corr=%.2f %.0fms",
            mark,
            score.case_id,
            score.actual_confident,
            score.context_recall,
            score.context_precision,
            score.fact_coverage,
            score.answer_correctness,
            score.latency_ms,
        )
        if mark in ("FAIL", "WARN") and expected_sources:
            logger.info(
                "         expected_sources=%s got=%s",
                expected_sources,
                score.retrieved_sources,
            )

    # -------------------------------------------------------------------- run
    def run(self, dataset: dict[str, Any]) -> dict[str, Any]:
        corpus = dataset.get("corpus") or []
        cases = self._select(dataset.get("cases") or [])

        if not cases:
            raise SystemExit("no cases selected — check --tags / --case filters")

        from app.config import get_settings

        settings = get_settings()

        logger.info("=" * 72)
        logger.info("JarCube AI — evaluation run")
        logger.info("=" * 72)
        logger.info("  run id          : %s", _RUN_ID)
        logger.info("  collection      : %s", settings.milvus_collection)
        logger.info("  client id       : %s", self.client_id)
        logger.info("  mode            : %s", self.mode)
        logger.info("  cases           : %d", len(cases))
        logger.info("  embedding model : %s", settings.embedding_model)
        logger.info("  llm provider    : %s / %s", settings.llm_provider, settings.llm_model)
        logger.info("  top_k           : %d", settings.retrieval_top_k)
        logger.info("  threshold       : %s", settings.min_similarity_score)
        logger.info("=" * 72)

        chunks = self.ingest_corpus(corpus)
        logger.info("[EVAL] corpus ready: %d chunks from %d docs", chunks, len(corpus))
        logger.info("-" * 72)

        started = time.perf_counter()
        scores = [self.run_case(c) for c in cases]
        elapsed = time.perf_counter() - started

        summary = aggregate(scores)
        summary["wall_seconds"] = round(elapsed, 2)

        return {
            "run_id": _RUN_ID,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mode": self.mode,
            "config": {
                "embedding_model": settings.embedding_model,
                "llm_provider": settings.llm_provider,
                "llm_model": settings.llm_model,
                "retrieval_top_k": settings.retrieval_top_k,
                "min_similarity_score": settings.min_similarity_score,
                "chunk_size": settings.chunk_size,
                "chunk_overlap": settings.chunk_overlap,
            },
            "corpus_chunks": chunks,
            "summary": summary,
            "cases": [s.as_dict() for s in scores],
        }

    def teardown(self) -> None:
        """Drop the isolated eval collection.

        Refuses to drop anything that is not this run's own collection. Teardown
        is the one destructive operation in the harness, so it verifies its
        target rather than trusting configuration — a mis-resolved setting must
        cost us a leaked eval collection, never production data.
        """
        from app.config import get_settings

        name = get_settings().milvus_collection
        if name != _EVAL_COLLECTION:
            logger.error(
                "[EVAL] REFUSING to drop %r — expected this run's collection %r. "
                "Something overrode MILVUS_COLLECTION. Not dropping anything.",
                name,
                _EVAL_COLLECTION,
            )
            return
        try:
            from pymilvus import utility

            utility.drop_collection(name, using="default")
            logger.info("[EVAL] dropped collection %s", name)
        except Exception:
            logger.warning("[EVAL] could not drop eval collection", exc_info=True)


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------
_HEADLINE = [
    ("context_recall", "Context Recall", "retriever"),
    ("context_precision", "Context Precision", "retriever"),
    ("faithfulness", "Faithfulness", "generator"),
    ("answer_relevancy", "Answer Relevancy", "generator"),
    ("answer_correctness", "Answer Correctness", "generator"),
    ("fact_coverage", "Fact Coverage", "generator"),
    ("confidence_accuracy", "Confidence Accuracy", "gate"),
    ("false_negative_rate", "False Negative Rate", "gate"),
    ("false_positive_rate", "False Positive Rate", "gate"),
]


def print_report(report: dict[str, Any]) -> None:
    s = report["summary"]
    print()
    print("=" * 72)
    print("EVALUATION SUMMARY")
    print("=" * 72)
    print(f"  run       : {report['run_id']}  ({report['mode']} mode)")
    print(f"  cases     : {s['case_count']}  answered={s['answered_count']}  errors={s['error_count']}")
    print(f"  wall time : {s['wall_seconds']}s")
    print()
    print(f"  {'METRIC':<24} {'SCORE':>8}   LAYER")
    print("  " + "-" * 50)
    for key, label, layer in _HEADLINE:
        print(f"  {label:<24} {s.get(key, 0.0):>8.3f}   {layer}")
    print()
    print("  OPERATIONAL")
    print("  " + "-" * 50)
    print(f"  {'latency p50':<24} {s['latency_p50_ms']:>8.0f} ms")
    print(f"  {'latency p95':<24} {s['latency_p95_ms']:>8.0f} ms")
    print(f"  {'total tokens':<24} {s['total_tokens']:>8}")
    print(f"  {'est. cost':<24} ${s['total_cost_usd']:>7.5f}")
    print()

    by_tag = s.get("by_tag") or {}
    if by_tag:
        print("  BY TAG")
        print("  " + "-" * 66)
        print(f"  {'tag':<28} {'n':>3} {'recall':>7} {'prec':>7} {'facts':>7} {'conf':>7}")
        print("  " + "-" * 66)
        def _cell(value: float | None) -> str:
            """Render None as a dash — 'not applicable', not 'scored zero'."""
            return "      -" if value is None else f"{value:>7.3f}"

        for tag in sorted(by_tag):
            t = by_tag[tag]
            print(
                f"  {tag:<28} {t['case_count']:>3} "
                f"{_cell(t['context_recall'])} {_cell(t['context_precision'])} "
                f"{_cell(t['fact_coverage'])} {_cell(t['confidence_accuracy'])}"
            )
        print()

    failures = [
        c for c in report["cases"]
        if c["error"] or not c["confidence_correct"] or c["context_recall"] < 0.999
    ]
    if failures:
        print(f"  ATTENTION — {len(failures)} case(s) below target")
        print("  " + "-" * 66)
        for c in failures:
            reason = (
                c["error"]
                if c["error"]
                else "wrong confidence"
                if not c["confidence_correct"]
                else f"recall {c['context_recall']:.2f}"
            )
            tags = ",".join(c["tags"][:2])
            print(f"  {c['case_id']:<8} {reason:<28} [{tags}]")
        print()
    print("=" * 72)


def write_report(report: dict[str, Any], results_dir: Path, baseline: bool) -> Path:
    results_dir.mkdir(parents=True, exist_ok=True)
    stamp = report["timestamp"].replace(":", "").replace("-", "")[:15]
    path = results_dir / f"run_{stamp}_{report['run_id']}.json"
    path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    latest = results_dir / "latest.json"
    latest.write_text(json.dumps(report, indent=2), encoding="utf-8")

    if baseline:
        base = results_dir / "baseline.json"
        base.write_text(json.dumps(report, indent=2), encoding="utf-8")
        logger.info("[EVAL] baseline written -> %s", base)

    # Append a one-line history record for trend tracking.
    history = results_dir / "history.jsonl"
    s = report["summary"]
    with history.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps({
            "timestamp": report["timestamp"],
            "run_id": report["run_id"],
            "mode": report["mode"],
            **{k: round(s.get(k, 0.0), 4) for k, _, _ in _HEADLINE},
            "latency_p50_ms": round(s["latency_p50_ms"], 1),
            "total_cost_usd": round(s["total_cost_usd"], 6),
        }) + "\n")

    return path


# Metrics where a DROP is a regression. false_*_rate are inverted and handled
# separately, because for those an increase is the regression.
_HIGHER_IS_BETTER = [
    "context_recall",
    "context_precision",
    "faithfulness",
    "answer_relevancy",
    "answer_correctness",
    "fact_coverage",
    "confidence_accuracy",
]
_LOWER_IS_BETTER = ["false_negative_rate", "false_positive_rate"]


def compare_to_baseline(
    report: dict[str, Any],
    results_dir: Path,
    tolerance: float,
) -> bool:
    """Compare against baseline.json. Returns True if acceptable.

    Tolerance exists because LLM output is non-deterministic; without it CI would
    flap on noise. It does not apply in deterministic mode where runs are stable.
    """
    base_path = results_dir / "baseline.json"
    if not base_path.exists():
        print(f"\n  no baseline at {base_path} — run with --baseline first\n")
        return True

    base = json.loads(base_path.read_text(encoding="utf-8"))
    bs, cs = base["summary"], report["summary"]

    print()
    print("=" * 72)
    print(f"COMPARISON vs BASELINE  ({base['timestamp'][:19]})")
    print("=" * 72)
    print(f"  {'METRIC':<24} {'BASE':>8} {'NOW':>8} {'DELTA':>9}")
    print("  " + "-" * 54)

    regressions: list[str] = []

    for key in _HIGHER_IS_BETTER:
        b, c = bs.get(key, 0.0), cs.get(key, 0.0)
        delta = c - b
        flag = ""
        if delta < -tolerance:
            flag = "  REGRESSION"
            regressions.append(f"{key}: {b:.3f} -> {c:.3f}")
        elif delta > tolerance:
            flag = "  improved"
        print(f"  {key:<24} {b:>8.3f} {c:>8.3f} {delta:>+9.3f}{flag}")

    for key in _LOWER_IS_BETTER:
        b, c = bs.get(key, 0.0), cs.get(key, 0.0)
        delta = c - b
        flag = ""
        if delta > tolerance:
            flag = "  REGRESSION"
            regressions.append(f"{key}: {b:.3f} -> {c:.3f}")
        elif delta < -tolerance:
            flag = "  improved"
        print(f"  {key:<24} {b:>8.3f} {c:>8.3f} {delta:>+9.3f}{flag}")

    print()
    if regressions:
        print(f"  {len(regressions)} REGRESSION(S) (tolerance {tolerance:.3f}):")
        for r in regressions:
            print(f"    - {r}")
        print("=" * 72)
        return False
    print(f"  No regressions beyond tolerance {tolerance:.3f}.")
    print("=" * 72)
    return True


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(
        description="JarCube AI evaluation harness (PLAN.md Phase 0)"
    )
    parser.add_argument(
        "--mode",
        choices=["deterministic", "judge"],
        default="deterministic",
        help="deterministic = no LLM judge, no key, reproducible (default). "
             "judge = adds LLM-scored faithfulness and relevancy.",
    )
    parser.add_argument("--dataset", type=Path, default=None)
    parser.add_argument("--results-dir", type=Path, default=None)
    parser.add_argument("--tags", nargs="*", default=None, help="only these tags")
    parser.add_argument("--case", nargs="*", default=None, help="only these case ids")
    parser.add_argument("--baseline", action="store_true", help="write baseline.json")
    parser.add_argument("--compare", action="store_true", help="diff vs baseline; exit 1 on regression")
    parser.add_argument("--tolerance", type=float, default=0.02)
    parser.add_argument("--keep-collection", action="store_true", help="skip teardown (debugging)")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(message)s",
        stream=sys.stdout,
    )
    # Silence the service's own chatter so the harness output stays readable.
    for noisy in ("ai.query", "ai.llm.openai", "http", "app.services.vector_store",
                  "app.services.ingestion", "app.services.embeddings"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    from app.config import get_settings

    settings = get_settings()
    dataset_path = args.dataset or (REPO_ROOT / settings.eval_dataset_path)
    results_dir = args.results_dir or (REPO_ROOT / settings.eval_results_dir)

    dataset = load_dataset(dataset_path)

    runner = EvalRunner(mode=args.mode, tags=args.tags, case_ids=args.case)
    try:
        report = runner.run(dataset)
    finally:
        if not args.keep_collection:
            runner.teardown()

    print_report(report)
    path = write_report(report, results_dir, baseline=args.baseline)
    print(f"  report -> {path}")
    print(f"  latest -> {results_dir / 'latest.json'}")
    print()

    if args.compare:
        return 0 if compare_to_baseline(report, results_dir, args.tolerance) else 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
