# CLAUDE.md — Context primer for AI coding assistants

> **Read this first in any new session.** It tells you what this project is,
> how it is built, what we are changing, and the rules you must not break.
>
> - `PLAN.md` — the roadmap and task tracker. Work comes from there.
> - `docs/RESEARCH.md` — papers, benchmarks, and reference repos behind each decision.

---

## What this project is

**JarCube AI Service** — a standalone RAG microservice that gives a
multi-tenant customer-support chatbot context-aware answers grounded in each
client's own content.

- A NestJS backend calls it from an `AI_RESPONSE` workflow node.
- Python 3.11 · FastAPI · Milvus · local CPU embeddings · pluggable LLM provider.
- Runs entirely via `docker compose up -d --build`.

---

## Repository map

```
app/
  main.py                    FastAPI app; CORS + request-logging middleware; router wiring
  config.py                  Pydantic Settings — ALL config lives here, env-driven
  schemas.py                 Every request/response model
  middleware.py              Correlation IDs (x-request-id), HTTP request/response logging
  logging_utils.py           Colored formatter, request-id contextvar, secret masking, banners

  routers/
    health.py                GET /  ·  GET /healthcheck
    ingest.py                POST /ingest/website · /text · /file · /files  ·  DELETE /ingest/{client}/{source}
    query.py                 POST /query/ask

  services/
    embeddings.py            sentence-transformers wrapper; lru_cache singleton
    vector_store.py          ALL Milvus access; thread-safe singleton; tenant isolation
    ingestion.py             chunking + ingest orchestration (repairs text pre-embed)
    conversation.py          smalltalk routing — answers greetings BEFORE retrieval
    answer_policy.py         system prompt · refusal detection · text repair
    query.py                 ⭐ the RAG engine — route → rewrite → retrieve → gate
                             → prompt → generate → refusal check

  rewriter/                  query-rewrite strategies (ABC + factory + config)
    base.py                  QueryRewriter ABC + RewriteResult (frozen — do not edit)
    noop.py                  the off switch; `rewriter_strategy = none`, the default
    sanitize.py              pure helpers: pronoun list, response sanitisation, ids
    factory.py               name → constructor registry; `llm` not yet registered

  llm/
    base.py                  LLMProvider ABC + LLMResult dataclass
    factory.py               picks provider from settings.llm_provider (lru_cache)
    openai_provider.py       OpenAI AND Moonshot (same SDK, different base_url)
    anthropic_provider.py    Claude — system prompt hoisted to top-level arg

  tracing.py                 stdlib span/trace system — per-stage latency, tokens, cost

eval/                        ⭐ evaluation harness (Phase 0)
  golden/dataset.yaml        23 cases over 5 documents; tags slice the results
  datasets/                  ⭐ five HAND-GRADED suites (conversational behaviour)
    README.md                how to run and score them; corpus ground truth
    01..05-*.md              grading criteria per case
    suites.yaml              machine-readable questions for the runner
    probe_datasets.py        asks them in order; prints answers next to criteria
  metrics.py                 recall/precision/faithfulness/relevancy/correctness + gate metrics
  runner.py                  CLI; drives the REAL QueryService in an isolated collection
  results/baseline.json      the comparison target — regressions are measured against this
  results/latest.json        most recent run
  results/history.jsonl      one line per run, for trend tracking
  README.md                  how to run and interpret it

tests/                       unit + integration + e2e (fake LLM provider, no API key needed)
docker-compose.yml           etcd + MinIO + Milvus + ai-service (Docker-managed named volumes)
Dockerfile                   py3.11-slim; CPU torch wheel; embedding model pre-baked
Makefile                     ⭐ every common command — start here
PLAN.md                      ⭐ roadmap + task tracker
docs/RESEARCH.md             ⭐ research backing every decision
docs/PHASE0_IMPLEMENTATION.md  what Phase 0 built and what it measured
volumes.broken.*/            dead data from the pre-named-volume era. Safe to delete.
```

---

## How the pipeline works right now

### Ingestion
```
POST /ingest/{website|text|file|files}
  → parse (pypdf / python-docx / plain text)
  → delete_by_source(client_id, source)        ← idempotency
  → RecursiveCharacterTextSplitter(500, 50)
  → embed batch (all-MiniLM-L6-v2, 384d, normalized)
  → Milvus insert + flush
```

