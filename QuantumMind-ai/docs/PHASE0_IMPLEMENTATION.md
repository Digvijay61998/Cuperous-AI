# Phase 0 — Implementation record

**Status:** complete · **Date:** 2026-07-30 · **Baseline run:** `8aa7f7b9`

This is the detailed record of what Phase 0 built, why each choice was made, what
broke along the way, and what the first measurement actually said. It exists so
that the work is auditable and so that a future session (human or AI) can pick up
with full context.

- Roadmap and task tracker: `PLAN.md`
- Research behind the decisions: `docs/RESEARCH.md`
- Session primer: `CLAUDE.md`

---

## 1. Why Phase 0 came first

The service was a working naive RAG pipeline: embed the question, cosine top-5
out of Milvus, keep hits above a threshold, stuff them into a system prompt,
generate. The improvement backlog (`PLAN.md` §3) had 22 findings, several of them
serious.

The problem was not a shortage of ideas. It was that **none of them could be
verified.** Adding a reranker, hybrid search, or query rewriting to an
unmeasured pipeline produces a change of unknown sign. So Phase 0 built the
instrument before touching the mechanism:

1. An evaluation harness with a golden dataset and metrics that separate
   retrieval failure from generation failure.
2. Per-stage tracing so latency, tokens, and cost are attributable.
3. A CI gate so regressions fail the build instead of shipping.
4. Two small correctness fixes that were cheap to do while in the area.

---

## 2. What was built

### 2.1 Tracing — `app/tracing.py` (new)

One span per pipeline stage, each carrying latency, token counts, model, and an
estimated cost. Spans hang off a `ContextVar`-scoped `Trace` keyed by the
**existing** `x-request-id`, so traces and logs correlate without inventing a
second identifier.

```python
with span("retrieval", top_k=5) as s:
    hits = store.search(...)
    s.set(hit_count=len(hits))

with span("generation") as s:
    result = provider.generate(messages)
    s.record_tokens(prompt=120, completion=45, model="gpt-4o-mini")
```

Four design constraints drove the implementation:

| Constraint | How |
|---|---|
| No new dependencies | Pure stdlib. `ContextVar` + `dataclass` + `contextmanager`. No OpenTelemetry, no collector, no exporter to operate. |
| Never break a request | `finish_trace()` catches its own serialisation and logging errors. A metrics bug must not turn a working answer into a 500. |
| Usable without a trace | `span()` works with no active trace — the span is simply discarded. Services can be instrumented unconditionally and still run from unit tests and scripts. |
| Assertable in tests | `finish_trace()` *returns* the serialised trace, so tests read a dict instead of parsing log lines. |

**Cost estimation.** A small table of USD-per-million-token prices, matched by
**longest prefix**, so `gpt-4o-mini-2024-07-18` resolves to the `gpt-4o-mini`
entry without enumerating every dated snapshot. Unknown models cost `0.0` rather
than raising. The table is deliberately approximate: the goal is spotting a 3×
jump in cost per query (which means a context regression), and that signal
survives imprecise unit prices.

Instrumented stages in `app/services/query.py`: `retrieval`, `confidence_gate`,
`prompt_build`, `generation`. `app/middleware.py` starts the trace, finishes it,
and appends a compact `stages=retrieval=41ms generation=1180ms` summary to the
request log line.

### 2.2 Token accounting — `app/llm/*`

`LLMResult` gained `prompt_tokens`, `completion_tokens`, and `finish_reason`, all
defaulting to `0`/`None` so existing fakes in the test suite keep working
unchanged. Both providers now populate them.

`finish_reason` earns its place: when it comes back as `"length"` the answer was
**truncated mid-sentence** by `llm_max_tokens`. That used to be invisible — the
service returned a confident, incomplete answer. It now logs a warning.

### 2.3 Truncation guard — `app/services/embeddings.py`

`all-MiniLM-L6-v2` silently discards anything past ~256 tokens. No error, no
warning, just a vector computed from a prefix. `ingest_website_pages` prepends
the page title, so a long title plus long content overflows and the tail is
quietly lost.

The service now tokenizes and warns when a chunk exceeds `max_seq_length`. This
was `PLAN.md` task 5.3, pulled forward into Phase 0 because the harness needed it
to explain scores — "why is recall low on this document?" has a very different
answer if half the document never made it into a vector.

