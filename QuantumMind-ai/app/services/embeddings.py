"""Local embedding model wrapper.

Uses sentence-transformers (all-MiniLM-L6-v2 by default) which runs on CPU and
costs nothing. The model is loaded lazily on first use and cached as a module
level singleton so it is only loaded once per process.
"""
import logging
from functools import lru_cache

from app.config import get_settings

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
        logger.info("Embedding model loaded (dim=%d)", self._dim)

    @property
    def dimension(self) -> int:
        return self._dim

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of documents. Normalized for cosine similarity."""
        if not texts:
            return []
        vectors = self._model.encode(
            texts,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return vectors.tolist()

    def embed_query(self, text: str) -> list[float]:
        """Embed a single query string."""
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
