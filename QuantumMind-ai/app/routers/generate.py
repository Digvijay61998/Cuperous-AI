"""Free-form generation endpoints (non-RAG).

Separate router from /query because the behaviour is fundamentally different:
/query is retrieval-grounded and confidence-gated, while these endpoints call
the LLM provider directly. Kept apart so the RAG contract (sources, confident)
is never confused with free-form generation.
"""
import logging

from fastapi import APIRouter, HTTPException

from app.schemas import (
    ServiceRequestSummaryRequest,
    ServiceRequestSummaryResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from app.services.service_request_summary import (
    ServiceRequestSummaryError,
    ServiceRequestSummaryService,
)
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


@router.post("/service-request-summary", response_model=ServiceRequestSummaryResponse)
def service_request_summary(request: ServiceRequestSummaryRequest):
    """Summary of one service request (crm-plugins-service-desk R15). 502 = keep the old one."""
    try:
        return ServiceRequestSummaryService().summarize(request)
    except ServiceRequestSummaryError as exc:
        logger.warning("Service request summary rejected: %s", exc)
        raise HTTPException(status_code=502, detail=f"Summary rejected: {exc}")
    except Exception as exc:  # noqa: BLE001 - provider down, timeout, etc.
        logger.exception("Service request summary failed")
        raise HTTPException(status_code=502, detail=f"Summary failed: {exc}")
