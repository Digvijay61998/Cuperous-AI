"""Local embedding model wrapper.

Uses sentence-transformers (all-MiniLM-L6-v2 by default) which runs on CPU and
costs nothing. The model is loaded lazily on first use and cached as a module
level singleton so it is only loaded once per process.

Truncation guard
----------------
all-MiniLM-L6-v2 accepts roughly 256 tokens and silently truncates anything
longer — no exception, no warning, you simply lose the tail of the chunk. That
is a real risk here because ``ingest_website_pages`` prepends the page title to
the body, so a long title plus content can overflow. We therefore check every
batch against the model's reported ``max_seq_length`` and log a warning naming
the offending text. See PLAN.md finding L5.
"""
import logging
from functools import lru_cache

from app.config import get_settings
from app.tracing import span

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Thin wrapper around a sentence-transformers model."""

    def __init__(self, model_name: str) -> None:
        # Imported here so the (heavy) dependency is only required when the
        # embedding service is actually instantiated.
        from sentence_transformers import SentenceTransformer

        logger.info("Loading embedding model: %s", model_name)
        self._model = SentenceTransformer(model_name)
        self._dim = self._model.get_sentence_embedding_dimension()
        # Prefer the model's own declared limit; fall back to the configured
        # value if the model does not expose one.
        self._max_seq_length = (
            getattr(self._model, "max_seq_length", None)
            or get_settings().embedding_max_tokens
        )
        logger.info(
            "Embedding model loaded (dim=%d, max_seq_length=%s)",
            self._dim,
            self._max_seq_length,
        )

    @property
    def dimension(self) -> int:
        return self._dim

    @property
    def max_seq_length(self) -> int:
        """Token budget before the model truncates silently."""
        return self._max_seq_length

    # ------------------------------------------------------------------ guard
    def _warn_on_truncation(self, texts: list[str]) -> int:
        """Log a warning for any text that will be silently truncated.

        Returns the number of offending texts so callers can record it on a
        trace span. Tokenisation is the authoritative check — character-length
        heuristics are too rough to trust here.
        """
        limit = self._max_seq_length
        if not limit:
            return 0

        truncated = 0
        try:
            tokenizer = self._model.tokenizer
        except Exception:  # pragma: no cover - defensive
            return 0

        for text in texts:
            try:
                n_tokens = len(tokenizer.encode(text, add_special_tokens=True))
            except Exception:  # pragma: no cover - never fail a real ingest
                continue
            if n_tokens > limit:
                truncated += 1
                logger.warning(
                    "[EMBED] text is %d tokens but the model truncates at %d — "
                    "the tail will be LOST. Reduce CHUNK_SIZE or switch to a "
                    "longer-context model. preview=%r",
                    n_tokens,
                    limit,
                    text[:120],
                )
        return truncated

    # ------------------------------------------------------------------ embed
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of documents. Normalized for cosine similarity."""
        if not texts:
            return []
        with span("embed_documents", count=len(texts)) as sp:
            truncated = self._warn_on_truncation(texts)
            if truncated:
                sp.set(truncated=truncated)
            vectors = self._model.encode(
                texts,
                normalize_embeddings=True,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
        return vectors.tolist()

    def embed_query(self, text: str) -> list[float]:
        """Embed a single query string."""
        with span("embed_query", chars=len(text)):
            vector = self._model.encode(
                [text],
                normalize_embeddings=True,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
        return vector[0].tolist()


@lru_cache
def get_embedding_service() -> EmbeddingService:
    """Cached embedding service singleton."""
    settings = get_settings()
    return EmbeddingService(settings.embedding_model)
