"""JarCube AI Service — FastAPI application entrypoint.

A standalone RAG (Retrieval-Augmented Generation) service that:
  * ingests client website/manual content into a multi-tenant vector store
  * answers end-user questions grounded in each client's own knowledge base

The NestJS backend calls this service from the AI_RESPONSE workflow node.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.logging_utils import configure_logging
from app.middleware import RequestLoggingMiddleware
from app.routers import health, ingest, query

settings = get_settings()

# Colored, request-id-aware logging installed before anything else logs.
configure_logging(settings.log_level)

app = FastAPI(title=settings.app_name)

# Correlation id + HTTP request/response logging for every call.
app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(ingest.router)
app.include_router(query.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.app_env == "development",
    )
