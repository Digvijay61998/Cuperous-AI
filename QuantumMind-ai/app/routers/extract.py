"""Structured extraction endpoints (non-RAG).

``POST /extract/contact`` pulls a person's name, e-mail and phone out of one
short chat message. The service never raises on bad model output (it falls back
to regexes), so the only non-200 here is pydantic's 422 for an empty or
over-long ``text``.
"""
import logging

from fastapi import APIRouter

from app.schemas import ExtractContactRequest, ExtractContactResponse
from app.services.extract_contact import ExtractContactService, regex_extract

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/extract", tags=["extract"])


@router.post("/contact", response_model=ExtractContactResponse)
def contact(request: ExtractContactRequest):
    try:
        return ExtractContactService().extract(request.text)
    except Exception:  # noqa: BLE001 - last line of defence; never 500
        logger.exception("Contact extraction failed, using regex fallback")
        return regex_extract(request.text)
