# JarCube AI — Improvement Plan

> **Living document.** Update the status tables as work lands. This file is the
> single source of truth for what we are building and why.
>
> Companion files:
> - `CLAUDE.md` — context primer for AI coding assistants (read that first in a new session)
> - `docs/RESEARCH.md` — research papers, benchmarks, and reference implementations behind every decision

---

## 1. Goal

Turn the current **naive RAG** service into a **robust, scalable, measurable**
retrieval system for a multi-tenant customer-support chatbot.

Three non-negotiable constraints we are keeping:

| Constraint | Why it matters |
|---|---|
| Ingestion must stay free (no API key required) | Local CPU embeddings are a real cost feature, not an accident |
| Tenant isolation must never regress | Partition key + explicit expression filter, both stay |
| Confidence gating before the LLM call | Saves money, prevents a whole class of hallucination |

Everything below is additive to those.

---

## 2. Where we are today

```
question ──► embed (MiniLM 384d) ──► Milvus COSINE top-5 (client_id filter)
         ──► keep score ≥ 0.15 ──► concat into system prompt ──► LLM ──► answer
```

This is the 2023 baseline. It works. It is also the pattern that industry
analysis in 2026 identifies as failing at the **retrieval** stage, not the
generation stage. Every phase below targets retrieval.

### What the current design already gets right — do not regress these

- Confidence gate runs **before** the LLM call (cost + hallucination control)
- LLM provider resolved lazily, so the fallback path works with no API key
- `LLMProvider` ABC + factory → swapping OpenAI ↔ Moonshot ↔ Anthropic is config-only
- Anthropic system prompt correctly hoisted to a top-level arg
- Multi-tenant defense in depth: partition key **and** `client_id ==` expression, with `_escape()` against expression injection
- Idempotent ingestion: delete-by-source before insert, so no stale duplicates
- Request-ID correlation + secret masking in the logging layer

---

## 3. Findings — full inventory

Severity: 🔴 breaking answer quality · 🟠 limits the ceiling · 🟡 quality of life · 🔵 ops/security

Resolved findings keep their row with a ✅ marker rather than being deleted — the
history of what was wrong is useful context, and renumbering would break every
reference to an ID.

