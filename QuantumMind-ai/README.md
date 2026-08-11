# JarCube AI Service

A standalone RAG (Retrieval-Augmented Generation) microservice that gives the
JarCube chatbot **context-aware answers** instead of static, predefined
replies. It ingests each client's website / knowledge-base content, stores it in
a multi-tenant vector database, and answers end-user questions grounded in that
client's own data.

The NestJS backend calls this service from the **`AI_RESPONSE`** workflow node.

---

## How it works

```
Client content (scraped site / manual text)
        │  POST /ingest/website | /ingest/text
        ▼
  chunk + embed (all-MiniLM-L6-v2, local & free)
        ▼
   Milvus vector store  (isolated per client_id)
        ▲
        │  POST /query/ask  { client_id, question, chat_history }
        ▼
  retrieve top matches ── confident? ──▶ LLM (OpenAI / Moonshot / Anthropic) ──▶ answer
                              │
                              └── not confident ──▶ {confident:false}  (bot falls back)
```

- **Embeddings** run locally on CPU (`sentence-transformers/all-MiniLM-L6-v2`) — **no API key, no cost.**
- **Only answer generation** uses a paid LLM. Default is OpenAI **`gpt-4o-mini`** (cheapest good option).
- If retrieval finds nothing relevant, the service returns `confident: false` and **does not call the LLM** (saves money), so the bot can fall back to a human or a default message.

---

## What you need to provide

| Requirement | Notes |
|-------------|-------|
| **Docker + Docker Compose** | Runs the whole stack. |
| **An LLM API key** | Only one is required, based on `LLM_PROVIDER`. Cheapest: an **OpenAI** key (`OPENAI_API_KEY`) with `gpt-4o-mini`. |

> You do **not** need a key for embeddings or for ingestion. A key is only used when the service generates an answer.

### Getting an OpenAI key
1. Create an account at platform.openai.com.
2. Create an API key and add a few dollars of credit (heavy testing costs cents with `gpt-4o-mini`).
3. Put it in `.env` as `OPENAI_API_KEY=sk-...`.

### Using Kimi K2 (Moonshot) or Anthropic instead
Moonshot exposes an OpenAI-compatible API, so switching is just config:
```env
LLM_PROVIDER=moonshot
LLM_MODEL=moonshot-v1-8k
MOONSHOT_API_KEY=your-moonshot-key
```
For Anthropic:
```env
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-5-haiku-latest
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## Run it locally (recommended: Docker)

The whole stack — Milvus (vector DB) + the AI service — runs with one command.

```bash
# 1. Configure environment
cp .env.example .env
#    then edit .env and set OPENAI_API_KEY=sk-...

# 2. Start everything (Milvus + AI service)
docker compose up -d --build

# 3. Check it's healthy
curl http://localhost:8000/healthcheck
```

Open the interactive API docs at **http://localhost:8000/docs**.

> First build downloads ML dependencies and the embedding model, so it takes a
> few minutes. Later builds are cached and fast.

To stop:
```bash
docker compose down          # keep data
docker compose down -v       # also remove all Milvus data
```

> **Where the data lives.** etcd, MinIO, and Milvus each persist to a
> **Docker-managed named volume** (`etcd_data`, `minio_data`, `milvus_data`), not
> to a folder in the repo. This is deliberate: MinIO writes its erasure-coding
> metadata with `O_DIRECT`, which Docker Desktop's file-sharing layer rejects on
> host bind mounts, and the resulting write failures panic Milvus on every flush.
> Named volumes live inside the Docker VM where `O_DIRECT` works.
>
> `docker compose down -v` removes all three. If you have a leftover
> `volumes.broken.*` directory from an older checkout, it is dead data and safe
> to delete.

There is a `Makefile` wrapping all of this — run `make help`.

### Running only Milvus (e.g. to run the app from an IDE)
```bash
docker compose up -d etcd minio milvus
# then run the app however you like, pointing MILVUS_HOST=localhost
```

---

## Try it end-to-end

```bash
# Ingest some knowledge for a client
curl -X POST http://localhost:8000/ingest/text \
  -H "Content-Type: application/json" \
  -d '{
        "client_id": "acme",
        "text": "Acme support is open Monday to Friday, 9am to 5pm. Free shipping over $50.",
        "source": "faq"
      }'

