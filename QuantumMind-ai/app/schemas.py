"""Request/response models shared across routers."""
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


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
    visitor_profile: Optional[dict] = Field(
        None,
        description="Visitor_Profile facts + newest entries (R18.8); continuity context only",
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
    # AI_Handover_Signal. The backend raises an agent alert ONLY when this is
    # exactly `true`; it never interprets the answer text. Always present
    # (default false) so callers can rely on the key.
    handover: bool = Field(
        False,
        description="True when the visitor needs a human (explicit request or an action only a person can take)",
    )
    handover_reason: Optional[str] = Field(
        None,
        max_length=200,
        description="Short reason for the handover; absent unless handover is true",
    )


# ---------------------------------------------------------------------------
# Generate (free-form, non-RAG)
# ---------------------------------------------------------------------------
class SummarizeRequest(BaseModel):
    """Summarise a completed template submission into a friendly chat message.

    Deliberately NOT routed through /query/ask: that path is strictly RAG and
    returns confident=false when a prompt has no matching knowledge-base
    context, so it can never summarise arbitrary form data. This calls the LLM
    provider directly with the submitted fields.
    """

    data: dict = Field(
        ..., description="The submitted form fields (key -> value) to summarise"
    )
    action: Optional[str] = Field(
        None,
        description="What the customer did, e.g. 'appointment booking', 'order'",
    )
    company_name: Optional[str] = Field(
        None, description="Used to personalize the confirmation"
    )
    template_name: Optional[str] = Field(
        None, description="Human name of the template/form, for context"
    )


class SummarizeResponse(BaseModel):
    answer: str
    tokens_used: int = 0
    provider: str
    model: str


# ---------------------------------------------------------------------------
# Extract (structured extraction from free text)
# ---------------------------------------------------------------------------
EXTRACT_CONTACT_MAX_TEXT = 2000
EXTRACT_CONTACT_MAX_NAME = 100


class ExtractContactRequest(BaseModel):
    """One short chat message to pull a person's contact details out of."""

    text: str = Field(
        ...,
        description="Free-text chat message; 1..2000 characters after stripping",
    )

    @field_validator("text")
    @classmethod
    def _strip_and_bound(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("text must not be empty")
        if len(value) > EXTRACT_CONTACT_MAX_TEXT:
            raise ValueError(
                f"text must be at most {EXTRACT_CONTACT_MAX_TEXT} characters"
            )
        return value


class ExtractContactResponse(BaseModel):
    """Contact fields found in the text. Null means "not clearly present"."""

    name: Optional[str] = Field(
        None, max_length=EXTRACT_CONTACT_MAX_NAME, description="The person's own name"
    )
    email: Optional[str] = Field(
        None, description="Single e-mail address appearing verbatim in the text, lower-cased"
    )
    phone: Optional[str] = Field(
        None, description="Digits with optional leading '+', 7..15 digits"
    )


# ---------------------------------------------------------------------------
# Visitor_Profile (crm-incident-handover R18, design §9)
# ---------------------------------------------------------------------------
# One rolling JSON document per CRM contact. The backend validates the same
# shape again before writing it; keep the two in sync
# (QuantumMind-backend/src/profile/profile-schema.ts).
PROFILE_MAX_CHARS = 8000
PROFILE_ENTRY_SUMMARY_MAX = 300
PROFILE_MAX_TAGS = 10
PROFILE_MAX_CHATS = 500
PROFILE_CHAT_TEXT_MAX = 4000


class ProfileOpenIssue(BaseModel):
    model_config = ConfigDict(extra="ignore")
    text: str = Field(..., max_length=300)
    since: Optional[str] = None
    incidentId: Optional[str] = None
    ticketRef: Optional[str] = None


class ProfileFacts(BaseModel):
    model_config = ConfigDict(extra="ignore")
    interests: list[str] = Field(default_factory=list)
    products: list[str] = Field(default_factory=list)
    preferences: list[str] = Field(default_factory=list)
    openIssues: list[ProfileOpenIssue] = Field(default_factory=list)
    language: Optional[str] = None


class ProfileEntry(BaseModel):
    """One dated item per conversation, newest first in the profile (R18.3)."""

    model_config = ConfigDict(extra="ignore")
    conversationId: Optional[str] = None
    at: str
    tz: Optional[str] = None
    bot: Optional[str] = None
    channel: Optional[str] = None
    summary: str = Field(..., min_length=1, max_length=PROFILE_ENTRY_SUMMARY_MAX)
    tags: list[str] = Field(default_factory=list, max_length=PROFILE_MAX_TAGS)
    outcome: Optional[str] = None
    incidentId: Optional[str] = None
    ticketRef: Optional[str] = None
    agent: Optional[str] = None
    problem: Optional[str] = None
    resolution: Optional[str] = None
    # False for the backend's deterministic fallback entry (R11.7).
    ai: bool = True


class ProfileEarlier(BaseModel):
    """Compression bucket for the oldest entries (R18.9). Keeps every ref."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    from_: Optional[str] = Field(None, alias="from")
    to: Optional[str] = None
    summary: str = ""
    count: int = 0
    incidentRefs: list[str] = Field(default_factory=list)
    incidentIds: list[str] = Field(default_factory=list)


class VisitorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    v: Literal[1] = 1
    facts: ProfileFacts = Field(default_factory=ProfileFacts)
    # e.g. {"facts.interests": ["lifts"]}. Admin corrections; a merge keeps them (R18.12).
    adminOverrides: dict = Field(default_factory=dict)
    entries: list[ProfileEntry] = Field(default_factory=list)
    earlier: Optional[ProfileEarlier] = None


class ProfileChat(BaseModel):
    role: str = Field(..., max_length=20)
    # Pre-masked by the backend (R11.5): no emails, phones or secure values.
    text: str = Field(..., max_length=PROFILE_CHAT_TEXT_MAX)
    at: Optional[str] = None


class ProfileIncident(BaseModel):
    """Incident facts copied into the entry as-is, never generated (R18.4)."""

    model_config = ConfigDict(extra="ignore")
    id: Optional[str] = None
    ticketRef: Optional[str] = None
    problem: Optional[str] = None
    resolution: Optional[str] = None
    agent: Optional[str] = None
    outcome: Optional[str] = None
    status: Optional[str] = None


class ProfileMergeRequest(BaseModel):
    profile: Optional[VisitorProfile] = None
    chats: list[ProfileChat] = Field(default_factory=list, max_length=PROFILE_MAX_CHATS)
    incident: Optional[ProfileIncident] = None
    org_tz: str = "UTC"
    bot: Optional[str] = None
    channel: str = "widget"
    compress: bool = False
    # Makes the merge idempotent: a profile that already has an entry for this
    # conversation is returned unchanged.
    conversation_id: Optional[str] = None
    # When the conversation ended (ISO); defaults to now.
    ended_at: Optional[str] = None


class ProfileMergeResponse(BaseModel):
    profile: VisitorProfile
    tokens_used: int = 0
    provider: str
    model: str


# ---------------------------------------------------------------------------
# Learned knowledge (crm-incident-handover R21, R12.2, R12.9)
# ---------------------------------------------------------------------------
KNOWLEDGE_QUESTION_MIN = 10
KNOWLEDGE_QUESTION_MAX = 500
KNOWLEDGE_ANSWER_MIN = 10
KNOWLEDGE_ANSWER_MAX = 2000


class KnowledgeCandidateRequest(BaseModel):
    """An agent resolution, pre-masked by the backend (no emails, phones,
    names or ticket refs), to generalise into a reusable Q&A."""

    problem: str = Field(..., min_length=1, max_length=1000)
    resolution: str = Field(..., min_length=1, max_length=2000)
    company: Optional[str] = Field(None, max_length=100)


class KnowledgeCandidateResponse(BaseModel):
    question: str
    answer: str
    tokens_used: int = 0
    provider: str
    model: str


class KnowledgeSimilarRequest(BaseModel):
    client_id: str = Field(..., min_length=1, max_length=128)
    text: str = Field(..., min_length=1, max_length=4000)
    # Letters, digits, ':' and '-' only: it becomes a Milvus LIKE prefix.
    source_prefix: str = Field("incident:", pattern=r"^[A-Za-z0-9:\-]{1,64}$")


class KnowledgeSimilarMatch(BaseModel):
    source: str
    score: float


class KnowledgeSimilarResponse(BaseModel):
    best: Optional[KnowledgeSimilarMatch] = None


# --- Service request summary (crm-plugins-service-desk R15) -----------------

SR_SUMMARY_FIELD_MAX = 400


class TranscriptLineIn(BaseModel):
    """One pre-masked chat line: who said it and what."""

    model_config = ConfigDict(extra="ignore")

    from_: str = Field("unknown", alias="from", max_length=20)
    text: str = Field("", max_length=4000)


class ServiceRequestSummaryRequest(BaseModel):
    """A service request and its masked chat (no emails, phones or refs)."""

    subject: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=10_000)
    transcript: list[TranscriptLineIn] = Field(default_factory=list, max_length=500)
    language: Optional[str] = Field(None, max_length=20)


class ServiceRequestSummaryResponse(BaseModel):
    overview: str
    customer_ask: str
    actions_taken: str
    next_step: str
    tokens_used: int = 0
    provider: str
    model: str