| ID | Sev | Finding | Location | Phase |
|----|-----|---------|----------|-------|
| L1 | 🔴 | Chat history reaches the LLM but **never reaches retrieval**. Follow-ups like "what about weekends?" get embedded literally and retrieve nothing. | `services/query.py` | P1 |
| L2 | 🔴 | Dense-only retrieval. No keyword match → SKUs, error codes, part numbers, rare acronyms fail. | `services/vector_store.py` | P3 |
| L3 | 🔴 | No reranker. Raw bi-encoder cosine top-5 goes straight to the LLM. | `services/query.py` | P2 |
| L4 | 🔴 | Chunks carry no document context. "Free shipping over $50" has no idea which client/product/region. | `services/ingestion.py` | P4 |
| L5 | 🟠 | 🟦 *no longer silent as of P0.* `all-MiniLM-L6-v2` caps at **~256 tokens** and truncates; P0 added a warning, so you now find out. The truncation itself remains until we change models. `ingest_website_pages` prepends the title, so long title + content can still overflow. | `services/embeddings.py`, `services/ingestion.py` | P5 |
| L6 | 🟠 | ✅ *doc half resolved in P0.* `min_similarity_score` is still a magic number, but the docs no longer disagree — README and `test_query.py` said `0.30` against a code value of `0.15`. Retuning the number itself moves to the rerank score in P2.4. | `config.py`, `README.md`, `tests/test_query.py` | ~~P0~~ → P2 |
| L7 | 🟠 | ✅ *resolved in P0.* No evaluation harness existed. Now `eval/` — 23 cases, 9 metrics, CI gate, committed baseline. | `eval/` | P0 |
| L8 | 🟠 | No query rewriting/expansion. Raw user string goes to the embedder — typos, fragments, pronouns and all. | `services/query.py` | P1 |
| L9 | 🟡 | `bot_id` written on every row, never filtered on. Dead column or missing feature. | `services/vector_store.py` | P6 |
| L10 | 🟡 | `delete_by_source` does a full PK scan just to produce a count — and runs on **every** ingest. O(n) per ingest. | `services/vector_store.py` | P6 |
| L11 | 🟡 | ✅ *resolved in P0.* `embedding_dim` config was dead; real dim comes from the loaded model. Removed from `config.py` and `.env.example`. | `config.py` | P0 |
| L12 | 🟡 | No inline citations. System prompt actively forbids referencing sources, so answers are unverifiable. | `services/query.py` | P6 |
| L13 | 🟡 | No caching. Every query re-embeds. Support bots get the same questions constantly. | — | P6 |
| L14 | 🟡 | No streaming. `provider.generate()` blocks for 1–3s with nothing on screen. | `llm/*.py` | P6 |
| L15 | 🟡 | `chunk_overlap=50` produces near-duplicate chunks; nothing dedupes at retrieval, so context slots get wasted. | `services/query.py` | P6 |
| L16 | 🟡 | Fixed-size character chunking is structure-blind. Tables shredded, headings orphaned, lists cut mid-item. | `services/ingestion.py` | P6 |
| L17 | 🟡 | No faithfulness check. `confident: true` only means "cosine ≥ 0.15" — it says nothing about groundedness. | `services/query.py` | P7 |
| L18 | 🔵 | **No auth anywhere. `CORS_ORIGINS=*`.** Any origin can poison a tenant's KB or drain LLM credits. | `main.py`, all routers | P8 |
| L19 | 🔵 | `/healthcheck` returns a static 200 without touching Milvus. Docker reports healthy while the vector store is down. | `routers/health.py` | P8 |
| L20 | 🔵 | Milvus **2.4.15** predates native BM25 full-text search. Upgrading to 2.5+/2.6 gives hybrid search natively instead of bolting on a second index. | `docker-compose.yml`, `requirements.txt` | P3 |
| L21 | 🔵 | ✅ *resolved in P0.* No observability. Now `app/tracing.py` — one span per stage with latency, tokens, and estimated cost, correlated by the existing request id. | `app/tracing.py` | P0 |
| L22 | 🟡 | No conversation memory beyond the last 6 turns passed in by the caller. No summarization, no persistence. | `services/query.py` | P7 |
| L23 | 🟡 | **Golden corpus is too small to discriminate.** 5 documents → 5 chunks, and `top_k=5` retrieves nearly the whole corpus, so context recall is trivially 1.0 for every in-scope single-turn case. Measured at baseline: the `exact_match` cases (SKUs, error codes) **passed**, contradicting the predicted dense-retrieval failure. They cannot validate Phase 3 until the corpus grows to many competing near-duplicate chunks. | `eval/golden/dataset.yaml` | P3 |
| L25 | 🔴 | ✅ *found and fixed during P0 review.* **The eval harness was dropping the production collection.** `runner.py` used `os.environ.setdefault("MILVUS_COLLECTION", ...)`, which is a no-op whenever the variable is already set — and it always is, because `.env` sets it and the Makefile passes `--env-file .env`. So every run ingested the golden corpus into `quantummind_knowledge` and **dropped it in teardown**. Fixed with a forced assignment plus a teardown guard that refuses to drop any collection other than the run's own. | `eval/runner.py` | P0 |
| L24 | 🔵 | **MinIO cannot use a host bind mount under Docker Desktop.** It writes `xl.meta` with `O_DIRECT`; the file-sharing layer rejects that with `invalid argument`, which panics Milvus on every flush and produces an endless crash loop. Fixed in P0 by moving etcd/MinIO/Milvus to Docker-managed named volumes. | `docker-compose.yml` | P0 (done) |

---

## 4. Target architecture

