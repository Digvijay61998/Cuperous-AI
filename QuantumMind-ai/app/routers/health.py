"""Health and readiness endpoints."""
from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/")
def root():
    settings = get_settings()
    return {"status": "running", "service": settings.app_name}


@router.get("/healthcheck")
def healthcheck():
    return {"message": "Server up and running", "status": 200}