The truncation itself still happens. Fixing that means a different embedding
model, which is Phase 5.

### 2.4 Golden dataset — `eval/golden/dataset.yaml` (new)

5 documents (support hours, shipping, returns, product catalog, troubleshooting)
and **23 cases**, each tagged so results can be sliced:

| Tag | n | What it probes |
|---|---|---|
| `baseline` | 6 | Should already work. A regression here means something is broken. |
| `single_turn` | 11 | No chat history. |
| `paraphrase` | 3 | Wording deliberately far from the source text. |
| `multi_hop` | 2 | Answer requires combining two documents. |
| `multi_turn` / `p1_target` | 4 | Pronoun-only follow-ups. Probes finding L1. |
| `exact_match` / `p3_target` | 4 | SKUs, error codes, part numbers. Probes finding L2. |
| `out_of_scope` | 4 | Must return `confident: false`. Probes the gate. |
| `terse`, `typos` | 2 | `"hours?"` and `"i wanna send somethin back how do i do that"`. |

Each case declares `expected_sources` (for recall) and `expected_facts` (for
substring coverage) rather than only a reference answer, so a failure says
*where* it failed. A case with recall 1.0 and fact coverage 0.0 retrieved
correctly and reasoned badly — a completely different bug from recall 0.0.

The file has a standing instruction not to delete failing cases to improve the
numbers. Cases that fail today are the evidence a phase worked.

### 2.5 Metrics — `eval/metrics.py` (new)

Nine metrics grouped by the layer they diagnose. That grouping is the point:
when an answer is wrong, you need to know whether retrieval fetched the wrong
chunks or the generator hallucinated despite good context.

**Retriever**
- `context_recall` — share of expected sources actually retrieved. The most
  important number we have: if the source containing the answer was never
  retrieved, nothing downstream can save the answer.
- `context_precision` — share of retrieved chunks from an expected source. Low
  precision means burning context budget on distractions. This is what a
  reranker should move.
- `context_precision_at_k` — rank-aware variant, available but not headline.

**Generator**
- `faithfulness` — is every claim supported by the context?
- `answer_relevancy` — does the answer engage with the question?
- `answer_correctness` — token F1 against the reference answer. F1 rather than
  overlap so a rambling answer is penalised for padding.
- `fact_coverage` — required substrings present. Substring, not token, because
  for `$50` / `14.99` / `returns@acme.test` exact presence is the thing.

**Gate**
- `confidence_accuracy` — did we answer when we should and decline when we should?
- `false_negative_rate` — declined a question we could have answered.
- `false_positive_rate` — answered something out of scope. The dangerous one.

Two scoring modes. **Deterministic** (default) uses lexical proxies: free, no API
key, fully reproducible, which is what a CI gate needs. **Judge** adds
LLM-as-judge scoring for faithfulness and relevancy, which are genuinely hard to
approximate lexically. A judge outage degrades the metric to the lexical value
rather than failing the run.

Aggregation detail that matters: generation metrics average **only over cases
that produced an answer**. Including correctly-declined out-of-scope cases would
blend "correctly refused" into "answered badly". Similarly, per-tag retrieval
metrics report `None` (rendered as `-`) rather than `0.0` when a tag contains no
cases that should retrieve anything, so the `out_of_scope` row does not read as
0% recall when the correct reading is "not applicable".

### 2.6 Runner — `eval/runner.py` (new)

```bash
python -m eval.runner                    # deterministic, reproducible
python -m eval.runner --mode judge       # + LLM-as-judge
python -m eval.runner --tags multi_turn  # slice by tag
python -m eval.runner --case MT-01       # single case
python -m eval.runner --baseline         # write results/baseline.json
python -m eval.runner --compare          # diff vs baseline, exit 1 on regression
```

Two properties worth calling out.

**It drives the real `QueryService`.** Not a simplified reimplementation — the
same code path the HTTP route uses. A parallel eval pipeline would measure the
harness rather than the product.

**Isolation is by namespacing, not mocking.** Each run generates its own
collection (`eval_<8 hex>`) and client id, and drops the collection in teardown.
Two concurrent runs cannot see each other, and neither can touch production data.
The collection name is assigned into the environment *before* `app.config` is
imported anywhere, because `Settings` is an `lru_cache`d singleton that reads the
environment exactly once. That assignment is load-bearing — see §4b for what
happened when it was a `setdefault`.

