"""Multi-tenant Milvus vector store.

A single collection stores chunks for every client. Tenant isolation is enforced
two ways:

  * ``client_id`` is declared as a Milvus *partition key*, so Milvus physically
    groups each tenant's rows and prunes other partitions during search.
  * Every search/delete additionally passes an explicit ``client_id == "..."``
    boolean expression as a defense-in-depth filter.

Similarity uses COSINE distance on normalized embeddings, so returned scores are
in the range [-1, 1] where higher means more similar.
"""
import logging
import threading

from pymilvus import (
    Collection,
    CollectionSchema,
    DataType,
    FieldSchema,
    connections,
    utility,
)

from app.config import get_settings
from app.services.embeddings import get_embedding_service

logger = logging.getLogger(__name__)

# Field length limits (bytes) for VARCHAR columns.
_MAX_TEXT_LEN = 65535
_MAX_ID_LEN = 128
_MAX_URL_LEN = 2048
_MAX_SOURCE_LEN = 1024


def _escape(value: str) -> str:
    """Escape a string for safe interpolation into a Milvus boolean expression."""
    return value.replace("\\", "\\\\").replace('"', '\\"')


class VectorStoreService:
    """Manages the shared knowledge collection and per-tenant operations."""

    _instance: "VectorStoreService | None" = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self.settings = get_settings()
        self.embeddings = get_embedding_service()
        self.collection_name = self.settings.milvus_collection
        self._alias = "default"
        self._collection: Collection | None = None
        self._connect()
        self._ensure_collection()

    # ------------------------------------------------------------------ setup
    def _connect(self) -> None:
        logger.info(
            "Connecting to Milvus at %s:%s",
            self.settings.milvus_host,
            self.settings.milvus_port,
        )
        connections.connect(
            alias=self._alias,
            host=self.settings.milvus_host,
            port=self.settings.milvus_port,
        )

    def _ensure_collection(self) -> None:
        if utility.has_collection(self.collection_name, using=self._alias):
            self._collection = Collection(self.collection_name, using=self._alias)
            logger.info("Using existing collection: %s", self.collection_name)
        else:
            self._collection = self._create_collection()
            logger.info("Created collection: %s", self.collection_name)

        self._ensure_index()
        self._collection.load()

    def _create_collection(self) -> Collection:
        fields = [
            FieldSchema(
                name="pk",
                dtype=DataType.INT64,
                is_primary=True,
                auto_id=True,
            ),
            # Partition key -> physical tenant isolation.
            FieldSchema(
                name="client_id",
                dtype=DataType.VARCHAR,
                max_length=_MAX_ID_LEN,
                is_partition_key=True,
            ),
            FieldSchema(name="bot_id", dtype=DataType.VARCHAR, max_length=_MAX_ID_LEN),
            FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=_MAX_SOURCE_LEN),
            FieldSchema(name="source_url", dtype=DataType.VARCHAR, max_length=_MAX_URL_LEN),
            FieldSchema(name="source_type", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=_MAX_TEXT_LEN),
            FieldSchema(
                name="vector",
                dtype=DataType.FLOAT_VECTOR,
                dim=self.embeddings.dimension,
            ),
        ]
        schema = CollectionSchema(
            fields,
            description="QuantumMind multi-tenant knowledge base",
            # Number of physical partitions used to spread tenants.
            num_partitions=16,
        )
        return Collection(
            name=self.collection_name,
            schema=schema,
            using=self._alias,
            consistency_level="Strong",
        )

    def _ensure_index(self) -> None:
        has_index = False
        try:
            has_index = bool(self._collection.indexes)
        except Exception:  # pragma: no cover - defensive
            has_index = False

        if not has_index:
            self._collection.create_index(
                field_name="vector",
                index_params={
                    "index_type": "HNSW",
                    "metric_type": "COSINE",
                    "params": {"M": 8, "efConstruction": 64},
                },
            )
            logger.info("Created HNSW/COSINE index on 'vector'")

    # ------------------------------------------------------------------ writes
    def add_documents(
        self,
        client_id: str,
        bot_id: str | None,
        chunks: list[dict],
    ) -> int:
        """Embed and insert chunks for a tenant.

        Each chunk dict: {text, source, source_url, source_type}.
        Returns the number of rows inserted.
        """
        if not chunks:
            return 0

        texts = [c["text"] for c in chunks]
        vectors = self.embeddings.embed_documents(texts)

        rows = [
            {
                "client_id": client_id,
                "bot_id": bot_id or "",
                "source": c.get("source", ""),
                "source_url": c.get("source_url", ""),
                "source_type": c.get("source_type", "manual"),
                "text": c["text"],
                "vector": vec,
            }
            for c, vec in zip(chunks, vectors)
        ]

        self._collection.insert(rows)
        self._collection.flush()
        logger.info("Inserted %d chunks for client=%s", len(rows), client_id)
        return len(rows)

    # ------------------------------------------------------------------ reads
    def search(self, client_id: str, query: str, top_k: int | None = None) -> list[dict]:
        """Return the most similar chunks for a tenant.

        Result dicts: {text, source_url, score}. Score is cosine similarity.
        """
        top_k = top_k or self.settings.retrieval_top_k
        query_vec = self.embeddings.embed_query(query)
        expr = f'client_id == "{_escape(client_id)}"'

        results = self._collection.search(
            data=[query_vec],
            anns_field="vector",
            param={"metric_type": "COSINE", "params": {"ef": 64}},
            limit=top_k,
            expr=expr,
            output_fields=["text", "source_url", "source_type"],
        )

        hits: list[dict] = []
        for hit in results[0]:
            hits.append(
                {
                    "text": hit.entity.get("text"),
                    "source_url": hit.entity.get("source_url"),
                    "score": float(hit.score),
                }
            )
        return hits

    # ----------------------------------------------------------------- deletes
    def delete_by_source(self, client_id: str, source: str) -> int:
        """Delete all chunks for a given (client, source). Returns count removed."""
        expr = f'client_id == "{_escape(client_id)}" && source == "{_escape(source)}"'
        # Count first so we can report how many were removed.
        existing = self._collection.query(expr=expr, output_fields=["pk"])
        count = len(existing)
        if count:
            self._collection.delete(expr=expr)
            self._collection.flush()
        logger.info("Deleted %d chunks for client=%s source=%s", count, client_id, source)
        return count

    def delete_client(self, client_id: str) -> int:
        """Delete every chunk belonging to a client."""
        expr = f'client_id == "{_escape(client_id)}"'
        existing = self._collection.query(expr=expr, output_fields=["pk"])
        count = len(existing)
        if count:
            self._collection.delete(expr=expr)
            self._collection.flush()
        return count


def get_vector_store() -> VectorStoreService:
    """Thread-safe lazy singleton accessor."""
    if VectorStoreService._instance is None:
        with VectorStoreService._lock:
            if VectorStoreService._instance is None:
                VectorStoreService._instance = VectorStoreService()
    return VectorStoreService._instance
