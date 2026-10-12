"""POST /profile/merge (crm-incident-handover task 7.1) with a stub provider.

Covers the invariants the backend relies on: exactly one entry per merge,
every earlier incident ref kept, admin overrides kept, incident fields copied
verbatim, the 8000-character cap with compression into ``earlier``, the
idempotent re-run, and the contract (field names the backend validates).
"""
import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import app.services.profile_merge as pm
from app.main import app
from app.schemas import PROFILE_MAX_CHARS, VisitorProfile
from app.services.profile_merge import ProfileMergeService, profile_size
from app.services.visitor_context import render_visitor_profile

client = TestClient(app)

GOOD = {
    "summary": "Asked why lift 2 stops between floors; told a technician visit is booked.",
    "tags": ["Lift", "maintenance", "lift"],
    "outcome": "answered",
    "facts": {
        "interests": ["maintenance"],
        "products": ["Lift 2, Building A"],
        "preferences": ["email updates"],
        "openIssues": [],
        "language": "en",
    },
}


class _Provider:
    name = "stub"
    model = "stub-model"
    temperature = 0.0
    max_tokens = 100

    def __init__(self, replies=None, error=None):
        self.replies = list(replies or [json.dumps(GOOD)])
        self.error = error
        self.calls = []

    def generate(self, messages):
        self.calls.append(messages)
        if self.error:
            raise self.error
        text = self.replies.pop(0) if len(self.replies) > 1 else self.replies[0]
        return SimpleNamespace(text=text, tokens_used=10, prompt_tokens=8, completion_tokens=2,
                               model="stub-model", provider="stub", finish_reason="stop")


@pytest.fixture
def stub(monkeypatch):
    def install(**kwargs):
        provider = _Provider(**kwargs)
        monkeypatch.setattr(pm, "get_llm_provider", lambda: provider)
        return provider
    return install


def entry(i, ref=None, inc=None, summary=None):
    return {
        "conversationId": f"c{i}",
        "at": f"2026-0{1 + i % 9}-{10 + i % 18:02d}T10:00:00+05:30",
        "summary": summary or f"Visit {i} about tenders and quotes.",
        "tags": ["tender"],
        "outcome": "answered",
        "ticketRef": ref,
        "incidentId": inc,
    }


def body(**kw):
    base = {"chats": [{"role": "visitor", "text": "Lift 2 stops between floors", "at": "2026-10-09T10:00:00Z"},
                      {"role": "bot", "text": "A technician visit is booked.", "at": "2026-10-09T10:01:00Z"}],
            "org_tz": "Asia/Kolkata", "bot": "Assistant", "channel": "widget",
            "conversation_id": "conv-new", "ended_at": "2026-10-09T10:05:00Z"}
    base.update(kw)
    return base


def post(**kw):
    return client.post("/profile/merge", json=body(**kw))


def test_first_merge_creates_a_profile_with_one_entry(stub):
    stub()
    r = post()
    assert r.status_code == 200, r.text
    p = r.json()["profile"]
    assert p["v"] == 1
    assert len(p["entries"]) == 1
    e = p["entries"][0]
    assert e["conversationId"] == "conv-new"
    # Org time zone (R18.3, R22): 10:05Z is 15:35 in Kolkata.
    assert e["at"] == "2026-10-09T15:35:00+05:30" and e["tz"] == "Asia/Kolkata"
    assert e["bot"] == "Assistant" and e["channel"] == "widget"
    assert e["tags"] == ["lift", "maintenance"]
    assert e["ai"] is True
    assert p["facts"]["products"] == ["Lift 2, Building A"]


def test_appends_exactly_one_entry_and_keeps_every_earlier_entry(stub):
    stub()
    prev = {"v": 1, "facts": {}, "entries": [entry(1, "SR_1"), entry(2)], "earlier": None}
    p = post(profile=prev).json()["profile"]
    assert len(p["entries"]) == 3
    assert [e["conversationId"] for e in p["entries"]][0] == "conv-new"  # newest first
    assert {e["conversationId"] for e in p["entries"]} == {"conv-new", "c1", "c2"}
    old = next(e for e in p["entries"] if e["conversationId"] == "c1")
    assert old["at"] == prev["entries"][0]["at"] and old["ticketRef"] == "SR_1"