One wrinkle: `QueryResponse.sources` carries chunk text and an optional URL but
not the logical `source` name, and manual ingests leave `source_url` empty. So
the harness needs a way to map retrieved text back to a source name. Rather than
change the public response shape for the harness's benefit, `vector_store.py`
gained `sources_for_texts()` and the harness looks the chunks up.

Output: a per-run JSON file, `latest.json`, a one-line-per-run `history.jsonl`
for trends, and optionally `baseline.json`.

### 2.7 CI gate — `.github/workflows/eval.yml` (new)

Stands up Milvus, builds the service image, runs the suite, then runs the harness
in `--compare` mode. A regression beyond tolerance exits non-zero and fails the
build. Tolerance exists because LLM output is non-deterministic; without it CI
would flap on noise.

### 2.8 Makefile (new)

`make help` lists everything. Eval and test targets run inside the service image,
which already has every dependency plus the embedding model baked in — that
avoids a multi-minute local install and guarantees CI and local runs use
identical versions.

The `MILVUS_HOST` value in `DRUN` is the **container** name
(`milvus-standalone`), not the compose service alias (`milvus`). Plain
`docker run` resolves container names but not compose aliases. This cost real
debugging time and is now encoded once, in the Makefile.

### 2.9 Tests

`tests/test_tracing.py` and `tests/test_eval_metrics.py`, 44 tests, covering the
cost table's longest-prefix matching, span nesting and error capture, trace
isolation across contexts, every metric's boundary conditions, and the
aggregation rules above.

Full suite after Phase 0: **63 passed, 0 failed** against live Milvus.

### 2.10 Config and docs

`app/config.py` gained `ai_tracing`, `embedding_max_tokens`, `eval_judge_model`,
`eval_dataset_path`, `eval_results_dir` — and **lost `embedding_dim`**
(finding L11). That setting was dead: the real dimension is read from the loaded
model at runtime, so a stale value could only ever disagree with reality. It was
also still present in `.env.example`, which is now fixed with a comment
explaining the deliberate absence.

The `0.15` vs `0.30` threshold mismatch (finding L6) is resolved — README and the
`tests/test_query.py` docstring now match the code.

---

## 3. The blocker: Milvus crash loop

Before any of this could run, **Milvus was crash-looping** — a pre-existing
problem, not caused by the Phase 0 changes, but a total blocker for a harness
that needs a working vector store.

### Symptom

Milvus panicked on flush, restarted, panicked again. The underlying error was an
`invalid argument` failure from MinIO on writing `xl.meta`, its erasure-coding
metadata file.

### Investigation

`invalid argument` on a plain file write is unusual — it is what you get from an
`O_DIRECT` open against a filesystem that does not support it. MinIO uses
`O_DIRECT` for metadata writes.

Rather than guess, the hypothesis was tested directly: run a **fresh, empty**
MinIO container writing to a bind mount under `/tmp`, then run the identical
container writing to a bind mount under the project directory.

- Under `/tmp` — works.
- Under the project directory — fails with `invalid argument`.

Same image, same command, same empty data directory. The only variable was the
host path, which meant the problem was the file-sharing layer between the host
and the Docker VM, not MinIO, not Milvus, and not any data corruption.

### Fix

`docker-compose.yml` moved etcd, MinIO, and Milvus from `./volumes/*` host bind
mounts to **Docker-managed named volumes** (`etcd_data`, `minio_data`,
`milvus_data`). Named volumes live inside the Docker VM, where `O_DIRECT` works.

Milvus now reports healthy in roughly 20 seconds.

### Consequences

- The old `./volumes/` directory was **moved**, not deleted, to
  `volumes.broken.20260730-105654/`. The data in it was already unrecoverable —
  Milvus had never successfully flushed — but destroying data on a hunch is not a
  habit worth having. That directory is safe to delete.
- Vector data is no longer browsable from the host. Acceptable: it was opaque
  binary segment files.
- All three services must be reset **together**. Milvus's local state has to stay
  consistent with etcd's metadata and MinIO's objects; resetting one alone
  produces a different flavour of the same crash loop.
- `docker compose down -v` (or `make down-hard`) is now what wipes the data.

