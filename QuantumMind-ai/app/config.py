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
    app_name: str = "QuantumMind AI Service"
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

    # ---- Embeddings ----
    # Free, local sentence-transformers model. 384-dim, CPU friendly.
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dim: int = 384

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

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
