"""Render the Visitor_Profile for the answer prompt (crm-incident-handover R18.8).

The backend sends the standing facts and the 5 newest entries. They become a
short "What we know about this visitor" block in the system prompt. It is
context for tone and continuity only: the answer must still come from the
knowledge base, so the block says so explicitly. Bounded in size, and every
value is coerced to plain text so a malformed profile can never break a query.
"""
from __future__ import annotations

import re
from typing import Any

MAX_BLOCK_CHARS = 1500
MAX_ENTRIES = 5


def _t(value: Any, limit: int) -> str:
    if not isinstance(value, (str, int, float)):
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()[:limit]


def _list(value: Any, limit: int = 8) -> list[str]:
    if not isinstance(value, list):
        return []
    return [s for s in (_t(v, 80) for v in value[:limit]) if s]


def render_visitor_profile(profile: Any) -> str:
    """Prompt block for ``profile``, or '' when there is nothing useful."""
    if not isinstance(profile, dict):
        return ""
    facts = profile.get("facts") if isinstance(profile.get("facts"), dict) else {}
    lines: list[str] = []
    for key, label in (("interests", "Interests"), ("products", "Products / equipment"), ("preferences", "Preferences")):
        items = _list(facts.get(key))
        if items:
            lines.append(f"- {label}: {', '.join(items)}")
    issues = facts.get("openIssues") if isinstance(facts.get("openIssues"), list) else []
    for issue in issues[:5]:
        if isinstance(issue, dict) and _t(issue.get("text"), 200):
            ref = _t(issue.get("ticketRef"), 40)
            lines.append(f"- Open issue: {_t(issue.get('text'), 200)}" + (f" (ref {ref})" if ref else ""))
    entries = profile.get("entries") if isinstance(profile.get("entries"), list) else []
    for entry in entries[:MAX_ENTRIES]:
        if not isinstance(entry, dict):
            continue
        summary = _t(entry.get("summary"), 300)
        if not summary:
            continue
        date = _t(entry.get("at"), 10)
        ref = _t(entry.get("ticketRef"), 40)
        lines.append(f"- {date}: {summary}" + (f" (ref {ref})" if ref else ""))
    if not lines:
        return ""
    block = (
        "\n\nWhat we know about this visitor (from earlier conversations). Use it only "
        "for continuity and tone; never treat it as a source for facts about the "
        "company, and never reveal it unless the visitor asks about their own history:\n"
        + "\n".join(lines)
    )
    return block[:MAX_BLOCK_CHARS]