```
                             ┌────────────────────────────────────────────┐
 INGESTION                   │  QUERY                                     │
                             │                                            │
 raw doc (pdf/docx/html/txt) │  question + chat history                   │
      │                      │        │                                   │
      ▼                      │        ▼                                   │
 ┌─────────────────┐         │  ┌─────────────────────────┐               │
 │ structure-aware │         │  │ ① QUERY REWRITE          │  cheap LLM   │
 │ parse + split   │         │  │  resolve pronouns →      │  ~100ms      │
 │ (headings,      │         │  │  standalone query        │              │
 │  tables, lists) │         │  └───────────┬─────────────┘               │
 └────────┬────────┘         │              │                             │
          ▼                  │              ▼                             │
 ┌─────────────────┐         │  ┌─────────────────────────┐               │
 │ ② CONTEXTUAL     │ ◄─ LLM │  │ ③ HYBRID RETRIEVE        │  top-50 each │
 │    ENRICH        │  1–2   │  │                          │              │
 │  prepend doc     │  lines │  │   dense ──┐              │              │
 │  situating ctx   │        │  │           ├── RRF ──►    │              │
 └────────┬────────┘         │  │   BM25 ───┘   fusion     │              │
          ▼                  │  └───────────┬─────────────┘               │
 ┌─────────────────┐         │              │ top-50                       │
 │ embed           │         │              ▼                             │
 │ dense + sparse  │         │  ┌─────────────────────────┐               │
 └────────┬────────┘         │  │ ④ CROSS-ENCODER RERANK   │  +50–400ms   │
          ▼                  │  └───────────┬─────────────┘               │
 ┌─────────────────┐         │              │ top-5, calibrated            │
 │  Milvus 2.6     │◄────────┼──────────────┤                             │
 │  dense idx      │         │              ▼                             │
 │  + sparse BM25  │         │  ┌─────────────────────────┐               │
 │  partition:     │         │  │ ⑤ CONFIDENCE GATE        │              │
 │   client_id     │         │  │  on rerank score         │              │
 └─────────────────┘         │  └───────────┬─────────────┘               │
                             │              │ pass                         │
                             │              ▼                             │
                             │  ┌─────────────────────────┐               │
                             │  │ ⑥ GENERATE (streaming)   │              │
                             │  │  w/ inline citations     │              │
                             │  └───────────┬─────────────┘               │
                             │              ▼                             │
                             │  ┌─────────────────────────┐               │
                             │  │ ⑦ GROUNDEDNESS CHECK     │  optional    │
                             │  └─────────────────────────┘               │
                             └────────────────────────────────────────────┘
                                            │
   ┌────────────────────────────────────────┴──────────────────────────────┐
   │  CROSS-CUTTING                                                        │
   │  • Tracing: every stage — inputs, outputs, latency, tokens, cost      │
   │  • Eval harness: golden set → ctx precision/recall, faithfulness,     │
   │    answer relevancy → runs in CI, blocks regressions                  │
   │  • Caching: embedding cache + semantic answer cache                   │
   └───────────────────────────────────────────────────────────────────────┘
```

---

## 5. Phased roadmap

Ordered by impact ÷ effort. **Do them in order.** Phase 0 was the hard gate and
is now complete — Phase 1 is the current work.

Status legend: `⬜ not started` · `🟦 in progress` · `✅ done` · `⏭️ skipped`

---

### Phase 0 — Instrument first ✅ COMPLETE (2026-07-30)

**Nothing after this is meaningful without it.** We cannot claim an improvement
we cannot measure.

Full write-up: **`docs/PHASE0_IMPLEMENTATION.md`**.