Recorded as finding **L24**, decision **D6**, and a `CLAUDE.md` hard rule, because
the compose file looks "wrong" to anyone who prefers bind mounts and the failure
mode is not obvious from the symptom.

---

## 4. The bug the tests caught

Worth recording because it is exactly the class of bug an eval harness is
supposed to prevent, and it was found *in the harness itself*.

The tokenizer in `eval/metrics.py` needs to preserve punctuation **inside**
tokens: `QM-4471-B`, `ERR_TIMEOUT_502`, `3.2`, and `returns@acme.test` must
survive as single tokens, because splitting them destroys precisely the signal
the exact-match cases exist to measure.

The first implementation allowed that punctuation at token **edges** too. So a
sentence-final `friday.` tokenized to `friday.`, which is not equal to `friday`.
Every answer ending a sentence on a content word lost that word from the overlap
calculation — silently depressing **every** faithfulness and correctness score by
an amount that varied with sentence structure.

Nothing would have surfaced this. The numbers were plausible. A slightly-wrong
metric that never errors is worse than a broken one, because you trust it.

Fix: strip the punctuation set at token edges only, keeping it internal. Each of
the four token forms above is covered by an explicit test.

---

## 4b. The bug the final review caught

Found while re-running `make eval-compare` to verify the gate. The run log ended
with:

```
[EVAL] dropped collection quantummind_knowledge
```

That is the **production** collection, not `eval_<hex>`. The harness had been
ingesting the golden corpus into production and dropping it in teardown, on every
run.

**Root cause.** `runner.py` set the collection name with:

```python
os.environ.setdefault("MILVUS_COLLECTION", f"eval_{_RUN_ID}")
```

`setdefault` is a no-op when the variable is already set — and it always is.
`.env` defines `MILVUS_COLLECTION=quantummind_knowledge`, and the Makefile passes
`--env-file .env` to every eval container. So the isolation the module docstring
described never actually engaged.

It went unnoticed because every symptom looked like success. The run passed. The
metrics were correct — the golden corpus was really ingested and really queried,
just in the wrong collection. Teardown "worked". The only visible trace was one
collection name in a log line nobody had reason to read closely. A developer with
real ingested data would have lost it silently.

**Two-part fix:**

1. Force the assignment rather than defaulting it.
   ```python
   os.environ["MILVUS_COLLECTION"] = _EVAL_COLLECTION
   ```
2. Make teardown verify its target. It now refuses to drop any collection whose
   name is not this run's own, and logs an error instead:
   ```
   [EVAL] REFUSING to drop 'quantummind_knowledge' — expected this run's
   collection 'eval_89d34b53'. Something overrode MILVUS_COLLECTION.
   ```

Teardown is the harness's only destructive operation, so it should verify rather
than trust configuration. A mis-resolved setting must cost a leaked eval
collection, never production data. Recorded as finding **L25** and decision
**D11**.

Verified after the fix:

```
run id          : 89d34b53
collection      : eval_89d34b53
client id       : eval_89d34b53
[EVAL] dropped collection eval_89d34b53
```

Worth stating plainly: **the harness's own isolation guarantee was broken, and
only reading the output carefully caught it.** Two lessons carried forward — a
destructive operation should validate its target independently of config, and
`setdefault` on an environment variable is a silent no-op in exactly the
situation where you most need the override to apply.

---

## 5. Baseline measurement

Run `1ff70e1e`, 2026-07-30, deterministic mode, 23 cases, 45 s wall, 5 743
tokens, **$0.00086**. Committed at `eval/results/baseline.json`. Captured after
the L25 isolation fix, so it comes from a properly namespaced collection.

| Metric | Layer | Score |
|---|---|---|
| Context Recall | retriever | 0.895 |
| Context Precision | retriever | 0.588 |
| Faithfulness | generator | 0.815 |
| Answer Relevancy | generator | 0.448 |
| Answer Correctness | generator | 0.653 |
| Fact Coverage | generator | 0.941 |
| Confidence Accuracy | gate | 0.913 |
| False Negative Rate | gate | 0.105 |
| False Positive Rate | gate | 0.000 |
| latency p50 | ops | 1910 ms |
| latency p95 | ops | 2636 ms |