### Query
```
POST /query/ask
  → classify_smalltalk(question)               ← greeting/thanks/bye/identity?
      → if matched: return a warm reply. 0 embeddings, 0 searches, 0 tokens.
  → rewriter.rewrite(question, history)        ← retrieval-only; `none` by default,
                                                 so today this is inert (L1 open)
  → embed(search_query)                        ← ⚠️ still the raw question while
                                                 rewriter_strategy = none
  → Milvus COSINE top-8, expr: client_id == "..."
  → absolute gate: score >= 0.15               ← decides `confident`
  → relative gate: score >= 0.45 × best        ← decides how much enters the prompt;
                                                 top chunk always kept
  → if none: return {confident: false, answer: NO_CONTEXT_REPLY}  ← LLM never called
  → repair_text on each chunk, build system prompt
  → append last 6 history turns + question     ← the LLM sees the ORIGINAL question
  → provider.generate(messages)
  → is_refusal(answer)?                        ← model declined despite passing chunks
      → if so: confident=false, sources=[]     ← lets the caller escalate
  → return {answer, confident, sources, tokens_used, provider, model}
```

### Storage
Three Docker services back Milvus:
- **etcd** — metadata (schemas, segment state)
- **MinIO** — S3-compatible object store; the actual vector/segment binaries. **Local disk, not cloud.**
- **Milvus** — the vector DB itself; RocksDB write buffer + memory-mapped HNSW index

All three persist in **Docker-managed named volumes** (`etcd_data`, `minio_data`,
`milvus_data`) — *not* in `./volumes/` any more. See hard rule 10 for why.
`docker compose down -v` (or `make down-hard`) wipes them; plain `down` keeps them.

---

## Hard rules — do not break these

### 1. Tenant isolation is sacred
Every Milvus read/write/delete MUST scope by `client_id`, using **both**:
- the partition key (physical grouping), and
- an explicit `client_id == "..."` boolean expression (defense in depth)

Always pass strings through `_escape()` before interpolating into an expression.

### 2. The confidence gate stays before the LLM call
Retrieve → evaluate → only then generate. Never call the LLM unconditionally.
This is cost control *and* hallucination control.

### 3. Ingestion must work with no API key
Embeddings run locally. Any feature that needs an LLM at ingest time must be
**opt-in**, with the no-key path still functional.

### 4. LLM provider access goes through the factory
Never instantiate `OpenAI(...)` or `Anthropic(...)` outside `app/llm/`.
Resolution stays lazy — `QueryService.provider` is a property for a reason:
the fallback path must work without a configured key.

### 5. `marshmallow<4` pin is load-bearing
`pymilvus → environs → marshmallow`. Version 4.x removed an attribute `environs`
reads at import time. Removing the pin breaks startup. Leave it.

### 6. pymilvus and the Milvus server version must match
Compose runs `milvusdb/milvus:v2.4.15`; `pymilvus==2.4.9`. Bump **both together**
or the protocol mismatches.

### 7. Changing the embedding model requires a full re-ingest
Mixed-model vectors in one collection degrade retrieval **silently** — no error,
just worse answers. Treat it as a migration.

### 8. All config goes through `app/config.py`
Never read `os.environ` directly in application code.

### 9. Never log secrets
Use the helpers in `logging_utils.py` (`mask_secret`, `mask_headers`,
`mask_mapping`). API keys are already in the sensitive-keys set.

### 10. Milvus storage stays on named volumes — never host bind mounts
MinIO writes its erasure-coding metadata (`xl.meta`) with `O_DIRECT`. Docker
Desktop's file-sharing layer rejects that with `invalid argument`, MinIO returns
an error on every write, and **Milvus panics on flush and crash-loops forever**.
The symptom looks like a Milvus bug; it is not. Do not "simplify" the compose
file back to `./volumes/*`. Finding **L24**, decision **D6**.

### 11. Measure before and after any pipeline change
`make eval-baseline` → change → `make eval-compare`. A non-zero exit means you
regressed something. Record the delta in `PLAN.md` §7. This is the entire point
of Phase 0.

**Judge retrieval work on recall and precision.** The gate applies two
tolerances: `0.02` to retriever and gate metrics, `0.08` to faithfulness /
answer relevancy / answer correctness. Generator metrics are scored against text
the LLM wrote and move ~0.06 run to run on *identical* code; retriever and gate
metrics never touch the LLM and are stable to the digit. Do not tighten the
generator tolerance without re-measuring across at least five runs. Finding
**L26**, decision **D12**.

### 12. `confident: false` is the escalation signal — keep it truthful
Callers route to a human on `confident: false`. So the flag must mean "we could
not answer this", not "cosine similarity was above 0.15". Two consequences:

- A model refusal downgrades it (`answer_policy.is_refusal`). Without this, a
  polite "I don't have that information" ships to the customer with
  `confident: true` and the handoff never fires. Finding **L28**, decision **D14**.