| # | Task | Addresses | Status |
|---|------|-----------|--------|
| 0.1 | Build golden dataset: questions with expected answer + expected sources. Commit as fixtures. | L7 | ✅ 23 cases / 5 docs in `eval/golden/dataset.yaml`. Short of the 50–100 target — see L23. |
| 0.2 | Wire RAGAS (or equivalent). Emit **context precision**, **context recall**, **faithfulness**, **answer relevancy**. | L7 | ✅ `eval/metrics.py` — own implementation, no RAGAS dep (D8). Plus correctness, fact coverage, and 3 gate metrics. |
| 0.3 | Record baseline numbers in §7 of this file. | L7 | ✅ run `1ff70e1e`, `eval/results/baseline.json` |
| 0.4 | Add eval to CI. Fail the build on regression beyond a threshold. | L7 | ✅ `.github/workflows/eval.yml` + `make eval-compare` |
| 0.5 | Add tracing. One span per pipeline stage with latency, tokens, cost. | L21 | ✅ `app/tracing.py`, stdlib only |
| 0.6 | Fix the `0.15` vs `0.30` doc mismatch in README **and** `tests/test_query.py` docstring. | L6 | ✅ |
| 0.7 | Delete the dead `embedding_dim` setting from `config.py` and `.env.example`. | L11 | ✅ |
| 0.8 | *(added)* Fix the Milvus crash loop that blocked every run. | L24 | ✅ Named volumes, see D6 |
| 0.9 | *(added)* Truncation warning when a chunk exceeds the embedder's token limit. Pulled forward from 5.3 because the harness needed it to explain scores. | L5 | ✅ `app/services/embeddings.py` |
| 0.10 | *(added)* Fix the harness dropping the production collection; add a teardown guard and 6 regression tests. Found during final review. | L25 | ✅ `eval/runner.py`, `tests/test_eval_isolation.py` |

**Exit criteria — met.** `make eval` prints all nine metrics for the golden set;
`make eval-compare` exits non-zero on regression beyond tolerance; CI runs it.

---

### Phase 1 — Fix the conversational bug 🔴 highest ROI

One day of work. Fixes the worst live defect.

| # | Task | Addresses | Status |
|---|------|-----------|--------|
| 1.1 | Add `_rewrite_query(question, chat_history)` — one cheap LLM call producing a standalone question. | L1, L8 | ⬜ |
| 1.2 | Feed the rewritten query into `store.search(...)`; keep the **original** question in the LLM message list. | L1 | ⬜ |
| 1.3 | Skip the rewrite entirely when `chat_history` is empty (no cost on first turn). | L1 | ⬜ |
| 1.4 | Fail open: if the rewrite call errors, fall back to the raw question. Never 500 because of a rewrite. | L1 | ⬜ |
| 1.5 | Test: assert `FakeStore.last_query` is the **rewritten** string, not the raw follow-up. | L1 | ⬜ |
| 1.6 | Re-run eval. Record delta. | L7 | ⬜ |

**Design note — start with a single rewrite, not multi-query.** At least one
benchmarked system found multi-query expansion actively *degraded* performance
while domain-specific temperature tuning helped. Measure before adding fan-out.

**Exit criteria:** a two-turn conversation where turn 2 is a pronoun-only
follow-up retrieves the correct chunk.

**Measurable target, from the P0 baseline.** `make eval-multiturn` must move:

| Metric (multi_turn slice, n=4) | Baseline | Target |
|---|---|---|
| context recall | 0.500 | 1.000 |
| context precision | 0.208 | ≥ 0.500 |
| confidence accuracy | 0.500 | 1.000 |

Overall `false_negative_rate` should go 0.105 → 0.000, since MT-01 and MT-04 are
both of the two false negatives at baseline. `make eval-compare` must report no
regression on any other slice.

---

### Phase 2 — Reranking 🔴

