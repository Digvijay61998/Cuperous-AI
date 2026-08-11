"""Application configuration loaded from environment variables.

All settings can be overridden via a `.env` file (see `.env.example`).
"""
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- Service ----
    app_name: str = "JarCube AI Service"
    app_env: Literal["development", "production"] = "development"
    host: str = "0.0.0.0"
    port: int = 8000
    # Comma-separated list of allowed CORS origins, or "*" for all.
    cors_origins: str = "*"

    # ---- Logging ----
    # Base log level. In production keep INFO/WARNING; use debug for full traces.
    log_level: str = "INFO"
    # Verbose pipeline logs (payloads, prompts, raw model responses, retrieval
    # scores). Auto-enabled in development; force with AI_DEBUG_LOGS=true.
    ai_debug_logs: bool = False

    @property
    def debug_logs_enabled(self) -> bool:
        return (
            self.ai_debug_logs
            or self.app_env == "development"
            or self.log_level.upper() == "DEBUG"
        )

    # ---- Milvus (vector database) ----
    milvus_host: str = "localhost"
    milvus_port: str = "19530"
    milvus_collection: str = "quantummind_knowledge"

    # ---- Tracing (PLAN.md Phase 0.5) ----
    # Emits one structured [TRACE] line per request with per-stage latency,
    # token counts and estimated cost. Cheap, stdlib-only, no external exporter.
    ai_tracing: bool = True

    @property
    def tracing_enabled(self) -> bool:
        return self.ai_tracing

    # ---- Embeddings ----
    # Free, local sentence-transformers model. 384-dim, CPU friendly.
    # NOTE: the real vector dimension is read from the loaded model at runtime
    # (EmbeddingService.dimension) — there is deliberately no EMBEDDING_DIM
    # setting, because a stale value would silently disagree with the model.
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    # Warn when a chunk exceeds the model's usable token budget. all-MiniLM-L6-v2
    # truncates at ~256 tokens *silently*, so without this guard we lose the tail
    # of long chunks with no error. See PLAN.md finding L5.
    embedding_max_tokens: int = 256

    # ---- Text chunking ----
    chunk_size: int = 500
    chunk_overlap: int = 50

    # ---- Retrieval ----
    retrieval_top_k: int = 5
    # Minimum similarity (cosine) required to treat retrieved context as relevant.
    # Below this the query engine reports low confidence so the bot can fall back.
    # Tuned for all-MiniLM-L6-v2, which yields fairly low cosine scores even for
    # clearly relevant matches; 0.15 favors recall. The system prompt still
    # instructs the LLM not to answer when the context lacks the information.
    min_similarity_score: float = 0.15

    # ---- LLM provider ----
    # One of: openai | moonshot | anthropic
    llm_provider: Literal["openai", "moonshot", "anthropic"] = "openai"
    llm_model: str = "gpt-4o-mini"
    llm_temperature: float = 0.3
    llm_max_tokens: int = 512

    # Provider API keys / base URLs
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"

    # Moonshot (Kimi K2) — OpenAI-compatible API
    moonshot_api_key: str = ""
    moonshot_base_url: str = "https://api.moonshot.cn/v1"

    anthropic_api_key: str = ""

    # ---- AWS S3 (Milvus storage backend) ----
    # Declared so the shared .env validates, but the AI service never talks to
    # S3 itself — docker-compose forwards these to Milvus as
    # MINIO_ACCESS_KEY_ID / MINIO_SECRET_ACCESS_KEY. Bucket, region and SSL are
    # set in milvus/user.yaml because Milvus has no env var for them.
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-south-1"

    # ---- Evaluation (PLAN.md Phase 0) ----
    # Model used by the eval harness as LLM-as-judge for faithfulness and answer
    # relevancy. Kept separate from llm_model so we can judge with a stronger (or
    # simply different) model than the one under test.
    eval_judge_model: str = "gpt-4o-mini"
    # Path to the golden dataset consumed by the harness.
    eval_dataset_path: str = "eval/golden/dataset.yaml"
    # Where run results are written (JSON, one file per run + a history file).
    eval_results_dir: str = "eval/results"

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