def test_incident_fields_are_copied_not_generated(stub):
    stub()
    inc = {"id": "inc1", "ticketRef": "SR_ABC", "problem": "Door does not close",
           "resolution": "Reset the door operator", "agent": "Priya", "outcome": "resolved_by_agent",
           "status": "resolved"}
    prev = {"v": 1, "facts": {"openIssues": [{"text": "Door", "incidentId": "inc1", "ticketRef": "SR_ABC"}]},
            "entries": []}
    p = post(profile=prev, incident=inc).json()["profile"]
    e = p["entries"][0]
    assert (e["incidentId"], e["ticketRef"], e["agent"], e["problem"], e["resolution"], e["outcome"]) == (
        "inc1", "SR_ABC", "Priya", "Door does not close", "Reset the door operator", "resolved_by_agent")
    # Resolved here: its open issue goes away.
    assert p["facts"].get("openIssues", []) == []


def test_open_issue_with_a_ref_is_never_dropped_by_the_model(stub):
    stub()  # the model returns no open issues
    prev = {"v": 1, "facts": {"openIssues": [{"text": "Invoice dispute", "ticketRef": "SR_OLD"}]}, "entries": []}
    p = post(profile=prev).json()["profile"]
    assert [i["ticketRef"] for i in p["facts"]["openIssues"]] == ["SR_OLD"]


def test_admin_overrides_win_over_the_model(stub):
    stub()
    prev = {"v": 1, "facts": {"interests": ["old"]}, "entries": [],
            "adminOverrides": {"facts.interests": ["escalators"], "facts.language": "fi"}}
    p = post(profile=prev).json()["profile"]
    assert p["facts"]["interests"] == ["escalators"]
    assert p["facts"]["language"] == "fi"
    assert p["adminOverrides"] == prev["adminOverrides"]


def test_same_conversation_twice_is_a_no_op(stub):
    provider = stub()
    prev = {"v": 1, "facts": {}, "entries": [dict(entry(1), conversationId="conv-new")]}
    r = post(profile=prev)
    assert r.status_code == 200
    assert len(r.json()["profile"]["entries"]) == 1
    assert provider.calls == []


def test_compresses_oldest_entries_into_earlier_and_keeps_every_ref(stub):
    stub(replies=[json.dumps(GOOD), "Older visits about tenders; refs SR_0 SR_5."])
    long = "x" * 280
    entries = [entry(i, ref=f"SR_{i}" if i % 5 == 0 else None, inc=f"inc{i}" if i % 5 == 0 else None, summary=long)
               for i in range(40)]
    prev = {"v": 1, "facts": {}, "entries": entries,
            "earlier": {"from": "2025-01-01", "to": "2025-06-01", "summary": "Older stuff", "count": 3,
                        "incidentRefs": ["SR_ANCIENT"], "incidentIds": ["incA"]}}
    r = post(profile=prev)
    assert r.status_code == 200, r.text
    p = r.json()["profile"]
    assert profile_size(VisitorProfile.model_validate(p)) <= PROFILE_MAX_CHARS
    kept_refs = {e.get("ticketRef") for e in p["entries"]} | set(p["earlier"]["incidentRefs"])
    kept_ids = {e.get("incidentId") for e in p["entries"]} | set(p["earlier"]["incidentIds"])
    for i in range(0, 40, 5):
        assert f"SR_{i}" in kept_refs and f"inc{i}" in kept_ids
    assert "SR_ANCIENT" in kept_refs and "incA" in kept_ids
    assert p["entries"][0]["conversationId"] == "conv-new"
    assert p["earlier"]["count"] == 3 + (41 - len(p["entries"]))
    assert p["earlier"]["from"] == "2025-01-01"