| # | Task | Addresses | Status |
|---|------|-----------|--------|
| 2.1 | Add a `Reranker` interface + implementation. Default to a local open cross-encoder to preserve the no-API-key property. | L3 | ⬜ |
| 2.2 | Widen first-pass retrieval: `top_k=5` → `top_k=50` (make it configurable). | L3 | ⬜ |
| 2.3 | Rerank the 50 → take top-5. | L3 | ⬜ |
| 2.4 | **Move the confidence gate onto the rerank score** — far better calibrated than raw cosine. Retune the threshold against the golden set. | L3, L6 | ⬜ |
| 2.5 | Expose rerank score in `SourceChunk` alongside the retrieval score. | L12 | ⬜ |
| 2.6 | Re-run eval. Record delta. | L7 | ⬜ |

Budget **+50–400 ms** per query. For a support bot that is an acceptable trade
for the correctness gain.

**Exit criteria:** context precision measurably up; the eval set shows fewer
irrelevant chunks reaching the prompt.

---

### Phase 3 — Hybrid search 🔴

**Upgrade Milvus first.** 2.5+ ships BM25 full-text search and RRF fusion
natively — far less to maintain than a parallel BM25 index.

| # | Task | Addresses | Status |
|---|------|-----------|--------|
| 3.1 | Bump `milvusdb/milvus:v2.4.15` → `2.6.x` in `docker-compose.yml`. | L20 | ⬜ |
| 3.2 | Bump `pymilvus` to the **matching** minor line. ⚠️ Client and server versions must match. | L20 | ⬜ |
| 3.3 | Add a sparse field + BM25 function to the collection schema. | L2 | ⬜ |
| 3.4 | Swap `search()` → `hybrid_search()` with RRF ranking. | L2 | ⬜ |
| 3.5 | Keep `client_id` partition key **and** the explicit expression filter on both search paths. | L2 | ⬜ |
| 3.6 | Full re-ingest (schema change requires it). Document the migration. | L2 | ⬜ |
| 3.7 | **Grow the golden corpus first** so exact-match cases can actually discriminate — many products with near-identical codes (`QM-4471-B` / `QM-4471-C` / `QM-4417-B`). The existing `p3_target` cases pass at baseline purely because 5 documents cannot confuse a retriever. | L2, L7, **L23** | ⬜ |
| 3.8 | Re-run eval. Record delta. | L7 | ⬜ |

**Exit criteria:** a query for a literal product code returns the right chunk.

---

### Phase 4 — Contextual chunk enrichment 🔴

| # | Task | Addresses | Status |
|---|------|-----------|--------|
| 4.1 | At ingest, per chunk: one cheap LLM call → 1–2 sentences situating the chunk in its document. | L4 | ⬜ |
| 4.2 | Prepend that context before embedding. Store both the enriched text (for embedding) and the original (for display). | L4 | ⬜ |
| 4.3 | Use prompt caching on the parent document to keep cost sane. | L4 | ⬜ |
| 4.4 | Make it opt-in per ingest so the free/no-key path still works. | L4 | ⬜ |
| 4.5 | Also index the enriched text into the BM25 field (contextual BM25). | L2, L4 | ⬜ |
| 4.6 | Re-run eval. Record delta. | L7 | ⬜ |

Costs money at ingest — but ingest is once per document while queries are
forever.

**Exit criteria:** ambiguous chunks ("orders over $50") retrieve correctly when
the query names the client or product.

---

### Phase 5 — Better embeddings 🟠

**Only if eval says retrieval is still the bottleneck after P1–P4.**

| # | Task | Addresses | Status |
|---|------|-----------|--------|
| 5.1 | Benchmark candidate models on the golden set — not on leaderboard scores. | L5 | ⬜ |
| 5.2 | Prefer a model with ≥8K context (kills silent truncation) and native sparse output (simplifies hybrid). | L5 | ⬜ |
| 5.3 | Add a **guard** that logs a warning when a chunk exceeds the model's token limit. Do this regardless of which model wins. | L5 | ✅ done in P0 (task 0.9) |
| 5.4 | Full re-embed + re-ingest. ⚠️ Mixed-model vectors in one collection silently degrade retrieval. | L5 | ⬜ |
| 5.5 | Update the torch wheel URL in the `Dockerfile` if the new model needs a newer torch. | L5 | ⬜ |
| 5.6 | Re-run eval. Record delta. | L7 | ⬜ |

