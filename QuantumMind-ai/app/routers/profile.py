"""Visitor_Profile endpoints (crm-incident-handover R18).

``POST /profile/merge`` folds one finished, pre-masked conversation into the
contact's profile. A model failure is a 502 so the backend retries and, after
its last retry, writes its own deterministic fallback entry (R11.6, R11.7).
"""
import logging

from fastapi import APIRouter, HTTPException

from app.schemas import ProfileMergeRequest, ProfileMergeResponse
from app.services.profile_merge import ProfileMergeError, ProfileMergeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("/merge", response_model=ProfileMergeResponse, response_model_exclude_none=True)
def merge(request: ProfileMergeRequest):
    try:
        return ProfileMergeService().merge(request)
    except ProfileMergeError as exc:
        logger.warning("Profile merge rejected: %s", exc)
        raise HTTPException(status_code=502, detail=f"Profile merge failed: {exc}")
    except Exception as exc:  # noqa: BLE001 - provider down, timeout, etc.
        logger.exception("Profile merge failed")
        raise HTTPException(status_code=502, detail=f"Profile merge failed: {exc}")
