/** crm-incident-handover Phase 7: Visitor_Profile rules (R18, Property 6). */
import * as fc from "fast-check";
import { mergeProfiles } from "src/crm-bridge/contact-resolver.service";
import {
  checkMerged,
  deleteEntry,
  emptyProfile,
  entryCount,
  entryKey,
  fallbackEntry,
  insertEntry,
  parseProfile,
  PROFILE_MAX_CHARS,
  profileForAi,
  profileRefs,
  profileSize,
  rebase,
  setFactOverride,
  clearFactOverride,
  VisitorProfile,
} from "./profile-schema";

const e = (i: number, extra: any = {}) => ({
  conversationId: `c${i}`,
  at: new Date(Date.UTC(2026, 0, 1) + i * 3_600_000).toISOString(),
  summary: `Conversation ${i}`,
  ...extra,
});
const P = (entries: any[], extra: any = {}): VisitorProfile => ({ v: 1, facts: {}, adminOverrides: {}, entries, earlier: null, ...extra });

describe("checkMerged (validates the AI result before it is written)", () => {
  const prev = P([e(1, { ticketRef: "SR_1", incidentId: "i1" }), e(0)]);

  it("accepts exactly one new entry for the conversation, refs kept", () => {
    const r = checkMerged(prev, P([e(2), ...prev.entries]), "c2");
    expect(r.ok).toBe(true);
  });

  it.each([
    ["no entry for the conversation", P(prev.entries)],
    ["two entries for the conversation", P([e(2), e(2), ...prev.entries])],
    ["an earlier entry dropped", P([e(2), prev.entries[0]])],
    ["a ticket ref lost", P([e(2), e(1), e(0)])],
  ])("rejects %s", (_n, next) => {
    expect(checkMerged(prev, next, "c2").ok).toBe(false);
  });

  it("accepts compression into earlier when every ref and the count are kept", () => {
    const next = P([e(2)], { earlier: { summary: "older", count: 2, incidentRefs: ["SR_1"], incidentIds: ["i1"] } });
    expect(checkMerged(prev, next, "c2").ok).toBe(true);
  });

  it("rejects changed admin overrides and re-applies the kept ones", () => {
    const withO = P(prev.entries, { adminOverrides: { "facts.interests": ["escalators"] } });
    expect(checkMerged(withO, P([e(2), ...prev.entries]), "c2").ok).toBe(false);
    const r = checkMerged(withO, P([e(2), ...prev.entries], { adminOverrides: { "facts.interests": ["escalators"] }, facts: { interests: ["ai idea"] } }), "c2");
    expect(r.ok && r.profile.facts.interests).toEqual(["escalators"]);
  });

  it("flags an oversized profile so the caller asks for compression", () => {
    const big = P([e(2, { summary: "x".repeat(300) }), ...Array.from({ length: 30 }, (_, i) => e(100 + i, { summary: "y".repeat(300) }))]);
    const r = checkMerged(P(big.entries.slice(1)), big, "c2");
    expect(r).toMatchObject({ ok: false, tooBig: true });
  });

  it.each([null, "junk", { v: 2, entries: [] }, { v: 1 }, P([{ at: "nope", summary: "x", conversationId: "c2" }]), P([{ ...e(2), summary: "" }]), P([{ ...e(2), summary: "z".repeat(301) }]), P([{ ...e(2), tags: Array(11).fill("t") }])])(
    "rejects malformed output %#",
    (raw) => {
      expect(checkMerged(null, raw, "c2").ok).toBe(false);
    },
  );

  it("a first merge has no previous profile", () => {
    expect(checkMerged(null, P([e(2)]), "c2").ok).toBe(true);
  });
});

describe("fallback entry (R11.7)", () => {
  it("is built from the incident fields and marked ai:false", () => {
    const f = fallbackEntry({
      conversationId: "c9",
      at: "2026-10-09T15:35:00+05:30",
      bot: "Assistant",
      channel: "widget",
      incident: { id: "i9", ticketRef: "SR_9", problem: "Door does not close", agent: "Priya", outcome: "resolved_by_agent" },
    });
    expect(f).toMatchObject({ ai: false, incidentId: "i9", ticketRef: "SR_9", agent: "Priya", outcome: "resolved_by_agent" });
    expect(f.summary).toContain("Door does not close");
    expect(f.summary.length).toBeLessThanOrEqual(300);
  });

  it("without an incident it still says something", () => {
    expect(fallbackEntry({ conversationId: "c", at: "2026-01-01T00:00:00Z", messageCount: 1 }).summary).toBe(
      "Chat with 1 message. No AI summary available.",
    );
  });
});