**Exit criteria:** measured improvement on the golden set, or an explicit
decision to stay on the current model.

---

### Phase 6 — Quality of life 🟡

| # | Task | Addresses | Status |
|---|------|-----------|--------|
| 6.1 | Structure-aware chunking: respect headings, keep tables intact, don't cut lists. | L16 | ⬜ |
| 6.2 | Streaming responses via both SDKs' streaming APIs + SSE endpoint. | L14 | ⬜ |
| 6.3 | Inline citations — revise the system prompt to emit `[1]`, `[2]` mapped to `sources`. | L12 | ⬜ |
| 6.4 | Embedding cache (hash → vector) + semantic answer cache. | L13 | ⬜ |
| 6.5 | Dedupe overlapping chunks at retrieval time. | L15 | ⬜ |
| 6.6 | Decide `bot_id`: filter on it or drop the column. | L9 | ⬜ |
| 6.7 | Replace count-then-delete with a direct delete; return `deleted: -1` or omit the count. | L10 | ⬜ |
| 6.8 | Batch embedding for large ingests. | — | ⬜ |

---

### Phase 7 — Advanced 🟠

| # | Task | Addresses | Status |
|---|------|-----------|--------|
| 7.1 | Groundedness / faithfulness check on the generated answer before returning. | L17 | ⬜ |
| 7.2 | Layered conversation memory: recent turns verbatim + rolling summary + retrievable long-term facts. | L22 | ⬜ |
| 7.3 | Session persistence so memory survives process restarts. | L22 | ⬜ |
| 7.4 | Adaptive retrieval — skip retrieval entirely for greetings/chitchat. | — | ⬜ |
| 7.5 | Per-tenant threshold tuning driven by eval data. | L6 | ⬜ |

**Compaction is lossy.** Summarizing older turns destroys specific details and
nuanced instructions. Prefer retrievable durable memory over aggressive
summarization; treat compaction as a last resort.

---

### Phase 8 — Production hardening 🔵

| # | Task | Addresses | Status |
|---|------|-----------|--------|
| 8.1 | **API authentication** on all `/ingest/*` and `/query/*` routes. | L18 | ⬜ |
| 8.2 | Tighten CORS — explicit origin allowlist, drop `*`. | L18 | ⬜ |
| 8.3 | Per-tenant rate limiting. | L18 | ⬜ |
| 8.4 | Real healthcheck: ping Milvus, report degraded. | L19 | ⬜ |
| 8.5 | Upload limits: max file size, max page count, MIME validation. | L18 | ⬜ |
| 8.6 | Async ingest for large documents (queue + job status endpoint). | — | ⬜ |
| 8.7 | Cost tracking per tenant. | — | ⬜ |
| 8.8 | Dependency upgrades from the audit — green batch first. | — | ⬜ |

---

## 6. Expected impact

Directional, from published figures. **Our numbers will differ** — which is
exactly why Phase 0 comes first.

| After | Retrieval failure reduction | Added latency | Ingest cost |
|---|---|---|---|
| P0 | 0% — but now visible ✅ | 0 | 0 |
| P1 | large on multi-turn | ~100 ms | 0 |
| P2 | ~+15 pp correctness | +50–400 ms | 0 |
| P3 | ~49% (with contextual) | +20–50 ms | 0 |
| P4 | ~67% (with rerank) | 0 | 1 LLM call / chunk |
| P5 | model-dependent | 0–100 ms | re-ingest |

---

## 7. Metrics log

Fill this in as phases land. **This table is the point of the whole plan.**

| Date | Phase | Ctx Precision | Ctx Recall | Faithfulness | Answer Rel. | p50 latency | Notes |
|------|-------|---------------|------------|--------------|-------------|-------------|-------|
| 2026-07-30 | **baseline (P0)** | **0.588** | **0.895** | **0.815** | **0.448** | **1910 ms** | run `1ff70e1e`, deterministic mode, 23 cases, 45 s, $0.00086 |