# Ask a grounded question
curl -X POST http://localhost:8000/query/ask \
  -H "Content-Type: application/json" \
  -d '{ "client_id": "acme", "question": "When is support open?", "company_name": "Acme" }'
```

A relevant question returns `confident: true` with an `answer`. An unrelated
question returns `confident: false` and `answer: null`.

---

## API reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/healthcheck` | Liveness probe. |
| POST | `/ingest/website` | Ingest scraped pages: `{ client_id, bot_id?, pages: [{ url, title?, content }] }`. Re-ingesting a URL replaces its old chunks. |
| POST | `/ingest/text` | Ingest raw text: `{ client_id, text, source?, source_type?, bot_id? }`. |
| DELETE | `/ingest/{client_id}/{source}` | Remove all chunks for a source. |
| POST | `/query/ask` | Answer a question: `{ client_id, question, bot_id?, company_name?, chat_history?: [{role, content}] }` → `{ answer, confident, sources, tokens_used, provider, model }`. |

**Multi-tenancy:** every record is isolated by `client_id`. Multiple bots of the
same company can share one `client_id` so they all answer from the same data.

---

## Configuration (`.env`)

See `.env.example` for the full list. Key settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `MILVUS_HOST` / `MILVUS_PORT` | `localhost` / `19530` | Vector DB location. Compose sets host to `milvus`. |
| `LLM_PROVIDER` | `openai` | `openai` \| `moonshot` \| `anthropic`. |
| `LLM_MODEL` | `gpt-4o-mini` | Model name for the chosen provider. |
| `OPENAI_API_KEY` | — | Required when `LLM_PROVIDER=openai`. |
| `RETRIEVAL_TOP_K` | `5` | Chunks retrieved per query. |
| `MIN_SIMILARITY_SCORE` | `0.15` | Cosine threshold below which the answer is treated as "not confident". Tuned for `all-MiniLM-L6-v2`, which yields low cosine scores even for clearly relevant matches. |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `500` / `50` | Text-splitting parameters. |
| `AI_TRACING` | `true` | Per-stage spans with latency, tokens, and cost. See Observability below. |
| `EMBEDDING_MAX_TOKENS` | `256` | Token budget used for the truncation warning. Matches `all-MiniLM-L6-v2`. |
| `EVAL_JUDGE_MODEL` | `gpt-4o-mini` | Model used by `make eval-judge`, independent of the model under test. |
| `EVAL_DATASET_PATH` / `EVAL_RESULTS_DIR` | `eval/golden/dataset.yaml` / `eval/results` | Where the harness reads and writes. |

---

## Connecting the NestJS backend

In the backend's environment set:
```env
AI_URL=http://localhost:8000
```
Add an **AI Response** node to a bot workflow. Its payload may set
`clientId` (which knowledge base to query) and `companyName`; if omitted they
default to the bot's own id and name. When the node runs it calls
`POST {AI_URL}/query/ask`; a confident answer is sent to the user, otherwise the
flow takes the failure/fallback branch.

---

## Testing

Tests use pytest. Integration tests need a running Milvus.

```bash
make up-storage    # start etcd + MinIO + Milvus, wait for health
make test          # run the suite inside the service image
```

Or the raw form. Note `MILVUS_HOST` is the **container** name: plain `docker run`
resolves container names but not compose service aliases.

```bash
docker run --rm --network quantummind-ai \
  -e MILVUS_HOST=milvus-standalone -e MILVUS_PORT=19530 \
  -v "$PWD":/app -w /app quantummind-ai-ai-service:latest \
  bash -c "pip install --quiet pytest pyyaml && pytest -v"
```

The suite covers the vector store (incl. tenant isolation), ingestion, the LLM
provider factory, the query engine's confidence gating, tracing, the eval
metrics, and an end-to-end HTTP flow. The query tests use a fake LLM provider, so
**no API key is needed to run the tests.**