def test_compression_summary_falls_back_when_the_model_fails(stub, monkeypatch):
    stub()
    svc = ProfileMergeService()
    calls = {"n": 0}
    real = svc.provider.generate

    def flaky(messages):
        calls["n"] += 1
        if calls["n"] > 1:
            raise RuntimeError("down")
        return real(messages)

    monkeypatch.setattr(svc.provider, "generate", flaky)
    from app.schemas import ProfileMergeRequest
    prev = {"v": 1, "facts": {}, "entries": [entry(i, ref=f"SR_{i}", summary="y" * 290) for i in range(30)]}
    res = svc.merge(ProfileMergeRequest(**body(profile=prev)))
    assert res.profile.earlier and res.profile.earlier.summary
    assert profile_size(res.profile) <= PROFILE_MAX_CHARS
    assert set(res.profile.earlier.incidentRefs) | {e.ticketRef for e in res.profile.entries} >= {f"SR_{i}" for i in range(30)}


def test_compress_flag_folds_even_a_small_profile(stub):
    stub(replies=[json.dumps(GOOD), "Earlier visits."])
    prev = {"v": 1, "facts": {}, "entries": [entry(i, ref=f"SR_{i}") for i in range(4)]}
    p = post(profile=prev, compress=True).json()["profile"]
    assert p["earlier"] and p["earlier"]["count"] >= 1
    assert len(p["entries"]) < 5


@pytest.mark.parametrize("reply", ["not json", json.dumps({"summary": "", "facts": {}}), json.dumps(["x"])])
def test_bad_model_output_is_a_502_so_the_backend_retries(stub, reply):
    stub(replies=[reply])
    assert post().status_code == 502


def test_provider_error_is_a_502(stub):
    stub(error=RuntimeError("timeout"))
    assert post().status_code == 502


def test_summary_and_tags_are_bounded(stub):
    stub(replies=[json.dumps({**GOOD, "summary": "z" * 900, "tags": [f"t{i}" for i in range(30)]})])
    e = post().json()["profile"]["entries"][0]
    assert len(e["summary"]) == 300 and len(e["tags"]) == 10


def test_unknown_time_zone_falls_back_to_utc(stub):
    stub()
    e = post(org_tz="Mars/Olympus").json()["profile"]["entries"][0]
    assert e["at"] == "2026-10-09T10:05:00+00:00" and e["tz"] == "UTC"


def test_chats_reach_the_model_masked_as_given(stub):
    provider = stub()
    post(chats=[{"role": "visitor", "text": "mail me at [email]"}])
    user = provider.calls[0][1]["content"]
    assert "[email]" in user and "visitor: mail me at [email]" in user


def test_request_validation(stub):
    stub()
    assert client.post("/profile/merge", json=body(chats=[{"role": "visitor", "text": "x" * 4001}])).status_code == 422


def test_contract_field_names(stub):
    """The backend's validator reads exactly these names (profile-schema.ts)."""
    stub()
    r = post(incident={"id": "i", "ticketRef": "SR_1", "outcome": "resolved_by_bot"}).json()
    assert set(r) >= {"profile", "tokens_used", "provider", "model"}
    p = r["profile"]
    assert set(p) <= {"v", "facts", "adminOverrides", "entries", "earlier"}
    assert set(p["entries"][0]) <= {"conversationId", "at", "tz", "bot", "channel", "summary", "tags", "outcome",
                                    "incidentId", "ticketRef", "agent", "problem", "resolution", "ai"}


# ------------------------------------------------------------ query context
def test_visitor_profile_block_is_bounded_and_tolerant():
    assert render_visitor_profile(None) == ""
    assert render_visitor_profile({"facts": "junk", "entries": "junk"}) == ""
    block = render_visitor_profile({
        "facts": {"interests": ["lifts"], "openIssues": [{"text": "Door", "ticketRef": "SR_9"}]},
        "entries": [{"at": "2026-10-01T10:00:00+05:30", "summary": "s" * 2000, "ticketRef": "SR_9"}] * 10,
    })
    assert "What we know about this visitor" in block
    assert "Interests: lifts" in block and "(ref SR_9)" in block
    assert len(block) <= 1500