**Variance across three runs.** Faithfulness 0.828 / 0.809 / 0.815 and
correctness 0.634 / 0.629 / 0.653; recall, precision, and all three gate metrics
were byte-identical every time. The metric functions are deterministic — the
LLM's phrasing is not, and lexical generator metrics inherit that variance. Hence
the 0.02 default tolerance on `--compare`, and hence the rule to judge retrieval
work on recall and precision rather than on generator scores.

By tag:

| Tag | n | Recall | Precision | Confidence |
|---|---|---|---|---|
| baseline | 6 | 1.000 | 0.639 | 1.000 |
| single_turn | 11 | 1.000 | 0.667 | 1.000 |
| paraphrase | 3 | 1.000 | 0.611 | 1.000 |
| multi_hop | 2 | 1.000 | 0.833 | 1.000 |
| exact_match | 4 | 1.000 | 0.750 | 1.000 |
| **multi_turn** | 4 | **0.500** | **0.208** | **0.500** |
| out_of_scope | 4 | — | — | 1.000 |

### 5.1 Confirmed: the multi-turn defect is real

Finding **L1** — chat history reaches the LLM but never reaches retrieval — is
now measured rather than asserted. The `multi_turn` slice is the only failing
category.

Case by case:

| Case | Follow-up | Result |
|---|---|---|
| MT-01 | "What about weekends?" | Retrieves **nothing**, declines. Both false negatives in the whole run are here. |
| MT-04 | "How do I start one?" | Retrieves **nothing**, declines. |
| MT-02 | "And how long does that take?" | Passes **by accident** — "how long" still overlaps the shipping chunk's vocabulary. |
| MT-03 | "Is it cheaper than that?" | Retrieves the right source, then answers **wrong**: repeats the Pro's price instead of naming the Lite. Recall 1.0, fact coverage 0.0. |

MT-02 and MT-03 are instructive. A cruder harness that only checked "did it
answer?" would have scored this slice 3/4 and understated the problem. MT-02 is a
lucky vocabulary collision, not working behaviour, and MT-03 is a retrieval hit
with a reasoning miss. Phase 1's target is all three slice metrics at 1.000
(precision ≥ 0.500), and overall `false_negative_rate` to 0.000.

### 5.2 Contradicted: exact-match cases pass

**The prediction was wrong, and the measurement says so.** The `exact_match`
cases — `QM-4471-B`, `ERR_TIMEOUT_502`, `QM-ADAPT-1`, `ERR_AUTH_401` — were
tagged as expected failures on the reasoning that dense-only retrieval cannot
match literal identifiers. They scored recall **1.000**, precision 0.750,
confidence 1.000. The best slice in the run, in fact.

The cause is corpus size, not retriever strength. Five documents produce five
chunks, and `retrieval_top_k` is 5, so a query retrieves essentially the entire
corpus. There is nothing to be confused *by*. MiniLM's subword pieces for
`QM-4471-B` are more than enough to rank the right chunk first out of five
candidates. The published failure mode assumes a realistic corpus where many
chunks compete for the same tokens — `QM-4471-B` against `QM-4471-C` against
`QM-4417-B`.

Two things follow, and both are now recorded rather than quietly dropped:

1. **This is not evidence that hybrid search is unnecessary.** It is evidence
   that the current golden set cannot test hybrid search. Logged as finding
   **L23**; Phase 3 task 3.7 was rewritten to grow the corpus *first*.
2. **The tag was renamed** from `expected_fail_until_p3` to `p3_target`. A
   dataset file that asserts something its own results disprove is worse than
   no annotation.

The same corpus-size caveat explains the headline context precision of 0.588: with
`top_k` equal to the entire corpus, most retrieved chunks are irrelevant by
construction. That metric only becomes meaningful once the corpus grows.

### 5.3 What else the baseline says

**The gate is tuned conservative.** False positive 0.000 with false negative
0.105 means the `0.15` threshold never answers an out-of-scope question — good,
that is the dangerous direction — but declines two questions it could have
answered. Both are MT-01 and MT-04, so Phase 1 should fix them without touching
the threshold. Retuning belongs on the rerank score in Phase 2 (task 2.4), where
the score is far better calibrated than raw cosine.

**Answer relevancy 0.478 is the weakest number and the least trustworthy.** In
deterministic mode it is a lexical proxy that rewards reusing the question's
words. Several answers scored 0.0 while being entirely correct — SH-02 and SP-02
both answer well and share almost no vocabulary with the question. Use it as a
trend line, and confirm any headline claim with `make eval-judge`.

