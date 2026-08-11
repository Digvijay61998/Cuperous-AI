# Evaluation Harness

Phase 0 of [`PLAN.md`](../PLAN.md). **This exists so no pipeline change ships on
a hunch.**

---

## Quick start

Milvus must be running. No API key is needed in the default mode.

```bash
# from the repo root
docker compose up -d etcd minio milvus

pip install pyyaml                       # only extra dependency

python -m eval.runner                    # run everything, deterministic
python -m eval.runner --baseline         # ...and save as the baseline
python -m eval.runner --compare          # ...and fail on regression
```

Easier: use the Makefile from the repo root. It runs inside the service image,
which already has every dependency plus the embedding model baked in.

```bash
make eval            # deterministic
make eval-baseline   # ...and save the baseline
make eval-compare    # ...and fail on regression
make eval-judge      # LLM-as-judge scoring
```

The raw form, if you need to vary something:

```bash
# MILVUS_HOST is the CONTAINER name — plain `docker run` does not resolve
# compose service aliases, only container names.
docker run --rm --network quantummind-ai --env-file .env \
  -e MILVUS_HOST=milvus-standalone -e MILVUS_PORT=19530 \
  -v "$PWD":/app -w /app quantummind-ai-ai-service:latest \
  bash -c "pip install --quiet pyyaml && python -m eval.runner --baseline"
```

---

## What gets measured

Split by the layer it diagnoses — that split is the point. When an answer is
wrong you need to know *which stage* broke.

### Retriever

| Metric | Meaning | Moved by |
|---|---|---|
| **Context Recall** | Did we retrieve the sources containing the answer? | P1 rewriting, P3 hybrid, P5 embeddings |
| **Context Precision** | Were the retrieved chunks actually relevant? | P2 reranking |

Recall is the one that matters most. If the answer's source never got retrieved,
nothing downstream can recover.

### Generator

| Metric | Meaning | Moved by |
|---|---|---|
| **Faithfulness** | Are the answer's claims supported by the context? | prompt, P7 groundedness check |
| **Answer Relevancy** | Does the answer address the question? | prompt |
| **Answer Correctness** | Does it match the reference answer? | everything |
| **Fact Coverage** | Are the required specifics present? | retrieval + prompt |

### Confidence gate

| Metric | Meaning |
|---|---|
| **Confidence Accuracy** | Did we answer when we should, decline when we should? |
| **False Negative Rate** | Declined when we had the answer — *the expensive failure* |
| **False Positive Rate** | Answered when we should have declined — hallucination risk |

For a support bot, false negatives are the costly ones: a needless escalation to
a human on a question the KB could answer.

---

## Two modes

### `deterministic` — the default

No LLM judge. No API key. No cost. Fully reproducible run to run.

Uses source-overlap for retrieval metrics and lexical overlap for generation
metrics. **Good enough to detect regressions**, which is exactly what CI needs.

Use it for: CI, every local iteration, comparing two commits.

### `judge` — when you need rigour

```bash
python -m eval.runner --mode judge
```

Adds LLM-as-judge scoring for faithfulness (decomposes the answer into claims
and checks each against the context) and answer relevancy (0–10 rubric). Needs
an API key and costs money. Judged and lexical scores are **not comparable** —
never diff a judge run against a deterministic baseline.

Use it for: milestone reviews, before/after a phase lands, investigating a
suspicious lexical score.

The judge model is configured separately via `EVAL_JUDGE_MODEL` so you can judge
with a different model than the one under test.

---

## The golden dataset

[`golden/dataset.yaml`](golden/dataset.yaml) — **23 cases** across 5 documents.

Deliberately includes cases we expect to fail today. That is how a phase proves
itself.

Measured at the baseline run `8aa7f7b9` (2026-07-30):

| Tag | Cases | Recall | Confidence | Reading |
|---|---|---|---|---|
| `baseline` | 6 | 1.000 | 1.000 | Should pass. A regression here means something broke. |
| `single_turn` | 11 | 1.000 | 1.000 | Working. |
| `multi_hop` | 2 | 1.000 | 1.000 | Retrieval fine; correctness is the weak spot. |
| `exact_match` / `p3_target` | 4 | 1.000 | 1.000 | **Passes today** — see the caveat below. |
| `multi_turn` / `p1_target` | 4 | **0.500** | **0.500** | Finding L1, measured. **Phase 1** target. |
| `out_of_scope` | 4 | — | 1.000 | Correctly declines all four. |

