"""Document ingestion pipeline.

Takes raw client content (scraped web pages, pasted text, or uploaded files),
splits it into overlapping chunks, and stores it in the multi-tenant vector
store keyed by ``client_id``.
"""
import logging

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings
from app.services.answer_policy import repair_text
from app.services.vector_store import VectorStoreService, get_vector_store

logger = logging.getLogger(__name__)


class IngestionService:
    def __init__(self, store: VectorStoreService | None = None) -> None:
        self.settings = get_settings()
        self.store = store or get_vector_store()
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.settings.chunk_size,
            chunk_overlap=self.settings.chunk_overlap,
            # Split on natural boundaries first, then fall back to characters.
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def _chunk(self, text: str) -> list[str]:
        """Repair extraction artefacts, then split.

        Repair happens BEFORE chunking, so the stored text and the vector
        computed from it both carry the corrected characters. Repairing only at
        answer time would fix what the customer reads while leaving the
        embedding computed over `■5,000` — so a customer searching for "₹5,000"
        would still fail to match the chunk that answers them. Idempotent, so
        re-ingesting repaired text is a no-op.
        """
        if not text or not text.strip():
            return []
        repaired = repair_text(text)
        return [c for c in self.splitter.split_text(repaired) if c.strip()]

    # ------------------------------------------------------------------ website
    def ingest_website_pages(
        self,
        client_id: str,
        pages: list[dict],
        bot_id: str | None = None,
    ) -> int:
        """Ingest scraped pages. Each page: {url, title?, content}.

        Re-ingesting the same URL replaces its previous chunks so updated
        content never leaves stale duplicates behind.
        """
        total = 0
        for page in pages:
            url = page.get("url") or ""
            title = page.get("title") or ""
            content = page.get("content") or ""

            # Replace any prior chunks for this URL (source == url).
            if url:
                self.store.delete_by_source(client_id, url)

            # Prepend the title so it is embedded alongside the body text.
            body = f"{title}\n\n{content}" if title else content
            chunks = self._chunk(body)
            if not chunks:
                continue

            rows = [
                {
                    "text": chunk,
                    "source": url,
                    "source_url": url,
                    "source_type": "website",
                }
                for chunk in chunks
            ]
            total += self.store.add_documents(client_id, bot_id, rows)

        logger.info(
            "Ingested %d chunks from %d pages for client=%s",
            total,
            len(pages),
            client_id,
        )
        return total

    # --------------------------------------------------------------------- text
    def ingest_text(
        self,
        client_id: str,
        text: str,
        source: str = "manual",
        source_type: str = "manual",
        bot_id: str | None = None,
    ) -> int:
        """Ingest a block of raw text (FAQ, product info, policies, ...).

        Re-ingesting the same ``source`` replaces its previous chunks.
        """
        self.store.delete_by_source(client_id, source)

        chunks = self._chunk(text)
        if not chunks:
            return 0

        rows = [
            {
                "text": chunk,
                "source": source,
                "source_url": "",
                "source_type": source_type,
            }
            for chunk in chunks
        ]
        count = self.store.add_documents(client_id, bot_id, rows)
        logger.info("Ingested %d chunks for client=%s source=%s", count, client_id, source)
        return count

    # --------------------------------------------------------------- management
    def delete_source(self, client_id: str, source: str) -> int:
        return self.store.delete_by_source(client_id, source)