**Cost is a non-issue at this scale.** $0.00087 for a full 23-case run. Worth
revisiting if the corpus grows 10×, but nothing to manage today.

---

## 6. Files touched

**New**

| Path | Purpose |
|---|---|
| `app/tracing.py` | Span/trace system, cost estimation |
| `eval/__init__.py` | Package marker |
| `eval/golden/dataset.yaml` | 23 cases, 5 documents |
| `eval/metrics.py` | 9 metrics, deterministic + judge modes |
| `eval/runner.py` | Harness CLI (incl. the L25 isolation fix and teardown guard) |
| `eval/README.md` | How to run and interpret it |
| `.github/workflows/eval.yml` | CI regression gate |
| `Makefile` | All common commands |
| `tests/test_tracing.py` | Tracing tests |
| `tests/test_eval_metrics.py` | Metrics tests |
| `docs/PHASE0_IMPLEMENTATION.md` | This file |

**Changed**

| Path | Change |
|---|---|
| `app/config.py` | +5 settings; **removed dead `embedding_dim`** (L11) |
| `app/llm/base.py` | `LLMResult` + prompt/completion tokens, `finish_reason` |
| `app/llm/openai_provider.py` | Populate the new fields |
| `app/llm/anthropic_provider.py` | Populate the new fields |
| `app/services/query.py` | 4 spans; warn on truncated generation |
| `app/services/embeddings.py` | Truncation guard (L5) |
| `app/services/vector_store.py` | `sources_for_texts()` for the harness |
| `app/middleware.py` | Start/finish traces; `stages=` log summary |
| `docker-compose.yml` | **Named volumes instead of bind mounts** (L24 / D6) |
| `requirements-dev.txt` | `pyyaml==6.0.2` |
| `.env.example` | New settings; `EMBEDDING_DIM` removed |
| `README.md` | Threshold fix (L6); eval, tracing, storage, and command sections |
| `PLAN.md` | Phase 0 closed; L23/L24; baseline metrics; D6–D10; new risks |
| `CLAUDE.md` | Eval in the repo map; 3 new hard rules; corrected commands |
| `tests/test_query.py` | Threshold docstring fix (L6) |

---

## 7. What Phase 0 deliberately did not do

- **No RAGAS dependency** (decision D8). Its metric definitions are the
  reference we implemented against, but the package drags a large
  LangChain-adjacent tree into a small pinned service, and it requires an LLM for
  every metric — which breaks the free/no-key property. Our metrics are ~200
  lines. Revisit if we need the full catalogue.
- **No OpenTelemetry** (D9). Zero dependencies and no collector beats a
  standards-compliant pipeline nobody is consuming yet. If distributed traces
  across the NestJS backend become a requirement, OTel goes behind the same
  `span()` API.
- **No pipeline changes.** Deliberately. Phase 0's entire job was to make the
  next change measurable. Query rewriting is Phase 1.
- **No corpus growth.** The 5-document set was enough to establish a baseline and
  expose L1. Growing it properly is a Phase 3 prerequisite (task 3.7), and doing
  it now would have delayed the gate for no immediate gain.

---

## 8. Reproducing this

```bash
make up-storage      # etcd + MinIO + Milvus, waits for health
make test            # 63 tests
make eval            # score the golden set
make eval-compare    # diff against baseline.json, exit 1 on regression
```

`make eval` makes live LLM calls (`gpt-4o-mini`, ~$0.001/run) because it drives
the real pipeline end to end. `make eval-judge` costs more.

---

## 9. Handoff — Phase 1

Read `PLAN.md` §5 Phase 1. The work is `_rewrite_query(question, chat_history)`:
one cheap LLM call producing a standalone question, fed to `store.search()` while
the **original** question stays in the LLM message list. Skip it entirely when
history is empty. Fail open to the raw question if the rewrite errors.

Success is defined numerically, against this baseline:

| Metric (multi_turn slice, n=4) | Baseline | Target |
|---|---|---|
| context recall | 0.500 | 1.000 |
| context precision | 0.208 | ≥ 0.500 |
| confidence accuracy | 0.500 | 1.000 |
| overall false negative rate | 0.105 | 0.000 |

And `make eval-compare` must show no regression on any other slice. That
sentence is the reason Phase 0 existed.
