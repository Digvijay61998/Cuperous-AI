"""Query endpoint: answer an end-user question grounded in a client's data."""
import logging

from fastapi import APIRouter, HTTPException

from app.schemas import QueryRequest, QueryResponse
from app.services.query import QueryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/query", tags=["query"])


@router.post("/ask", response_model=QueryResponse)
def ask(request: QueryRequest):
    try:
        service = QueryService()
        return service.answer_question(
            client_id=request.client_id,
            question=request.question,
            chat_history=request.chat_history,
            company_name=request.company_name,
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("Query failed")
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")