Full baseline, run `1ff70e1e` — `eval/results/baseline.json`:

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
| latency p50 / p95 | ops | 1910 ms / 2636 ms |
| tokens / est. cost | ops | 5 743 / $0.00086 |

**Run-to-run variance.** Three deterministic runs gave faithfulness 0.828 /
0.809 / 0.815 and correctness 0.634 / 0.629 / 0.653. The *metrics* are
deterministic; the LLM's wording is not, so generator scores move ±0.02 while
retriever and gate metrics are rock-steady at identical values. That is why
`--compare` defaults to a 0.02 tolerance. Retrieval changes should be judged on
recall and precision, which do not drift.

By tag (recall · precision · confidence):

| Tag | n | Recall | Precision | Confidence |
|---|---|---|---|---|
| baseline | 6 | 1.000 | 0.639 | 1.000 |
| single_turn | 11 | 1.000 | 0.667 | 1.000 |
| paraphrase | 3 | 1.000 | 0.611 | 1.000 |
| multi_hop | 2 | 1.000 | 0.833 | 1.000 |
| exact_match | 4 | 1.000 | 0.750 | 1.000 |
| **multi_turn** | 4 | **0.500** | **0.208** | **0.500** |
| out_of_scope | 4 | — | — | 1.000 |

**How to read this baseline**

- The only failing slice is `multi_turn`. MT-01 and MT-04 retrieve nothing and
  decline; MT-02 and MT-03 retrieve by luck because the follow-up still shares
  vocabulary with the corpus. That is finding **L1**, confirmed by measurement,
  and it is exactly what Phase 1 targets.
- `exact_match` **passed**, contradicting the prediction. Cause is corpus size,
  not retriever strength — see finding **L23**. Do not read this as "hybrid
  search is unnecessary."
- False positive rate 0.000 with false negative rate 0.105 says the `0.15`
  threshold is currently tuned conservative: it never answers out-of-scope, but
  it declines two questions it should have answered. Retune on rerank score in
  Phase 2 (task 2.4), not before.
- Answer relevancy 0.448 is the weakest number, but it is a **lexical proxy** in
  deterministic mode — it penalizes answers that are correct while reusing few
  of the question's words. Treat it as a trend line, not an absolute. Use
  `make eval-judge` for a real relevancy read.
- Context precision 0.588 is depressed by design: `top_k=5` against a 5-chunk
  corpus retrieves nearly everything, so most returned chunks are irrelevant by
  construction. This metric only becomes meaningful once the corpus grows (L23).

---

## 8. Decision log

Record every architectural decision with its reason, so future sessions don't
relitigate settled questions.