**Do not delete failing cases to improve the numbers.** `MT-01` returning
`context_recall = 0.0` is not a bug in the dataset — it is finding L1, measured.

### ⚠️ Corpus size caveat (finding L23)

Five documents produce five chunks, and `RETRIEVAL_TOP_K` is 5. A query
therefore retrieves nearly the whole corpus. Two consequences:

- **Context recall is trivially 1.000** for almost every in-scope case. It has
  little headroom to show improvement.
- **Context precision is artificially low** (0.588 overall) because most
  retrieved chunks are irrelevant by construction, not by retriever error.

This is also why the `exact_match` cases pass despite being written to probe
dense retrieval's weakness on literal identifiers: with five candidates there is
nothing to be confused by. The tag was renamed from `expected_fail_until_p3` to
`p3_target` once the data disproved the prediction.

**Grow the corpus before trusting Phase 2 or Phase 3 deltas** — that is task 3.7
in `PLAN.md`. Until then the harness is a solid regression detector and a weak
improvement detector.

### Adding cases

```yaml
- id: SH-03                      # stable; never renumber
  question: Are you open on July 4th?
  chat_history: []               # optional prior turns
  expect_confident: true
  ground_truth: >
    Support is closed on US federal holidays, including July 4th.
  expected_sources: [support-hours]
  expected_facts: ["holiday"]
  tags: [single_turn, paraphrase]
```

Refresh from real traffic quarterly — a golden set that drifts from reality
measures the wrong thing.

---

## Filtering

```bash
python -m eval.runner --tags multi_turn              # one category
python -m eval.runner --tags p1_target               # what Phase 1 must fix
python -m eval.runner --tags baseline exact_match    # several
python -m eval.runner --case MT-01 MT-02             # specific cases
python -m eval.runner --case MT-01 -v --keep-collection   # debug one case
```

`--keep-collection` skips teardown so you can inspect the collection afterwards.

---

## Output

```
eval/results/
  run_20260101T1200_a1b2c3d4.json    every run, timestamped
  latest.json                        most recent
  baseline.json                      the comparison point (--baseline)
  history.jsonl                      one line per run, for trend charts
```

Console output gives headline metrics, a per-tag breakdown, and an explicit list
of cases below target with the reason.

---

## Regression gating

```bash
python -m eval.runner --compare                    # default tolerance 0.02
python -m eval.runner --compare --tolerance 0.05   # looser
```

Exits `1` on any regression beyond tolerance. Handles direction correctly — a
*rise* in false-negative rate counts as a regression.

Tolerance exists because LLM output is non-deterministic and CI would otherwise
flap on noise.

---

## Workflow per phase

```bash
# 1. establish the baseline before touching anything
python -m eval.runner --baseline

# 2. implement the phase

# 3. did it help?
python -m eval.runner --compare

# 4. record the numbers in PLAN.md §7, then re-baseline
python -m eval.runner --baseline
```

---

## Isolation

Every run creates its own Milvus collection (`eval_<8 hex>`) and drops it in
teardown. The client id is namespaced per run too. A run cannot touch production
data or a concurrent run.

---

## Design notes

**Why not RAGAS?** Its metric *definitions* are the reference these
implementations follow, but the package drags LangChain and a large dependency
tree into a service whose design point is a small footprint. If we later want
RAGAS's exact judge prompts, add it as a dev-only extra behind `judge` mode.

**Why does the harness call `QueryService` directly?** Same code path as the HTTP
route. A simplified evaluation pipeline would measure the harness, not the
product.

**Why is `deterministic` the default?** CI needs a signal that is free, fast, and
stable. Lexical proxies are imperfect in absolute terms but reliable at detecting
*change*, and change is what gates a merge.

**Read lexical scores as trend lines, not absolutes.** Answer relevancy is the
clearest example: at baseline it reads 0.478, and several answers score 0.0 while
being entirely correct — they simply reuse few of the question's words. That is a
property of the proxy, not of the answer. Use `--mode judge` when the absolute
value matters.

**Costs.** A full deterministic run makes real LLM calls (it drives the real
pipeline) — about $0.001 on `gpt-4o-mini` for 23 cases. Judge mode roughly
triples it.

---

## Full write-up

`docs/PHASE0_IMPLEMENTATION.md` records what was built, the Milvus/MinIO
`O_DIRECT` investigation that unblocked it, a tokenizer bug the tests caught, and
a case-by-case reading of the baseline.
