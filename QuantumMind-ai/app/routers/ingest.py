"""Ingestion endpoints: push client content into the knowledge base."""
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.schemas import (
    DeleteSourceResponse,
    IngestResponse,
    IngestTextRequest,
    IngestWebsiteRequest,
)
from app.services.ingestion import IngestionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingest", tags=["ingest"])


def get_ingestion_service() -> IngestionService:
    # Instantiated per request; underlying vector store + embeddings are cached
    # singletons so this is cheap.
    return IngestionService()


@router.post("/website", response_model=IngestResponse)
def ingest_website(
    request: IngestWebsiteRequest,
    service: IngestionService = Depends(get_ingestion_service),
):
    try:
        pages = [p.model_dump() for p in request.pages]
        count = service.ingest_website_pages(
            client_id=request.client_id,
            pages=pages,
            bot_id=request.bot_id,
        )
        return IngestResponse(
            success=True,
            client_id=request.client_id,
            source="website",
            chunks_ingested=count,
            message=f"Ingested {count} chunks from {len(pages)} page(s).",
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("Website ingestion failed")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")


@router.post("/text", response_model=IngestResponse)
def ingest_text(
    request: IngestTextRequest,
    service: IngestionService = Depends(get_ingestion_service),
):
    try:
        count = service.ingest_text(
            client_id=request.client_id,
            text=request.text,
            source=request.source,
            source_type=request.source_type,
            bot_id=request.bot_id,
        )
        return IngestResponse(
            success=True,
            client_id=request.client_id,
            source=request.source,
            chunks_ingested=count,
            message=f"Ingested {count} chunk(s) for source '{request.source}'.",
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("Text ingestion failed")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")


@router.delete("/{client_id}/{source:path}", response_model=DeleteSourceResponse)
def delete_source(
    client_id: str,
    source: str,
    service: IngestionService = Depends(get_ingestion_service),
):
    try:
        removed = service.delete_source(client_id, source)
        return DeleteSourceResponse(
            success=True,
            client_id=client_id,
            source=source,
            deleted=removed,
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("Delete source failed")
        raise HTTPException(status_code=500, detail=f"Delete failed: {e}")


def _extract_text_from_file(file: UploadFile) -> str:
    """Extract plain text from an uploaded file (PDF, DOCX, or TXT)."""
    filename = (file.filename or "").lower()
    content = file.file.read()
    return _extract_text_from_bytes(content, filename)


def _extract_text_from_bytes(content: bytes, filename: str) -> str:
    """Extract plain text from file bytes (PDF, DOCX, or TXT)."""
    filename = filename.lower()

    if filename.endswith(".pdf"):
        from pypdf import PdfReader
        import io

        reader = PdfReader(io.BytesIO(content))
        text = "\n\n".join(
            page.extract_text() or "" for page in reader.pages
        )
        return text.strip()

    if filename.endswith(".docx"):
        from docx import Document
        import io

        doc = Document(io.BytesIO(content))
        text = "\n\n".join(para.text for para in doc.paragraphs if para.text)
        return text.strip()

    # Default: treat as plain text.
    try:
        return content.decode("utf-8").strip()
    except UnicodeDecodeError:
        return content.decode("latin-1").strip()


@router.post("/file", response_model=IngestResponse)
def ingest_file(
    client_id: str = Form(...),
    bot_id: str = Form(None),
    file: UploadFile = File(...),
    service: IngestionService = Depends(get_ingestion_service),
):
    """Upload and ingest a document (PDF, DOCX, or TXT).

    Extracts text from the file, chunks it, and stores vectors in Milvus.
    The original file is NOT stored here — the backend handles S3 storage.
    The source is the original filename so re-uploading replaces old content.
    """
    try:
        content = file.file.read()
        filename = file.filename or "uploaded_file"

        text = _extract_text_from_bytes(content, filename)
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from file")

        count = service.ingest_text(
            client_id=client_id,
            text=text,
            source=filename,
            source_type="file",
            bot_id=bot_id,
        )
        return IngestResponse(
            success=True,
            client_id=client_id,
            source=filename,
            chunks_ingested=count,
            message=f"Ingested {count} chunk(s) from '{filename}'.",
            text=text,
        )
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        logger.exception("File ingestion failed")
        raise HTTPException(status_code=500, detail=f"File ingestion failed: {e}")


@router.post("/files", response_model=list[IngestResponse])
def ingest_files(
    client_id: str = Form(...),
    bot_id: str = Form(None),
    files: list[UploadFile] = File(...),
    service: IngestionService = Depends(get_ingestion_service),
):
    """Upload and ingest multiple documents at once.

    Each file is processed independently; failures in one don't block others.
    Original files are NOT stored here — backend handles S3 storage.
    """
    results = []
    for f in files:
        try:
            content = f.file.read()
            filename = f.filename or "uploaded_file"

            text = _extract_text_from_bytes(content, filename)
            if not text:
                results.append(IngestResponse(
                    success=False,
                    client_id=client_id,
                    source=filename,
                    chunks_ingested=0,
                    message=f"Could not extract text from '{filename}'",
                ))
                continue

            count = service.ingest_text(
                client_id=client_id,
                text=text,
                source=filename,
                source_type="file",
                bot_id=bot_id,
            )
            results.append(IngestResponse(
                success=True,
                client_id=client_id,
                source=filename,
                chunks_ingested=count,
                message=f"Ingested {count} chunk(s) from '{filename}'.",
            ))
        except Exception as e:  # noqa: BLE001
            logger.exception(f"Failed to ingest file {f.filename}")
            results.append(IngestResponse(
                success=False,
                client_id=client_id,
                source=f.filename or "unknown",
                chunks_ingested=0,
                message=f"Failed: {e}",
            ))
    return results