| # | Date | Decision | Reason |
|---|------|----------|--------|
| D1 | — | Keep local CPU embeddings as the default | No-API-key ingestion is a genuine product feature |
| D2 | — | Eval harness before any pipeline change | Unmeasured changes are indistinguishable from noise |
| D3 | — | Upgrade Milvus rather than add a separate BM25 index | Native BM25 + RRF is much less to operate |
| D4 | — | Single query rewrite, not multi-query fan-out | Benchmarked evidence that fan-out can hurt |
| D5 | — | Prefer local open reranker over hosted API | Preserves the zero-API-key retrieval path |
| D6 | 2026-07-30 | Milvus storage moves from `./volumes/*` host bind mounts to Docker-managed **named volumes** | MinIO writes `xl.meta` with `O_DIRECT`; Docker Desktop's file-sharing layer rejects it with `invalid argument`, which panics Milvus on every flush. Reproduced by running fresh MinIO under `/tmp` (works) vs the project dir (fails). Named volumes live inside the Docker VM where `O_DIRECT` works. Cost: data is no longer browsable from the host. Acceptable — it was opaque binary segments anyway. |
| D7 | 2026-07-30 | Deterministic (lexical) scoring is the **CI default**; LLM-as-judge is opt-in | CI must be reproducible, free, and runnable without a secret. Judge mode costs money and flaps. Lexical proxies are directionally sound for regression detection, which is what the gate needs. |
| D8 | 2026-07-30 | Implement the metrics ourselves instead of depending on RAGAS | RAGAS pulls a large LangChain-adjacent dependency tree into a service whose whole shape is small and pinned, and it requires an LLM for every metric — which breaks the free/no-key property. Our four core metrics are ~200 lines. Revisit if we need the full RAGAS metric catalogue. |
| D9 | 2026-07-30 | Tracing is stdlib-only (`ContextVar` spans), not OpenTelemetry | Zero new dependencies, no collector to run, and it reuses the existing `x-request-id` correlation. If we later need distributed traces across the NestJS backend, swap in OTel behind the same `span()` API. |
| D10 | 2026-07-30 | The harness drives the real `QueryService`, not a simplified copy | A reimplemented pipeline would measure the harness. Each run gets its own collection (`eval_<hex>`) and client id, dropped in teardown, so isolation comes from namespacing rather than from mocking. |
| D11 | 2026-07-30 | Teardown verifies its target instead of trusting config | Teardown is the harness's only destructive operation. It now refuses to drop any collection whose name is not this run's `eval_<hex>`. A mis-resolved setting should cost a leaked eval collection, never production data. Prompted by finding L25. |

---

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Embedding model change invalidates stored vectors | Treat as a migration. Full re-ingest, never mix models in one collection. |
| pymilvus / Milvus version skew | Always bump together. Verify against the compatibility matrix. |
| Reranker latency degrades UX | Measure p95. Consider async prefetch or a smaller model. |
| Contextual enrichment cost at scale | Prompt caching; make it opt-in; batch. |
| `marshmallow<4` pin is load-bearing | Do not remove. `pymilvus → environs → marshmallow` breaks at import on 4.x. |
| Compaction loses detail | Prefer retrievable durable memory over summarization. |
| Golden set drifts from reality | Refresh quarterly from real traffic. |
| MinIO `O_DIRECT` fails on host bind mounts | Keep etcd/MinIO/Milvus on **named volumes**. If someone reverts to `./volumes/*`, Milvus crash-loops with `invalid argument` on flush. See L24 / D6. |
| Golden corpus too small to discriminate | 5 docs make recall trivially 1.0 and precision artificially low. Grow the corpus before trusting Phase 2/3 deltas. See L23. |
| Deterministic metrics are lexical proxies | Good for regression detection, bad as absolutes. Confirm any headline claim with `make eval-judge`. |
| Eval runs make live LLM calls | ~$0.001 per deterministic run on `gpt-4o-mini`. Budget accordingly if the corpus grows 10×. |
| Eval teardown is destructive | It drops a collection. The guard added for L25 only drops `eval_<hex>`. Never relax that check, and never point the harness at a production collection to "test with real data". |
| Docker network state can desync | Seen during P0: `milvus-standalone` was healthy but had no IP on the compose network, so container-to-container DNS failed while the healthcheck passed (it probes localhost). `docker compose down` then `make up-storage` fixes it. Do not hand-patch with `docker network connect` — Milvus loses its etcd lease and exits. |

---

## 10. How to use this file

1. Starting a session? Read `CLAUDE.md` first, then this file.
2. Picking up work? Take the lowest-numbered `⬜` task in the earliest incomplete phase. **That is Phase 1 — Phase 0 is done.**
3. Before you change the pipeline: `make eval-baseline` if the current baseline is stale.
4. After you change the pipeline: `make eval-compare`. Non-zero exit means you regressed something.
5. Finished something? Flip the status, add a row to §7 if metrics moved, add to §8 if you made a call.
6. Found something new? Add it to §3 with a severity and a phase.
7. Phase 0 exists so no change lands unmeasured. Use it.
