# Research Notes

Evidence base for `PLAN.md`. Every phase in the roadmap traces back to something
here.

> **Attribution:** all external content below is paraphrased and summarised.
> Original sources are linked inline. Content was rephrased for compliance with
> licensing restrictions.

---

## 1. The core insight

Industry analysis through 2026 keeps landing on the same conclusion: **when RAG
fails, retrieval is the failure point, not generation.** That has pushed
production systems past plain vector search into hybrid and agentic
architectures.

- [RAG Concept and Best Practices (2026) — Blockchain Council](https://www.blockchain-council.org/ai/rag/)

This is why every phase in `PLAN.md` targets retrieval, and why swapping the LLM
is nowhere near the top of the list.

---

## 2. Contextual Retrieval — Phase 4

**The problem.** Chunks lose their document context when split. A chunk saying
"free shipping over $50" gives the retriever nothing to distinguish which
client, product line, or region it belongs to.

**The fix.** Before embedding, use an LLM to prepend 1–2 sentences situating the
chunk inside its parent document. Do the same for the keyword index
("contextual BM25").

**Reported results** (Anthropic engineering):

| Technique | Reduction in failed retrievals |
|---|---|
| Contextual embeddings alone | ~35% fewer top-20 retrieval failures |
| + contextual BM25 | ~49% |
| + reranking | ~67% |

Sources:
- [Contextual Retrieval in AI Systems — Anthropic](https://www.anthropic.com/engineering/contextual-retrieval)
- [Enhancing RAG with contextual retrieval — Claude cookbook](https://platform.claude.com/cookbook/capabilities-contextual-embeddings-guide)
- [Implementing Anthropic's Contextual Retrieval — Towards Data Science](https://towardsdatascience.com/implementing-anthropics-contextual-retrieval-for-powerful-rag-performance-b85173a65b83/)
- [Implement contextual RAG — Together AI docs](https://docs.together.ai/docs/how-to-implement-contextual-rag-from-anthropic)

**Cost note.** One LLM call per chunk at ingest. Use prompt caching on the parent
document. Ingest is once per document; queries are forever.

---

## 3. Hybrid Search — Phase 3

**The problem.** Dense embeddings capture meaning but lose exact tokens. Product
SKUs, error codes, version strings, and rare acronyms fail — the model has never
seen `QM-4471-B` and embeds it as noise. BM25 matches it exactly.

**The fix.** Run dense and sparse retrieval in parallel, fuse with Reciprocal
Rank Fusion (RRF).

**Milvus has this natively from 2.5.** This matters a lot for us — it means
upgrading the server is cheaper than maintaining a second index:
- Milvus 2.5 added BM25 full-text search via a sparse-vector implementation of
  BM25, with RRF fusion built in.
- Milvus 2.6 improved multilingual full-text search and the analyzer pipeline.

Sources:
- [Full Text Search — Milvus docs](https://milvus.io/docs/v2.5.x/full-text-search.md)
- [Full Text Search with Milvus](https://milvus.io/docs/v2.5.x/full_text_search_with_milvus.md)
- [Semantic vs Full-Text Search in Milvus 2.5](https://milvus.io/es/blog/semantic-search-vs-full-text-search-which-one-should-i-choose-with-milvus-2-5.md)
- [RRF Ranker — Milvus docs](https://milvus.io/docs/rrf-ranker.md)
- [Milvus 2.6 multilingual full-text search at scale](https://milvus.io/zh-hant/blog/how-milvus-26-powers-hybrid-multilingual-search-at-scale.md)
- [Milvus 2.5 announcement](https://www.globenewswire.com/news-release/2024/12/17/2998318/0/en/Milvus-2-5-Creates-the-Best-of-Both-Worlds-With-Hybrid-Vector-Keyword-Search.html)

**Architecture pattern confirmations:**
- [Hybrid Retrieval Architecture — production best practices](https://markaicode.com/architecture/hybrid-retrieval-architecture-with-modal/)
- [Anthropic Hybrid Retrieval Architecture](https://markaicode.com/architecture/anthropic-hybrid-retrieval-architecture/)
- [Hybrid Search and Re-Ranking in Production RAG — Towards Data Science](https://towardsdatascience.com/hybrid-search-and-re-ranking-in-production-rag/)
- [BM25, Dense Retrieval, and SPLADE reproduced on a laptop](https://towardsdatascience.com/how-i-reproduced-bm25-dense-retrieval-and-splade-on-a-16gb-macbook/)

One writeup notes the most common production incident in hybrid retrieval is
**omitting the reranking stage** between retrieval and generation — degrading
quality and wasting tokens.

---

## 4. Reranking — Phase 2

**The problem.** Bi-encoders (our MiniLM) embed query and document *separately*;
they never see the pair together. Cosine top-k is a coarse signal.

**The fix.** Two-stage retrieval. Retrieve wide (top-50/100) with the fast
bi-encoder, then rescore with a cross-encoder that attends over the
query-document pair jointly. Take top-5.

**Measured impact.** A 2026 ICECET paper reports reranking lifting correctness
(scores ≥8) from **33.5% → 49.0%** — a 15.5 percentage-point gain.
- [A RAG System with Reranking Analysis — arXiv 2603.16877](https://arxiv.org/html/2603.16877v2)

**Latency cost.** Roughly **50–400 ms** depending on model and candidate count.
- [Best Reranker Models for RAG — comparison](https://docs.bswen.com/blog/2026-02-25-best-reranker-models/)

**Candidates:**

| Model | Type | Notes |
|---|---|---|
| `bge-reranker-v2-m3` | open, local | Multilingual; used in the SemEval system in §5 |
| `bge-reranker-base` | open, local | Smaller/faster, English-focused |
| Cohere Rerank | hosted API | Strong English quality; network hop + cost |

Sources:
- [Reranking & Cross-Encoders for RAG: BGE, Cohere, Jina](https://localaimaster.com/blog/reranking-cross-encoders-guide)
- [Best Rerankers for RAG 2026](https://futureagi.com/blog/best-rerankers-for-rag-2026/)
- [Best Rerankers for RAG — tested & ranked (Mixpeek)](https://www.mixpeek.com/curated-lists/best-rerankers)
- [Open-source alternatives to Cohere Rerank — ZeroEntropy](https://zeroentropy.dev/articles/open-source-alternatives-to-cohere-rerank/)

**Design decision (D5):** prefer a local open cross-encoder so the zero-API-key
retrieval path survives.

---

## 5. Query Rewriting — Phase 1

**The problem.** This is our worst live defect. `query.py` embeds the raw
question; chat history only reaches the LLM. "What about weekends?" embeds to
nothing useful.

**Benchmark evidence this is real.** The English MTRAG benchmark was built to
capture contextual shifts in multi-turn conversation, and shows that **even
strong RAG systems degrade on later turns and context-dependent queries.**
- [Hybrid Retrieval and Query Rewriting for Multi-Turn RAG — arXiv 2606.28352](https://arxiv.org/html/2606.28352)

**The fix.** A cheap LLM call between user input and retriever that turns a
context-dependent follow-up into a standalone query.
- [Query rewriting in RAG with LLMs](https://www.learnwithparam.com/blog/query-rewriting-rag-llm)
- [The Query Rewriting Layer Your RAG Pipeline Skipped](https://tianpan.co/blog/2026-04-26-query-rewriting-rag-retrieval-shape)

**Important nuance — more rewrites is NOT automatically better.** A
SemEval-2026 Task 8 system used a three-stage pipeline (query rewriting → hybrid
BM25+dense with RRF → cross-encoder reranking with BGE-reranker-v2-m3), scoring
nDCG@5 of 0.531, 8th of 38 systems, 10.7% over baseline. Their ablations found
domain-specific temperature tuning gave consistent gains, while **multi-query
expansion and domain-aware prompting degraded performance.**
- [Caraman at SemEval-2026 Task 8 — arXiv 2605.12028](https://arxiv.org/html/2605.12028v1)

→ **This is why D4 says start with a single rewrite and measure.**

Counterpoint worth tracking (multi-query *can* help in some setups):
- [Multi-Query Rewriting for Conversational Passage Retrieval — arXiv 2406.18960](https://arxiv.org/html/2406.18960v1)
- [Diverse Multi-Query Rewriting for RAG — arXiv 2411.13154](https://arxiv.org/html/2411.13154)
- [Embedder with Query Rewriting Skill — arXiv 2606.01697](https://arxiv.org/html/2606.01697v1)

Note the SemEval pipeline is **exactly our Phase 1 + 3 + 2** in the same order.

---

## 6. Evaluation — Phase 0

**The problem.** No harness means every change is a guess.

**Metric set.** The consensus is to evaluate retriever and generator separately:

| Layer | Metric | Question |
|---|---|---|
| Retriever | Context Precision | Are retrieved chunks actually relevant? |
| Retriever | Context Recall | Did we find everything needed? |
| Generator | Faithfulness / Groundedness | Did the LLM stay true to context? |
| Generator | Answer Relevancy | Does the answer address the question? |

**Why separate matters:** when an answer is wrong you need to know whether
retrieval grabbed the wrong docs, the LLM hallucinated despite good context, or
the right chunk was buried at rank 47.
- [RAG system evaluation — Redis](https://redis.io/blog/rag-system-evaluation/)

**RAGAS** — open-source Python framework, introduced by Shahul Es, Jithin James
and collaborators, published late 2023, presented at EACL 2024.
- [RAG Evaluation with RAGAS](https://anna-danilec.hashnode.dev/rag-evaluation-with-ragas-measuring-faithfulness-context-precision-and-recall-in-production)
- [RAGAS metrics for production systems](https://markaicode.com/rag-evaluation-ragas-metrics-production/)
- [RAG Evaluation Metrics — Confident AI](https://www.confident-ai.com/blog/rag-evaluation-metrics-answer-relevancy-faithfulness-and-more)
- [How to evaluate a RAG pipeline — Mixpeek](https://mixpeek.com/guides/how-to-evaluate-a-rag-pipeline)
- [RAG Evaluation Metrics 2026 — Future AGI](https://futureagi.com/blog/rag-evaluation-metrics-2025/)
- [Evaluation of RAG Metrics in the Telecom Domain — arXiv 2407.12873](https://arxiv.org/html/2407.12873v1)

One writeup puts it bluntly: most enterprise RAG projects are evaluated on vibes.
- [RAG Evaluation Metrics — Sphere Inc](https://www.sphereinc.com/blogs/rag-evaluation-metrics)

**Which metric tunes what:**
- Retriever metrics → choosing top-K, choosing the embedding model
- Generator metrics → tuning the LLM and the prompt template

---

## 7. Observability — Phase 0

Tracing comes **first**, before dashboards or automated scoring — everything
else is built on top of traces. A trace per user request should capture: every
LLM call with inputs/outputs, retrieved context, tool calls, latency, token
counts, and cost.

- [Evaluating and Monitoring LLM Workflows in Production](https://www.pedroalonso.net/blog/llm-evaluation-monitoring-production/)
- [RAG Observability and Evals — Langfuse](https://langfuse.com/blog/2025-10-28-rag-observability-and-evals)
- [OpenTelemetry for LLM Observability — Langfuse](https://langfuse.com/blog/2024-10-opentelemetry-for-llm-observability)
- [RAG Observability with Langfuse, vLLM, FAISS — PyImageSearch](https://pyimagesearch.com/2026/06/15/rag-observability-with-langfuse-vllm-and-faiss/)
- [Setting up LLM observability pipelines in 2026 — MLflow](https://mlflow.org/articles/setting-up-llm-observability-pipelines-in-2026/)
- [LLM observability: tracing, logging, debugging](https://abstractalgorithms.hashnode.dev/llm-observability-tracing-logging-debugging-production-ai-systems)

**Why standard APM isn't enough:** non-deterministic outputs, variable token
cost, and multi-step reasoning chains need purpose-built tracing across prompt
construction, inference, retrieval, tool calls, and eval scoring.

Options: Langfuse (open-source, self-hostable), LangSmith (native LangChain),
plain OpenTelemetry (standards-based). **A note in our favour:** we already have
request-ID correlation in `middleware.py` — good foundation to build spans on.

---

## 8. Embedding models — Phase 5

**Our situation.** `all-MiniLM-L6-v2`: 384 dims, **~256 token limit**, ~0.1 GB,
MTEB ~56. It is described in the surveys as the lightest CPU-only option — the
floor, but a legitimate one when free-and-local is a hard constraint.

**Local / self-hostable candidates:**

| Model | Dims | Context | MTEB | VRAM | License | Notes |
|---|---|---|---|---|---|---|
| all-MiniLM-L6-v2 *(ours)* | 384 | ~256 tok | ~56 | ~0.1 GB | Apache-2.0 | lightest CPU-only option |
| nomic-embed-text | 768 | 8K | — | ~0.3 GB | — | easiest local start, Ollama-native |
| **Qwen3-Embedding-0.6B** | 1024 | 32K | **70.7** | ~1.5 GB | Apache-2.0 | best quality-per-VRAM; Ollama-native |
| **BGE-M3** | 1024 | 8K | ~61 | ~2 GB | MIT | 100+ languages; **native dense + sparse hybrid** |
| Qwen3-Embedding-8B | — | — | — | large | Apache-2.0 | leads open source, needs a real GPU |

**Hosted candidates:** `text-embedding-3-large` is widely called the safest
default; Gemini Embedding is rated a strong all-rounder; Voyage and Jina offer
dimension compression to save storage.

Sources:
- [Best Local Embedding Models for RAG (2026) — d-central](https://d-central.tech/local-embedding-models/)
- [Best Embedding Model for RAG 2026 — Milvus](https://milvus.io/zh-hant/blog/choose-embedding-model-rag-2026.md)
- [Best Embedding Models for RAG in 2026 — Airbyte](https://airbyte.com/agentic-data/best-embedding-models-rag)
- [Our Picks After Testing 6 on 50K Documents](https://pecollective.com/tools/best-embedding-models/)
- [Best Embedding Models for RAG 2026 — production benchmarks](https://markaicode.com/best/best-embedding-models-for-rag-2026/)
- [Ollama embedding models by MTEB, VRAM, dimensions](https://www.morphllm.com/ollama-embedding-models)
- [MTEB v3 leaderboard](https://huggingface.co/blog/Samoed/mteb-v3-leaderboard)
- [Granite Embedding Multilingual R2](https://huggingface.co/blog/ibm-granite/granite-embedding-multilingual-r2)
- [Nemotron 3 Embed ranks #1 on RTEB](https://huggingface.co/blog/nvidia/nemotron-3-embed-wins-rteb)
- [NV-Embed, BGE, E5 compared](https://futureagi.com/blog/best-embedding-models-2025/)

**Two warnings from the surveys:**
1. MTEB scores are not interchangeable across benchmark variants — check *which*
   benchmark a number came from.
2. Bigger is not automatically better. A small model that fits your hardware and
   indexes fast often beats a leaderboard giant you can barely run.

**For us:** BGE-M3 is the strongest fit if we upgrade — 8K context kills the
silent truncation problem, native sparse output simplifies hybrid search, and
MIT licensing keeps things clean.

---

## 9. Document parsing & chunking — Phase 6

**The problem.** Fixed-size character splitting is structure-blind. Real
documents have nested lists, charts, multi-column layouts, formulas, and tables
that span page breaks. Flattened OCR text dumps turn a vector DB into a
graveyard of lost context.

**RAGFlow's approach (DeepDoc)** is the reference implementation worth studying:
layout-aware parsing that understands table structure, recognises figure
captions, preserves heading hierarchy, and OCRs scanned PDFs — *before* anything
is embedded. RAGFlow 0.21 also added a configurable ingestion pipeline and
long-context RAG.

Sources:
- [RAGFlow — GitHub](https://github.com/infiniflow/ragflow)
- [RAGFlow docs](https://ragflow.io/docs/dev)
- [DeepDoc README](https://huggingface.co/spaces/retopara/ragflow/blob/main/deepdoc/README.md)
- [RAGFlow ingestion pipeline explained](https://ragflow.io/blog/is-data-processing-like-building-with-lego-here-is-a-detailed-explanation-of-the-ingestion-pipeline)
- [RAGFlow 0.21.0 — ingestion pipeline, long-context RAG](https://ragflow.io/blog/ragflow-0.21.0-ingestion-pipeline-long-context-rag-and-admin-cli)
- [Document Parsing for Production RAG — tradeoffs](https://medium.com/@manikandan_t/document-parsing-for-production-rag-architecture-tradeoffs-and-when-to-use-what-7a89ab0af7b7)
- [Self-host a deep-document RAG engine](https://effloow.hashnode.dev/ragflow-self-hosted-rag-agent-engine-guide-2026?)

Our `/ingest/file` uses `pypdf.extract_text()` — a flat text dump. Fine for
simple docs; loses tables and structure entirely. Phase 6.1.

---

## 10. Conversation memory — Phase 7

**The 2026 consensus** is four distinct memory types:
- **Short-term** — the context window
- **Long-term** — persistent vector store
- **Episodic** — structured past experience
- **Semantic** — factual knowledge base

The best practical pattern is **hybrid layered memory**: recent context +
summaries + vector retrieval + structured memory + episodic memory + a memory
manager. A commonly cited production shape is an ephemeral conversation buffer
(Redis + TTL) separated from a long-term vector store with metadata indexing.

Sources:
- [Which Agent Memory Approach Is Best for Long Conversations? — Oracle](https://blogs.oracle.com/developers/which-agent-memory-approach-is-best-for-long-conversations)
- [AI Agent Memory Guide — short-term, long-term, episodic](https://techoral.com/ai/ai-agent-memory-guide.html)
- [LangChain Agent Memory Architecture](https://markaicode.com/architecture/ai-agent-memory-architecture/)
- [8 AI Agent Memory Patterns Beyond Basic RAG](https://dev.to/dohkoai/8-ai-agent-memory-patterns-for-production-systems-beyond-basic-rag-5795)
- [Building Conversational Memory with LLM APIs](https://grizzlypeaksoftware.com/library/building-conversational-memory-with-llm-apis-zco84s9m)

**Papers:**
- [Recursively Summarizing Enables Long-Term Dialogue Memory — arXiv 2308.15022](https://arxiv.org/html/2308.15022) — in long conversations chatbots fail to recall past info, producing inconsistent responses; recursive summarisation helps
- [COMEDY: Compressive Memory — arXiv 2402.11975](https://arxiv.org/html/2402.11975) — compresses session summaries, user-bot dynamics, and past events into a concise memory format
- [Hippocampus-Inspired Extended Memory — arXiv 2504.16754](https://arxiv.org/abs/2504.16754) — age-weighted pruning cut retrieval latency **34%** with minimal recall loss; a two-level summary hierarchy prevented cascade errors past 1,000 turns
- [Sentence Graph Memory — arXiv 2509.21212](https://arxiv.org/html/2509.21212v1)
- [Hybrid Neuro-Symbolic Memory — arXiv 2605.17596](https://arxiv.org/html/2605.17596v2) — notes the three existing families (log retrieval, LLM summarisation, KV/graph storage) are noisy, expensive, and handle contradictions and temporal change poorly

**Our situation:** the caller passes `chat_history` and we take the last 6 turns.
No summarization, no persistence, and — critically — it never reaches retrieval
(L1).

---

## 11. Reference implementation: OpenClaw

[OpenClaw](https://github.com/openclaw/openclaw) is a self-hosted personal AI
assistant / gateway. Different product from ours, but its **agent runtime**
solves problems we will hit.

**Why it's worth studying.** Descriptions of its architecture contrast it with
"chatbot wrappers that just proxy API calls" — it implements session management,
memory persistence, context window optimization, multi-channel messaging,
sandboxed tool execution, and event-driven extensibility. One writeup frames it
as an *operating system* for an agent: the LLM supplies intelligence, the
runtime supplies sessions, memory, tools, sandboxing, routing, and channels.

Sources:
- [OpenClaw README](https://github.com/openclaw/openclaw/blob/main/README.md)
- [OpenClaw docs index](https://github.com/clawdbot/clawdbot/blob/main/docs/index.md)
- [Architecture deep dive (gist)](https://gist.github.com/royosherove/971c7b4a350a30ac8a8dad41604a95a0)
- [OpenClaw Fundamentals tutorial (gist)](http://gist.github.com/mehdimashayekhi/d99ff743b0f63318fa9d9b1c2601fd4c)
- [OpenClaw — A Detailed Deep Dive](https://medium.com/@shailesh16221/openclaw-a-detailed-deep-dive-902455554ceb)
- [You Could've Invented OpenClaw (gist)](https://gist.github.com/dabit3/bc60d3bea0b02927995cd9bf53c3db32)

### 11.1 Session management & compaction → our Phase 7

Their docs cover context limits (context window vs tracked tokens), manual and
automatic compaction with hooks for pre-compaction work, and "silent
housekeeping" — memory writes that must not produce user-visible output.

- [Session management & compaction reference](https://github.com/openclaw/openclaw/blob/main/docs/reference/session-management-compaction.md)
- [Session Management Deep Dive](https://xlongxia.mintlify.app/reference/session-management-compaction)
- [Skills, Compression, Caching, and RAG — issue thread](https://github.com/JnBrymn/openclaw/issues/2)

**The critical lesson — compaction is lossy.** Compaction summarises the oldest
messages and replaces them with the summary. Specific details, exact
instructions, and nuanced preferences get flattened into generic text.

- [OpenClaw Memory Keeps Resetting — the permanent fix](https://zacsblogs.hashnode.dev/openclaw-memory-keeps-resetting-the-permanent-fix)

→ **Adopt:** prefer durable retrievable memory over aggressive summarization.
This is now a stated risk in `PLAN.md` §9 and shapes Phase 7.2.

### 11.2 Three-tier memory → our Phase 7

Their memory is layered: short-term conversation context, mid-term Markdown
files, long-term vector-indexed memory. The Markdown tier is interesting —
plain files that reload at session start, **survive compaction**, and stay
searchable even when not injected into the prompt.

- [OpenClaw Agent Memory Management Patterns](https://about.fast.io/resources/openclaw-agent-memory-management-patterns/)
- [OpenClaw Memory Setup Guide — three-tier configuration](https://fast.io/resources/openclaw-memory-guide/)

→ **Adopt the tiering idea.** For us: recent turns verbatim + rolling summary +
retrievable long-term facts in Milvus.

### 11.3 Context window discipline → our Phase 6 / cost work

Context on each turn = system prompt + injected files + conversation history +
tool schemas + tool results. When it fills, the model loses earlier instructions
and output degrades.

- [OpenClaw Context Window: monitor, optimize, compact](https://fast.io/resources/openclaw-context-window/)
- [OpenClaw optimization guide](https://github.com/OnlyTerp/openclaw-optimization-guide)

One report measured **~32% less token spend** on the AppWorld dev split by
addressing memory bloat, compaction loss, and adding a retrieval-first path —
without reducing capability. Their optimization guide also suggests cronning a
per-agent spend report and treating spend jumps as **context regressions**.

- [Your OpenClaw Bill Is Bleeding Tokens](https://medium.com/ob4ai/your-openclaw-bill-is-bleeding-tokens-heres-what-we-measured-and-how-to-fix-it-9acec35232a0)

→ **Adopt:** track tokens per stage in tracing (Phase 0.5); treat cost spikes as
a regression signal, not just a billing event.

### 11.4 External memory with hybrid retrieval → validates our Phase 3

A memory backend for OpenClaw moves memory out of the context window into a
database with **hybrid retrieval (BM25 + vector)**, two-phase fact management
(extract, then decide), and zero-LLM-cost tool output compression — so memories
persist across sessions without bloating prompts.

- [How seekdb M0 gives OpenClaw persistent memory](https://en.oceanbase.com/blog/seekdb-m0-openclaw-persistent-memory-shared-experience)

→ Independent confirmation that hybrid BM25+vector is the right retrieval
substrate, and that **two-phase fact management** (extract → decide) is a
pattern worth copying for Phase 7.2.

### 11.5 Sub-agent spawning → possible future

A main agent spawning specialised background agents in parallel, then collecting
and summarising results.

- [openclaw-architecture](https://github.com/rzafiamy/openclaw-architecture)

→ Not on our roadmap yet. Relevant if we ever add multi-step research queries.

---

## 12. Reference implementations: RAG platforms

**The 2026 landscape splits into three layers:**

1. **Batteries-included platforms** (UI + connectors): Onyx, RAGFlow, Dify, AnythingLLM, Verba, Open WebUI, LibreChat
2. **Frameworks you assemble**: LlamaIndex, LangChain, Haystack
3. **Search infrastructure**: Elastic, OpenSearch, Weaviate, Qdrant, Milvus

Sources:
- [Self-Hosted RAG: stacks, platforms, setup guide 2026 — Onyx](https://onyx.app/insights/self-hosted-rag)
- [Batteries-included RAG platforms: Dify vs RAGFlow vs Onyx](https://www.learnwithparam.com/blog/batteries-included-rag-platforms-dify-ragflow-onyx)
- [Best Enterprise RAG Platforms 2026 — Onyx](https://onyx.app/insights/enterprise-rag-platforms-2026)
- [Production RAG Frameworks Compared](https://karbouch.substack.com/p/production-rag-frameworks-compared)
- [A Production RAG System on CPU, open source, self-hosted](https://medium.com/@thourayabchir1/a-production-grade-rag-system-on-cpu-built-with-open-source-cf2875299e7e)
- [umbertogriffo/rag-chatbot — GitHub](https://github.com/umbertogriffo/rag-chatbot)
- [weaviate/Verba — GitHub](https://github.com/weaviate/Verba) *(archived; reference only)*

**Where we sit:** layer 3 + a thin custom layer 2. That is the right call for an
embeddable microservice — we do not want a UI or connector framework. But we
should borrow *techniques* from layer 1, especially RAGFlow's parsing (§9).

One framing worth remembering: production RAG in 2026 is a four-layer stack —
memory engine, RAG library, chat UI, LLM platform — and most teams need one from
each rather than one tool for everything.

Also: every answer is only as good as what happened *before* the LLM ran — how
documents were parsed, chunked, embedded, and indexed. Same conclusion as §1
from a different angle.

---

## 13. Consolidated: what we adopt and why

| Source | Technique | Our phase |
|---|---|---|
| Anthropic contextual retrieval | LLM-prepended chunk context; contextual BM25 | P4 |
| Milvus 2.5+/2.6 | Native BM25 + RRF hybrid search | P3 |
| ICECET reranking paper | Two-stage retrieve-then-rerank | P2 |
| SemEval-2026 Task 8 | rewrite → hybrid+RRF → cross-encoder (our exact order) | P1+P3+P2 |
| SemEval ablations | **Single** rewrite; skip multi-query fan-out | P1 (D4) |
| RAGAS / EACL 2024 | Split retriever vs generator metrics | P0 |
| Langfuse / OTel practice | Traces first, then metrics and scoring | P0 |
| BGE-M3 / Qwen3-Embedding | 8K+ context; native sparse; free & local | P5 |
| RAGFlow DeepDoc | Layout-aware parsing before chunking | P6 |
| OpenClaw compaction docs | Compaction is lossy → prefer durable memory | P7 (risk) |
| OpenClaw three-tier memory | recent + mid-term + long-term vector | P7 |
| OpenClaw cost analysis | Token spend per stage; spikes = context regression | P0.5 |
| seekdb M0 | Hybrid BM25+vector memory; two-phase fact mgmt | P3, P7 |
| Memory papers | Age-weighted pruning; two-level summary hierarchy | P7 |

---

## 14. Open questions

| # | Question | Resolve in |
|---|---|---|
| Q1 | Local reranker or hosted API? Depends on measured p95 latency. | P2 |
| Q2 | Is contextual enrichment worth the ingest cost at our document volume? | P4 |
| Q3 | Does BGE-M3 actually beat MiniLM *on our golden set*, not on MTEB? | P5 |
| Q4 | Do we need layered memory, or is per-request `chat_history` enough? | P7 |
| Q5 | Milvus 2.6 or stay on 2.5 for stability? | P3 |
| Q6 | Langfuse self-hosted vs plain OpenTelemetry? | P0 |
| Q7 | Is DeepDoc-grade parsing justified, or is heading-aware splitting enough? | P6 |