- `is_refusal` must stay **conservative**. A missed refusal costs one bot reply; a
  false positive routes an already-answered question to a human and wastes an
  agent's time. It judges clause by clause, and a clause containing a figure is
  substantive regardless of how it is framed — do not "simplify" that to a length
  or keyword check. Decision **D15**.

### 13. A greeting must never reach retrieval
`services/conversation.py` answers greetings, thanks, sign-offs and identity
questions before any embedding happens. Deleting or bypassing it does not merely
lose a nicety — "hello" retrieves the least-dissimilar policy chunk, clears the
gate, and the LLM correctly reports that no chunk answers it, so the customer who
said hi receives "I don't have that information right now." Finding **L27**.

The matcher requires a **complete phrase cover** of the message, not containment.
Loosening that to containment makes "thanks, how much is Growth?" match on
`thanks` and reply "Glad that helped!" to a pricing question. Every rule in that
module is written to fail *towards* retrieval; keep it that way. Decision **D13**.

### 14. Tracing must never break a request
`app/tracing.py` swallows its own errors by design. Keep it that way. A span that
fails to record is an observability gap, not a 500.

### 15. Eval isolation is load-bearing — do not weaken it
`eval/runner.py` **assigns** `MILVUS_COLLECTION` (never `setdefault`), because
`.env` already sets it and the Makefile passes `--env-file`. A `setdefault` there
is a silent no-op, and teardown then drops the **production** collection. Teardown
also verifies its target and refuses to drop anything but `eval_<hex>`. Finding
**L25**, decision **D11**. Both guards stay.

---

## Known traps

| Trap | Detail |
|---|---|
| **Chat history never reaches retrieval** | `query.py` embeds the raw question. History only reaches the LLM. Follow-ups retrieve nothing. This is finding **L1** and the top priority. Still open: the rewriter seam is wired but `rewriter_strategy` defaults to `none` and `llm_rewriter.py` does not exist yet (spec tasks 8.1–8.2). `multi_turn` remains 0.500 recall. |
| **PDF extraction mangles `₹` to `■`** | pypdf substitutes U+25A0 for glyphs it cannot map, and the model then quotes the box back to the customer. `answer_policy.repair_text` maps it back **at ingest**, so the stored text and its embedding both carry the fix — repairing only at answer time leaves a customer searching "₹5,000" unable to match the chunk. The table is tiny on purpose: it is safe only because this corpus is single-currency. Finding **L30**, decision **D18**. |
| **The similarity gate is not an answerability check** | `confident` from cosine alone says chunks *look* related, not that they contain the answer. Hence the refusal check (hard rule 12). If you add a reranker in Phase 2, move the gate onto the rerank score but keep the refusal check — they catch different failures. |
| **MiniLM truncates at ~256 tokens** | Was silent; Phase 0 added a warning in `embeddings.py`. The truncation itself still happens — that is Phase 5. `ingest_website_pages` prepends the page title, so long title + content can overflow and you lose the tail. |
| ~~**Threshold docs disagree**~~ | Fixed in Phase 0. `0.15` everywhere. Code is authoritative if they ever drift again. |
| ~~**`embedding_dim` setting is dead**~~ | Removed in Phase 0. Real dimension comes from the loaded model via `self.embeddings.dimension`. |
| **`bot_id` is written, never read** | No search or delete filters on it. |
| **MinIO + host bind mount = Milvus crash loop** | `O_DIRECT` on `xl.meta`. See hard rule 10. |
| **`docker run` cannot resolve compose service aliases** | Use the *container* name `milvus-standalone`, not the service name `milvus`, when running one-off containers on the `quantummind-ai` network. Already handled in the `Makefile`. |
| **Golden corpus is too small to discriminate** | 5 docs, `top_k=5` → recall is trivially 1.0 and precision artificially low. The `exact_match` cases pass at baseline for this reason, not because dense retrieval is fine. Finding **L23**. |
| **Local image is `quantummind-ai-ai-service:latest`** | Compose derives it from `<project>-<service>`. Not `quantummind-ai:local`. |
| **`delete_by_source` full-scans to count** | Pulls every matching PK into Python just for the response number — and runs on *every* ingest. |
| **No auth, `CORS_ORIGINS=*`** | Every endpoint is open. Fine locally, not beyond. |
| **`/healthcheck` checks nothing** | Static 200. Docker says healthy while Milvus is down. |
| **`/ingest/file` returns full extracted text** | Intentional per its docstring, but can be megabytes. `/ingest/files` correctly omits it. |

---

## Commands

**Use the `Makefile`.** `make help` lists everything. The eval and test targets
run inside the service image, which already has every dependency plus the
embedding model baked in.

