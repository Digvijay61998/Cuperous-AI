"""Learned-knowledge endpoints (crm-incident-handover R21).

``POST /knowledge/candidate`` generalises a pre-masked agent resolution into a
Q&A. A bad or unsafe result is a 502 so the backend retries and then records
the failure (R12.9).

``POST /knowledge/similar`` returns the closest existing chunk among one
tenant's ``incident:*`` sources, so the backend can update a near-duplicate
instead of adding another entry (R21.3).
"""
import logging

from fastapi import APIRouter, HTTPException

from app.schemas import (
    KnowledgeCandidateRequest,
    KnowledgeCandidateResponse,
    KnowledgeSimilarMatch,
    KnowledgeSimilarRequest,
    KnowledgeSimilarResponse,
)
from app.services.knowledge_candidate import KnowledgeCandidateError, KnowledgeCandidateService
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.post("/candidate", response_model=KnowledgeCandidateResponse)
def candidate(request: KnowledgeCandidateRequest):
    try:
        return KnowledgeCandidateService().generate(request)
    except KnowledgeCandidateError as exc:
        logger.warning("Knowledge candidate rejected: %s", exc)
        raise HTTPException(status_code=502, detail=f"Knowledge candidate rejected: {exc}")
    except Exception as exc:  # noqa: BLE001 - provider down, timeout, etc.
        logger.exception("Knowledge candidate failed")
        raise HTTPException(status_code=502, detail=f"Knowledge candidate failed: {exc}")


@router.post("/similar", response_model=KnowledgeSimilarResponse, response_model_exclude_none=True)
def similar(request: KnowledgeSimilarRequest):
    try:
        hits = get_vector_store().search_source_prefix(
            request.client_id, request.text, request.source_prefix, top_k=3
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Knowledge similarity search failed")
        raise HTTPException(status_code=502, detail=f"Similarity search failed: {exc}")
    hits = [h for h in hits if (h.get("source") or "").startswith(request.source_prefix)]
    if not hits:
        return KnowledgeSimilarResponse(best=None)
    best = max(hits, key=lambda h: h["score"])
    return KnowledgeSimilarResponse(best=KnowledgeSimilarMatch(source=best["source"], score=best["score"]))
