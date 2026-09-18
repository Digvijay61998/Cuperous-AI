"""Free-form generation endpoints (non-RAG).

Separate router from /query because the behaviour is fundamentally different:
/query is retrieval-grounded and confidence-gated, while these endpoints call
the LLM provider directly. Kept apart so the RAG contract (sources, confident)
is never confused with free-form generation.
"""
import logging

from fastapi import APIRouter, HTTPException

from app.schemas import SummarizeRequest, SummarizeResponse
from app.services.summarize import SummarizeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generate", tags=["generate"])


@router.post("/summary", response_model=SummarizeResponse)
def summary(request: SummarizeRequest):
    try:
        service = SummarizeService()
        return service.summarize_submission(
            data=request.data,
            action=request.action,
            company_name=request.company_name,
            template_name=request.template_name,
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("Summarize failed")
        raise HTTPException(status_code=500, detail=f"Summarize failed: {e}")
