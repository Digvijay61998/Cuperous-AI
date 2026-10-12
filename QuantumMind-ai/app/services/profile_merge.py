"""Fold one finished conversation into the rolling Visitor_Profile (R18).

The model is asked for the *new* information only (one entry summary, tags,
an outcome and the updated standing facts). The profile itself is assembled
here, deterministically, so the invariants never depend on the model:

- exactly one entry is added, for this conversation (R18.2);
- earlier entries are copied untouched, so no date or incident ref is lost;
- incident fields (id, ticket ref, problem, resolution, agent, outcome) come
  from the request, never from the model (R18.4);
- admin corrections in ``adminOverrides`` are re-applied after the model, so
  a merge can never undo them (R18.12);
- the result fits in PROFILE_MAX_CHARS: the oldest entries are folded into one
  dated ``earlier`` bucket that keeps every incident id and ticket ref (R18.9).

A model failure raises ``ProfileMergeError``; the backend retries and owns the
fallback (R11.6, R11.7). Compression never fails on a model error: its summary
falls back to a deterministic text.
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import Iterable, Optional

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.schemas import (
    PROFILE_ENTRY_SUMMARY_MAX,
    PROFILE_MAX_CHARS,
    PROFILE_MAX_TAGS,
    ProfileEarlier,
    ProfileEntry,
    ProfileFacts,
    ProfileMergeRequest,
    ProfileMergeResponse,
    ProfileOpenIssue,
    VisitorProfile,
)
from app.tracing import span

try:  # Python 3.9+
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - the service image runs 3.11
    ZoneInfo = None  # type: ignore

logger = logging.getLogger("ai.profile_merge")

# Aim below the hard cap: the backend measures with JS string length.
TARGET_CHARS = PROFILE_MAX_CHARS - 400
TRANSCRIPT_MAX_CHARS = 12_000
EARLIER_SUMMARY_MAX = 800
FACT_ITEM_MAX = 100
FACT_LIST_MAX = 20
OPEN_ISSUES_MAX = 10
TAG_MAX = 40
RECENT_ENTRIES_FOR_CONTEXT = 5

RESOLVED_OUTCOMES = {"resolved_by_agent", "resolved_by_bot"}
FACT_LIST_KEYS = ("interests", "products", "preferences")

ENTRY_PROMPT = (
    "You maintain a short CRM profile of one customer. You are given what is "
    "already known and the transcript of the conversation that just ended. "
    "Reply with ONE JSON object and nothing else:\n"
    '{"summary": string, "tags": [string], "outcome": string, "facts": '
    '{"interests": [string], "products": [string], "preferences": [string], '
    '"openIssues": [{"text": string, "since": string|null, "incidentId": string|null, '
    '"ticketRef": string|null}], "language": string|null}}\n'
    "Rules:\n"
    f"- summary: at most {PROFILE_ENTRY_SUMMARY_MAX} characters, plain text: what the "
    "customer asked and what happened. No greetings.\n"
    f"- tags: up to {PROFILE_MAX_TAGS} short lowercase topic words.\n"
    "- outcome: one of answered, unresolved, follow_up_ticket, info.\n"
    "- facts: the FULL updated standing facts. Keep earlier facts that are still "
    "true, add new ones, drop ones the customer corrected. Products means "
    "products, equipment or sites the customer mentioned.\n"
    "- openIssues: problems still unsolved. Keep incidentId and ticketRef exactly "
    "as given.\n"
    "- Placeholders like [email], [phone] and [secure] stand for hidden data. "
    "Never try to guess or restore them, and never write contact details.\n"
    "No markdown, no code fences, no explanation."
)

COMPRESS_PROMPT = (
    "Summarise these older CRM history items about one customer into one "
    f"paragraph of at most {EARLIER_SUMMARY_MAX} characters. Keep dates, topics and "
    "every ticket reference (like SR...). Plain text only, no lists, no markdown."
)


class ProfileMergeError(Exception):
    """The model output could not be turned into a valid profile."""


class _LLMOpenIssue(BaseModel):
    model_config = ConfigDict(extra="ignore")
    text: Optional[str] = None
    since: Optional[str] = None
    incidentId: Optional[str] = None
    ticketRef: Optional[str] = None


class _LLMFacts(BaseModel):
    model_config = ConfigDict(extra="ignore")
    interests: list = Field(default_factory=list)
    products: list = Field(default_factory=list)
    preferences: list = Field(default_factory=list)
    openIssues: list[_LLMOpenIssue] = Field(default_factory=list)
    language: Optional[str] = None


class _LLMEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    summary: Optional[str] = None
    tags: list = Field(default_factory=list)
    outcome: Optional[str] = None
    facts: Optional[_LLMFacts] = None


# --------------------------------------------------------------- helpers
def parse_json_object(raw: str) -> dict:
    text = (raw or "").strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        text = fenced.group(1).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise ProfileMergeError("no JSON object in model output")
    try:
        data = json.loads(text[start : end + 1])
    except json.JSONDecodeError as exc:
        raise ProfileMergeError(f"invalid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ProfileMergeError("model output is not a JSON object")
    return data


def profile_size(profile: VisitorProfile) -> int:
    """Characters of the stored JSON (compact, like the backend's JSON.stringify)."""
    return len(
        json.dumps(
            profile.model_dump(by_alias=True, exclude_none=True),
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )


def _clean(text: Optional[str], limit: int) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()[:limit]


def _uniq(items: Iterable, limit_each: int, limit_count: int) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for item in items or []:
        if not isinstance(item, str):
            continue
        v = _clean(item, limit_each)
        k = v.lower()
        if v and k not in seen:
            seen.add(k)
            out.append(v)
        if len(out) >= limit_count:
            break
    return out


def _zone(name: str):
    if ZoneInfo is None:
        return timezone.utc
    try:
        return ZoneInfo(name)
    except Exception:  # noqa: BLE001 - unknown zone: UTC (R22.2 default)
        return timezone.utc


def entry_timestamp(ended_at: Optional[str], tz_name: str) -> tuple[str, str]:
    """ISO time in the org zone, and the zone name actually used (R18.3, R22)."""
    zone = _zone(tz_name or "UTC")
    zone_name = tz_name if zone is not timezone.utc or tz_name in ("UTC", "Etc/UTC") else "UTC"
    when = None
    if ended_at:
        try:
            when = datetime.fromisoformat(ended_at.replace("Z", "+00:00"))
        except ValueError:
            when = None
    if when is None:
        when = datetime.now(timezone.utc)
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return when.astimezone(zone).isoformat(timespec="seconds"), zone_name


def _sort_key(entry: ProfileEntry) -> float:
    try:
        return datetime.fromisoformat(entry.at.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return 0.0


def _transcript(request: ProfileMergeRequest) -> str:
    lines = [f"{c.role}: {_clean(c.text, 1000)}" for c in request.chats if c.text.strip()]
    text = "\n".join(lines)
    # Keep the end of a long chat: that is where it was resolved.
    return text[-TRANSCRIPT_MAX_CHARS:]


def apply_overrides(facts: ProfileFacts, overrides: dict) -> ProfileFacts:
    """Admin corrections win over the model (R18.12)."""
    data = facts.model_dump()
    for key, value in (overrides or {}).items():
        if not isinstance(key, str) or not key.startswith("facts."):
            continue
        name = key[len("facts."):]
        if name in FACT_LIST_KEYS and isinstance(value, list):
            data[name] = _uniq(value, FACT_ITEM_MAX, FACT_LIST_MAX)
        elif name == "language" and (value is None or isinstance(value, str)):
            data[name] = value
    return ProfileFacts.model_validate(data)


def _refs(entries: Iterable[ProfileEntry]) -> tuple[list[str], list[str]]:
    tickets, ids = [], []
    for e in entries:
        if e.ticketRef and e.ticketRef not in tickets:
            tickets.append(e.ticketRef)
        if e.incidentId and e.incidentId not in ids:
            ids.append(e.incidentId)
    return tickets, ids


def deterministic_earlier_summary(entries: list[ProfileEntry], previous: Optional[ProfileEarlier]) -> str:
    parts = []
    if previous and previous.summary:
        parts.append(previous.summary)
    for e in sorted(entries, key=_sort_key):
        ref = f" ({e.ticketRef})" if e.ticketRef else ""
        parts.append(f"{e.at[:10]}: {_clean(e.summary, 120)}{ref}")
    return _clean(" ".join(parts), EARLIER_SUMMARY_MAX)


# --------------------------------------------------------------- service
class ProfileMergeService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._provider = provider
        self._tokens = 0

    @property
    def provider(self) -> LLMProvider:
        if self._provider is None:
            self._provider = get_llm_provider()
        return self._provider

    def merge(self, request: ProfileMergeRequest) -> ProfileMergeResponse:
        self._tokens = 0
        previous = request.profile or VisitorProfile()

        # Idempotent: a re-run after a crash between the profile write and the
        # chat purge must not add a second entry.
        if request.conversation_id and any(
            e.conversationId == request.conversation_id for e in previous.entries
        ):
            return self._response(previous)

        llm = self._ask_entry(request, previous)
        entry = self._build_entry(request, llm)
        facts = self._merge_facts(previous, llm, entry, request)

        entries = sorted([entry, *previous.entries], key=_sort_key, reverse=True)
        profile = VisitorProfile(
            facts=facts,
            adminOverrides=dict(previous.adminOverrides or {}),
            entries=entries,
            earlier=previous.earlier,
        )
        profile = self._fit(profile, keep_id=request.conversation_id, force=request.compress)
        return self._response(profile)

    # ---------------------------------------------------------------- steps
    def _ask_entry(self, request: ProfileMergeRequest, previous: VisitorProfile) -> _LLMEntry:
        context = {
            "known_facts": previous.facts.model_dump(exclude_none=True),
            "recent_history": [
                {"at": e.at, "summary": e.summary, "outcome": e.outcome, "ticketRef": e.ticketRef}
                for e in previous.entries[:RECENT_ENTRIES_FOR_CONTEXT]
            ],
            "bot": request.bot,
            "channel": request.channel,
            "incident": request.incident.model_dump(exclude_none=True) if request.incident else None,
        }
        messages = [
            {"role": "system", "content": ENTRY_PROMPT},
            {
                "role": "user",
                "content": "CONTEXT:\n"
                + json.dumps(context, ensure_ascii=False)
                + "\n\nTRANSCRIPT:\n"
                + (_transcript(request) or "(no messages)"),
            },
        ]
        provider = self.provider
        with span("profile_merge", provider=getattr(provider, "name", None), chats=len(request.chats)) as sp:
            result = provider.generate(messages)
            self._tokens += int(getattr(result, "tokens_used", 0) or 0)
            sp.record_tokens(
                prompt=getattr(result, "prompt_tokens", 0),
                completion=getattr(result, "completion_tokens", 0),
                total=getattr(result, "tokens_used", 0),
                model=getattr(result, "model", None),
            )
            try:
                parsed = _LLMEntry.model_validate(parse_json_object(result.text))
            except ValidationError as exc:
                raise ProfileMergeError(f"model output has the wrong shape: {exc}") from exc
        if not _clean(parsed.summary, PROFILE_ENTRY_SUMMARY_MAX):
            raise ProfileMergeError("model returned an empty summary")
        return parsed

    def _build_entry(self, request: ProfileMergeRequest, llm: _LLMEntry) -> ProfileEntry:
        at, tz = entry_timestamp(request.ended_at, request.org_tz)
        inc = request.incident
        outcome = (inc.outcome if inc and inc.outcome else None) or _clean(llm.outcome, 40).lower() or "answered"
        return ProfileEntry(
            conversationId=request.conversation_id,
            at=at,
            tz=tz,
            bot=_clean(request.bot, 100) or None,
            channel=request.channel,
            summary=_clean(llm.summary, PROFILE_ENTRY_SUMMARY_MAX),
            tags=[t.lower() for t in _uniq(llm.tags, TAG_MAX, PROFILE_MAX_TAGS)],
            outcome=outcome,
            incidentId=inc.id if inc else None,
            ticketRef=inc.ticketRef if inc else None,
            agent=_clean(inc.agent, 100) or None if inc else None,
            problem=_clean(inc.problem, 300) or None if inc else None,
            resolution=_clean(inc.resolution, 500) or None if inc else None,
            ai=True,
        )

    def _merge_facts(
        self,
        previous: VisitorProfile,
        llm: _LLMEntry,
        entry: ProfileEntry,
        request: ProfileMergeRequest,
    ) -> ProfileFacts:
        new = llm.facts or _LLMFacts()
        resolved_here = entry.outcome in RESOLVED_OUTCOMES

        def resolves(issue) -> bool:
            if not resolved_here:
                return False
            return bool(
                (entry.ticketRef and issue.ticketRef == entry.ticketRef)
                or (entry.incidentId and issue.incidentId == entry.incidentId)
            )

        issues: list[ProfileOpenIssue] = []
        seen: set[str] = set()

        def add(issue) -> None:
            text = _clean(issue.text, 300)
            if not text or resolves(issue):
                return
            key = issue.ticketRef or issue.incidentId or text.lower()
            if key in seen:
                return
            seen.add(key)
            issues.append(
                ProfileOpenIssue(text=text, since=issue.since, incidentId=issue.incidentId, ticketRef=issue.ticketRef)
            )

        for issue in new.openIssues:
            add(issue)
        # An issue tied to an incident is only dropped when that incident is
        # resolved, never because the model forgot it.
        for issue in previous.facts.openIssues:
            if issue.incidentId or issue.ticketRef:
                add(issue)
        # The incident of this conversation is still open after a non-resolving close.
        inc = request.incident
        if inc and inc.problem and not resolved_here and entry.outcome in ("closed_unresolved", "abandoned", "follow_up_ticket"):
            add(ProfileOpenIssue(text=inc.problem, since=entry.at[:10], incidentId=inc.id, ticketRef=inc.ticketRef))

        facts = ProfileFacts(
            interests=_uniq(new.interests, FACT_ITEM_MAX, FACT_LIST_MAX),
            products=_uniq(new.products, FACT_ITEM_MAX, FACT_LIST_MAX),
            preferences=_uniq(new.preferences, FACT_ITEM_MAX, FACT_LIST_MAX),
            openIssues=issues[:OPEN_ISSUES_MAX],
            language=_clean(new.language, 20) or previous.facts.language,
        )
        return apply_overrides(facts, previous.adminOverrides)

    def _fit(self, profile: VisitorProfile, keep_id: Optional[str], force: bool) -> VisitorProfile:
        """Fold the oldest entries into ``earlier`` until the profile fits (R18.9)."""
        rounds = 0
        while (force or profile_size(profile) > TARGET_CHARS) and rounds < 8:
            rounds += 1
            force = False
            # Never fold the entry for this conversation.
            candidates = [e for e in profile.entries if e.conversationId is None or e.conversationId != keep_id]
            if len(profile.entries) <= 1 or not candidates:
                break
            n = max(1, len(candidates) // 2)
            fold = sorted(candidates, key=_sort_key)[:n]
            fold_ids = {id(e) for e in fold}
            keep = [e for e in profile.entries if id(e) not in fold_ids]
            profile = VisitorProfile(
                facts=profile.facts,
                adminOverrides=profile.adminOverrides,
                entries=keep,
                earlier=self._fold(profile.earlier, fold),
            )
        if profile_size(profile) > TARGET_CHARS:
            profile = self._trim(profile)
        if profile_size(profile) > PROFILE_MAX_CHARS:
            raise ProfileMergeError("profile does not fit in the size limit")
        return profile

    def _fold(self, earlier: Optional[ProfileEarlier], entries: list[ProfileEntry]) -> ProfileEarlier:
        tickets, ids = _refs(entries)
        prev_tickets = list(earlier.incidentRefs) if earlier else []
        prev_ids = list(earlier.incidentIds) if earlier else []
        dates = sorted([e.at for e in entries] + ([earlier.from_] if earlier and earlier.from_ else []) + ([earlier.to] if earlier and earlier.to else []))
        summary = self._summarise_old(entries, earlier)
        return ProfileEarlier(
            from_=dates[0] if dates else None,
            to=dates[-1] if dates else None,
            summary=summary,
            count=(earlier.count if earlier else 0) + len(entries),
            incidentRefs=list(dict.fromkeys(prev_tickets + tickets)),
            incidentIds=list(dict.fromkeys(prev_ids + ids)),
        )

    def _summarise_old(self, entries: list[ProfileEntry], earlier: Optional[ProfileEarlier]) -> str:
        items = [f"{e.at[:10]}: {e.summary}" + (f" ({e.ticketRef})" if e.ticketRef else "") for e in sorted(entries, key=_sort_key)]
        if earlier and earlier.summary:
            items.insert(0, f"Before: {earlier.summary}")
        try:
            result = self.provider.generate(
                [
                    {"role": "system", "content": COMPRESS_PROMPT},
                    {"role": "user", "content": "\n".join(items)[:TRANSCRIPT_MAX_CHARS]},
                ]
            )
            self._tokens += int(getattr(result, "tokens_used", 0) or 0)
            text = _clean(result.text, EARLIER_SUMMARY_MAX)
            if text:
                return text
        except Exception as exc:  # noqa: BLE001 - compression must not fail the merge
            logger.warning("[PROFILE] compression summary failed, using a fixed summary: %s", exc)
        return deterministic_earlier_summary(entries, earlier)

    def _trim(self, profile: VisitorProfile) -> VisitorProfile:
        """Last resort when entries alone cannot be folded further."""
        facts = profile.facts.model_copy(
            update={
                "interests": profile.facts.interests[:5],
                "products": profile.facts.products[:5],
                "preferences": profile.facts.preferences[:5],
                "openIssues": profile.facts.openIssues[:5],
            }
        )
        facts = apply_overrides(facts, profile.adminOverrides)
        earlier = profile.earlier
        if earlier:
            earlier = earlier.model_copy(update={"summary": _clean(earlier.summary, 300)})
        return VisitorProfile(facts=facts, adminOverrides=profile.adminOverrides, entries=profile.entries, earlier=earlier)

    def _response(self, profile: VisitorProfile) -> ProfileMergeResponse:
        provider = self._provider
        return ProfileMergeResponse(
            profile=profile,
            tokens_used=self._tokens,
            provider=getattr(provider, "name", None) or "none",
            model=getattr(provider, "model", None) or "none",
        )
