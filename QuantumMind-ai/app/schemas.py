"""Request/response models shared across routers."""
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Ingestion
# ---------------------------------------------------------------------------
class WebsitePage(BaseModel):
    """A single scraped web page."""

    url: str = Field(..., description="Source URL of the page")
    title: Optional[str] = Field(None, description="Page title")
    content: str = Field(..., description="Extracted plain-text content of the page")


class IngestWebsiteRequest(BaseModel):
    client_id: str = Field(..., description="Tenant identifier the data belongs to")
    bot_id: Optional[str] = Field(
        None, description="Optional bot id; knowledge is shared across a client's bots"
    )
    pages: list[WebsitePage] = Field(..., description="Scraped pages to ingest")


class IngestTextRequest(BaseModel):
    client_id: str = Field(..., description="Tenant identifier the data belongs to")
    bot_id: Optional[str] = None
    text: str = Field(..., description="Raw text to ingest (FAQ, product info, etc.)")
    source: str = Field(
        "manual", description="Logical source name used for later updates/deletes"
    )
    source_type: Literal["manual", "website", "file"] = "manual"


class IngestResponse(BaseModel):
    success: bool
    client_id: str
    source: Optional[str] = None
    chunks_ingested: int
    message: str
    # Extracted plain text (returned by file ingestion so the caller can store
    # it for later viewing). Omitted for large bulk operations.
    text: Optional[str] = None


class DeleteSourceResponse(BaseModel):
    success: bool
    client_id: str
    source: str
    deleted: int


# ---------------------------------------------------------------------------
# Query
# ---------------------------------------------------------------------------
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class QueryRequest(BaseModel):
    client_id: str = Field(..., description="Tenant identifier to scope the search")
    question: str = Field(..., description="The end-user's question")
    bot_id: Optional[str] = None
    company_name: Optional[str] = Field(
        None, description="Used to personalize the system prompt"
    )
    chat_history: list[ChatMessage] = Field(
        default_factory=list, description="Recent turns for multi-turn context"
    )


class SourceChunk(BaseModel):
    text: str
    source_url: Optional[str] = None
    score: float


class QueryResponse(BaseModel):
    answer: Optional[str]
    confident: bool = Field(
        ..., description="False when no relevant context was found; bot should fall back"
    )
    sources: list[SourceChunk] = Field(default_factory=list)
    tokens_used: int = 0
    provider: str
    model: str