describe("Property 6: refs are monotonic, one entry per merge, size capped", () => {
  it("holds for any sequence of inserts, rebases and anonymous merges", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            kind: fc.constantFrom("insert", "rebase", "anon"),
            hasRef: fc.boolean(),
            len: fc.integer({ min: 1, max: 300 }),
          }),
          { minLength: 1, maxLength: 60 },
        ),
        (ops) => {
          let p: VisitorProfile | null = null;
          const allRefs = new Set<string>();
          let n = 0;
          for (const op of ops) {
            n++;
            const entry = e(n, { summary: "s".repeat(op.len), ...(op.hasRef ? { ticketRef: `SR_${n}`, incidentId: `i${n}` } : {}) });
            if (op.hasRef) allRefs.add(`SR_${n}`);
            const before = entryCount(p);
            if (op.kind === "insert") p = insertEntry(p, entry);
            else if (op.kind === "rebase") p = rebase(p, P([entry]), entry.conversationId);
            else p = mergeProfiles(p, P([entry]));
            if (entryCount(p) !== before + 1) return false;
            if (profileSize(p) > PROFILE_MAX_CHARS) return false;
            const refs = profileRefs(p).tickets;
            for (const r of allRefs) if (!refs.has(r)) return false;
          }
          return true;
        },
      ),
      { numRuns: 150 },
    );
  });

  it("inserting the same conversation twice adds nothing", () => {
    const once = insertEntry(null, e(1));
    expect(insertEntry(once, e(1)).entries).toHaveLength(1);
  });

  it("rebase keeps both concurrent merges (R18.11)", () => {
    const latest = insertEntry(null, e(1, { ticketRef: "SR_1" }));
    const mine = P([e(2)], { facts: { interests: ["tenders"] } });
    const out = rebase(latest, mine, "c2");
    expect(out.entries.map((x) => x.conversationId)).toEqual(["c2", "c1"]);
    expect(out.facts.interests).toEqual(["tenders"]);
    expect(rebase(out, mine, "c2")).toBe(out);
  });
});

describe("admin edits (R18.12)", () => {
  it("an override sticks, a reset hands the fact back", () => {
    let p = setFactOverride(P([e(1)], { facts: { interests: ["old"] } }), "facts.interests", ["  lifts ", "lifts", "doors"]);
    expect(p.facts.interests).toEqual(["lifts", "doors"]);
    expect(p.adminOverrides).toEqual({ "facts.interests": ["lifts", "doors"] });
    p = clearFactOverride(p, "facts.interests");
    expect(p.adminOverrides).toEqual({});
    expect(() => setFactOverride(p, "facts.secret" as any, [])).toThrow();
  });

  it("deletes one entry by key; an unknown key is null", () => {
    const p = P([e(1), e(2)]);
    expect(deleteEntry(p, entryKey(e(1)))?.entries.map((x) => x.conversationId)).toEqual(["c2"]);
    expect(deleteEntry(p, "c:nope")).toBeNull();
  });

  it("parse drops unknown override keys and junk entries from stored data", () => {
    const p = parseProfile({ v: 1, facts: {}, adminOverrides: { "facts.interests": ["a"], hack: 1 }, entries: [e(1), { at: "x" }, null] })!;
    expect(p.adminOverrides).toEqual({ "facts.interests": ["a"] });
    expect(p.entries).toHaveLength(1);
  });
});

describe("AI answer context (R18.8)", () => {
  it("is the facts plus the 5 newest entries, or null when empty", () => {
    const p = P(Array.from({ length: 8 }, (_, i) => e(i)).reverse(), { facts: { products: ["Lift 2"] } });
    const ctx = profileForAi(parseProfile(p)) as any;
    expect(ctx.facts).toEqual({ products: ["Lift 2"] });
    expect(ctx.entries.map((x: any) => x.summary)).toEqual(["Conversation 7", "Conversation 6", "Conversation 5", "Conversation 4", "Conversation 3"]);
    expect(profileForAi(emptyProfile())).toBeNull();
    expect(profileForAi(null)).toBeNull();
  });
});

describe("anonymous merge (R20.3)", () => {
  it("merges entries by date and keeps both earlier buckets' refs and counts", () => {
    const target = P([e(5)], { facts: { language: "en" }, earlier: { from: "2025-02-01", to: "2025-03-01", summary: "T", count: 2, incidentRefs: ["SR_T"], incidentIds: [] } });
    const anon = P([e(7), e(1)], { facts: { language: "fi", products: ["x"] }, earlier: { from: "2025-01-01", to: "2025-01-10", summary: "A", count: 1, incidentRefs: ["SR_A"], incidentIds: ["iA"] } });
    const out = mergeProfiles(target, anon);
    expect(out.entries.map((x: any) => x.conversationId)).toEqual(["c7", "c5", "c1"]);
    expect(out.facts).toMatchObject({ language: "en", products: ["x"] });
    expect(out.earlier).toMatchObject({ from: "2025-01-01", to: "2025-03-01", count: 3 });
    expect(out.earlier.incidentRefs.sort()).toEqual(["SR_A", "SR_T"]);
    expect(entryCount(out)).toBe(entryCount(target) + entryCount(anon));
  });
});