---

## Evaluation

Retrieval quality is measured, not guessed. `eval/` holds a golden dataset and a
harness that drives the real query pipeline in an isolated Milvus collection.

```bash
make eval             # score the golden set (deterministic, reproducible)
make eval-baseline    # ...and save it as the regression baseline
make eval-compare     # ...and exit non-zero if anything regressed
make eval-judge       # LLM-as-judge scoring instead of lexical (costs money)
```

Nine metrics across three layers — retriever (context recall, context
precision), generator (faithfulness, answer relevancy, answer correctness, fact
coverage), and the confidence gate (accuracy, false negative rate, false
positive rate) — plus latency, tokens, and estimated cost. Results land in
`eval/results/`, and CI runs the comparison on every push.

Details: `eval/README.md`. Current numbers and roadmap: `PLAN.md`.

---

## Observability

Tracing is on by default (`AI_TRACING=true`). Each request emits one span per
pipeline stage — retrieval, confidence gate, prompt build, generation — with
latency, token counts, and an estimated cost, plus a `stages=` summary on the
request log line. Spans reuse the same `x-request-id` the HTTP layer already
sets, so traces correlate with logs for free.

It is stdlib-only: no OpenTelemetry dependency, no collector to run. Tracing
failures are swallowed by design — a missing span is an observability gap, never
a failed request. Set `AI_TRACING=false` to silence it.

---

## Project layout

```
app/
  config.py            # env-driven settings
  main.py              # FastAPI app + router wiring
  schemas.py           # request/response models
  routers/             # health, ingest, query endpoints
  services/
    embeddings.py      # local sentence-transformers embeddings
    vector_store.py    # multi-tenant Milvus store
    ingestion.py       # chunking + ingest pipeline
    query.py           # RAG query engine (retrieve -> generate)
  llm/
    base.py            # provider interface
    openai_provider.py # OpenAI + Moonshot (OpenAI-compatible)
    anthropic_provider.py
    factory.py         # picks provider from config
  tracing.py           # per-stage spans: latency, tokens, cost
eval/
  golden/dataset.yaml  # golden questions + expectations
  metrics.py           # retrieval / generation / gate metrics
  runner.py            # harness CLI
  results/             # baseline.json, latest.json, history.jsonl
tests/                 # unit + integration + e2e
Makefile               # every common command — run `make help`
Dockerfile
docker-compose.yml
PLAN.md                # improvement roadmap + task tracker
CLAUDE.md              # context primer for AI coding assistants
docs/RESEARCH.md       # research papers & benchmarks behind the roadmap
docs/PHASE0_IMPLEMENTATION.md  # what the eval harness does and what it measured
```

---

## Development roadmap

This service implements a **naive RAG** pipeline, and we are improving it in
measured phases. Progress is tracked in **[PLAN.md](PLAN.md)** with the
supporting research in **[docs/RESEARCH.md](docs/RESEARCH.md)**.

- **Phase 0 — done.** Eval harness, tracing, CI regression gate, committed
  baseline. Write-up: **[docs/PHASE0_IMPLEMENTATION.md](docs/PHASE0_IMPLEMENTATION.md)**.
- **Phase 1 — next.** Query rewriting so chat history reaches retrieval. Today a
  follow-up like "what about weekends?" is embedded literally and retrieves
  nothing; the harness measures this at 0.500 recall on multi-turn cases.
- Then: reranking, hybrid search (BM25 + RRF), contextual chunk enrichment,
  and production hardening (auth, CORS, rate limits, real healthcheck).

If you are an AI coding assistant, start with **[CLAUDE.md](CLAUDE.md)**.


Clean build Docker compose
cd /media/jay/427EF9697EF9565F/Digvijay-projects/Cuperous-AI/QuantumMind-ai

# Stop and clean
docker compose down
docker volume rm quantummind-ai_milvus_cache quantummind-ai_etcd_data 2>/dev/null

# Start fresh
docker compose up -d

# Wait ~90 seconds then check
sleep 90 && docker logs milvus-standalone 2>&1 | head -30