```bash
make up             # build + start the whole stack
make up-storage     # only etcd + MinIO + Milvus, waits for health
make down           # stop, keep data
make down-hard      # stop and DELETE all vectors (prompts first)
make logs           # follow AI service logs
make health         # docker compose ps

make test           # pytest suite (needs Milvus; no API key required)
make eval           # eval harness, deterministic mode
make eval-baseline  # ...and save it as the regression baseline
make eval-compare   # ...and exit non-zero on regression
make eval-judge     # LLM-as-judge scoring (costs money)
make shell          # shell inside the service image
```

Raw equivalents, if you need to vary something the Makefile does not expose:

```bash
docker compose up -d --build
curl http://localhost:8000/healthcheck

# One-off container on the compose network. MILVUS_HOST must be the CONTAINER
# name — plain `docker run` does not resolve compose service aliases.
docker run --rm --network quantummind-ai --env-file .env \
  -e MILVUS_HOST=milvus-standalone -e MILVUS_PORT=19530 \
  -v "$PWD":/app -w /app quantummind-ai-ai-service:latest \
  bash -c "pip install --quiet pytest pyyaml && pytest -v"

# Running the app from an IDE instead
docker compose up -d etcd minio milvus   # then MILVUS_HOST=localhost
```

**Interactive API docs:** `http://localhost:8000/docs` (Swagger UI, built into
FastAPI — upload a PDF and ask questions from there). Also `/redoc` and
`/openapi.json`.

---

## Current work

**We are executing `PLAN.md`.** Read it before writing code.

**Phase 0 is complete** (2026-07-30). The eval harness, tracing, and the CI gate
exist, and a baseline is committed. **Phase 1 is the current work.**

Baseline to beat — run `8aa7f7b9`, `eval/results/baseline.json`:

| Ctx Recall | Ctx Precision | Faithfulness | Answer Rel. | Confidence Acc. | p50 |
|---|---|---|---|---|---|
| 0.895 | 0.588 | 0.815 | 0.448 | 0.913 | 1910 ms |

Generator metrics drift ±0.02 run to run (LLM wording varies); retriever and gate
metrics are stable. Judge retrieval work on recall and precision.

The one failing slice is `multi_turn` (recall 0.500, confidence 0.500) — that is
finding L1, and Phase 1 targets exactly it. Details in
`docs/PHASE0_IMPLEMENTATION.md`.

Phase order:

| Phase | What | Why |
|---|---|---|
| **0** | Eval harness + tracing + doc fixes | ✅ **Done.** Cannot measure improvement without it. |
| **1** | Query rewriting with chat history | 🟦 **Current.** Fixes L1, the worst live defect. One day. |
| **2** | Cross-encoder reranking | Best correctness-per-effort available. |
| **3** | Hybrid search (Milvus 2.6 + BM25 + RRF) | Fixes SKUs, error codes, proper nouns. |
| **4** | Contextual chunk enrichment | Fixes context-less chunks. |
| **5** | Better embedding model | Only if eval says retrieval is still the bottleneck. |
| **6** | Structure-aware chunking, streaming, citations, caching | Quality of life. |
| **7** | Groundedness check, layered memory | Advanced. |
| **8** | Auth, CORS, rate limits, real healthcheck | Production hardening. |

Every pipeline change from here runs through the harness. `make eval-compare`
before you call anything done.

---

## Conventions

- **Style:** module docstring explaining *why*, section comments (`# ---- writes ----`), type hints everywhere, f-strings, `pathlib` over `os.path`.
- **Errors:** routers catch broad, log with `logger.exception`, re-raise as `HTTPException`. Services let exceptions propagate.
- **Logging:** `logging.getLogger(__name__)`, or a namespaced logger (`"ai.query"`, `"ai.llm.openai"`). Use `banner()` for pipeline sections. Gate verbose output on `settings.debug_logs_enabled`.
- **Tests:** fake the store and the LLM provider (see `tests/test_query.py`). Unit tests must not require Milvus or a key. Integration tests use a unique collection name and drop it in teardown.
- **Singletons:** `lru_cache` for settings/embeddings/provider; explicit thread-safe double-checked lock for the vector store.

---

## Before you finish any task

1. `make test` — the suite must be green.
2. `make eval-compare` — must exit 0. If it does not, you regressed something.
3. Update the task status in `PLAN.md` §5.
4. If metrics moved, add a row to `PLAN.md` §7 with the run id.
5. If you made an architectural call, add it to `PLAN.md` §8.
6. If you found something new, add it to `PLAN.md` §3 with severity + phase.
7. If a measurement contradicted a prediction, **say so in the docs.** The
   `exact_match` cases are the precedent: they were predicted to fail and did
   not, and the file now records that rather than hiding it.
