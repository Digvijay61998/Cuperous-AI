/**
 * crm-incident-handover tasks 7.2, 7.3, 7.9: ProfileService.merge against
 * in-memory Mongo + CRM fakes and a fake AI. Covers masking of the merge
 * input, validation, retries (30/60/120 s), the ai:false fallback, the
 * compress retry, idempotency, admin edits, and Property 6 under concurrent
 * merges of one contact.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import * as fc from "fast-check";
import { fakeCrm, fakeModel, fakeMongo, oid } from "./fakes.testspec";
import { entryCount, parseProfile, PROFILE_MAX_CHARS, profileRefs, profileSize } from "./profile-schema";
import { localIso, ProfileMergeFailed, ProfileService } from "./profile.service";

const ORG = "org1";
const CONTACT = "ct1";
const BOT = oid();
const VISITOR = oid();

/** The AI: appends one entry for the conversation, like the real service. */
function goodAi(opts: { delay?: () => number } = {}) {
  return {
    profileMerge: jest.fn(async (req: any) => {
      if (opts.delay) await new Promise((r) => setTimeout(r, opts.delay!()));
      const prev = req.profile ?? { v: 1, facts: {}, adminOverrides: {}, entries: [] };
      const entry = {
        conversationId: req.conversation_id,
        at: req.ended_at,
        summary: `Summary of ${req.conversation_id}`,
        outcome: req.incident?.outcome ?? "answered",
        ticketRef: req.incident?.ticketRef,
        incidentId: req.incident?.id,
        ai: true,
      };
      return { profile: { ...prev, entries: [entry, ...prev.entries] }, tokens_used: 1, provider: "stub", model: "m" };
    }),
  };
}

function setup(o: { ai?: any; contacts?: any[]; convs?: any[]; chats?: any[]; incidents?: any[]; org?: any } = {}) {
  const convId = oid();
  const convs = o.convs ?? [
    { _id: convId, bot: BOT, visitor: VISITOR, platform: "widget", crmContactId: CONTACT, endedAt: new Date("2026-10-09T10:05:00Z"), messageCount: 0 },
  ];
  const chats = fakeModel(
    o.chats ?? [
      { _id: oid(), conversationId: convId, sender: VISITOR, message: "Hi, I'm Raj, raj@example.com, +91 98765 43210", time: new Date("2026-10-09T10:00:00Z") },
      { _id: oid(), conversationId: convId, sender: BOT, message: "Thanks, noted.", time: new Date("2026-10-09T10:00:05Z") },
      { _id: oid(), conversationId: convId, sender: VISITOR, message: "ab****yz", secured: true, time: new Date("2026-10-09T10:00:10Z") },
    ],
  );
  const models = {
    Conversation: fakeModel(convs),
    Chat: chats,
    Incident: fakeModel(o.incidents ?? []),
    Organization: fakeModel([o.org ?? { _id: ORG, timeZone: "Asia/Kolkata" }]),
    Bot: fakeModel([{ _id: BOT, name: "Assistant" }]),
    Agent: fakeModel([]),
  };
  const crm = fakeCrm(o.contacts ?? [{ id: CONTACT, organizationId: ORG, profile: null }]);
  const ai = o.ai ?? goodAi();
  const svc = new ProfileService(crm as any, ai as any, { orgIdForBot: async () => ORG } as any, fakeMongo(models));
  const waits: number[] = [];
  svc.sleep = async (ms) => {
    waits.push(ms);
  };
  (svc as any).logger = { warn: () => undefined, log: () => undefined, error: () => undefined };
  return { svc, crm, ai, models, convId, waits };
}

describe("ProfileService.merge", () => {
  it("merges, bumps the version and writes one session_summary Activity", async () => {
    const h = setup();
    const out = await h.svc.merge(h.convId);
    expect(out).toMatchObject({ status: "merged", ai: true, contactId: CONTACT });
    const c = h.crm.rows[0];
    expect(c.profileVersion).toBe(1);
    expect(parseProfile(c.profile)!.entries.map((e) => e.conversationId)).toEqual([h.convId]);
    expect(h.crm.activities).toHaveLength(1);
    expect(h.crm.activities[0]).toMatchObject({ contactId: CONTACT, organizationId: ORG, meta: { kind: "session_summary", conversationId: h.convId, ai: true } });
  });

  it("sends only masked text to the AI (R11.5), secure answers as [secure]", async () => {
    const h = setup();
    await h.svc.merge(h.convId);
    const req = h.ai.profileMerge.mock.calls[0][0];
    const all = JSON.stringify(req);
    expect(all).not.toContain("raj@example.com");
    expect(all).not.toMatch(/98765\s?43210/);
    expect(all).not.toContain("ab****yz");
    expect(req.chats.map((c: any) => c.role)).toEqual(["visitor", "bot", "visitor"]);
    expect(req.chats[0].text).toContain("[email]");
    expect(req.chats[0].text).toContain("[phone]");
    expect(req.chats[2].text).toBe("[secure]");
    expect(req).toMatchObject({ org_tz: "Asia/Kolkata", bot: "Assistant", channel: "widget", conversation_id: h.convId });
  });

  it("property: no email or phone in any chat reaches the AI", async () => {
    await fc.assert(
      fc.asyncProperty(fc.emailAddress(), fc.stringMatching(/^\+?[1-9]\d{7,12}$/), fc.lorem(), async (email, phone, words) => {
        const convId = oid();
        const h = setup({
          convs: [{ _id: convId, bot: BOT, visitor: VISITOR, platform: "widget", crmContactId: CONTACT, endedAt: new Date() }],
          chats: [{ _id: oid(), conversationId: convId, sender: VISITOR, message: `${words} ${email} ${phone}`, time: new Date() }],
        });
        await h.svc.merge(convId);
        const sent = JSON.stringify(h.ai.profileMerge.mock.calls[0][0].chats);
        return !sent.includes(email) && !sent.includes(phone);
      }),
      { numRuns: 40 },
    );
  });

  it("copies incident facts (masked) into the request (R18.4)", async () => {
    const convId = oid();
    const h = setup({
      convs: [{ _id: convId, bot: BOT, visitor: VISITOR, platform: "widget", endedAt: new Date() }],
      incidents: [{ _id: oid(), conversationId: convId, crmContactId: CONTACT, organizationId: ORG, ticketRef: "SR_1", problem: "Call me on 9876543210", resolutionNote: "Fixed the door", outcome: "resolved_by_agent", status: "resolved" }],
      chats: [],
    });
    await h.svc.merge(convId);
    const inc = h.ai.profileMerge.mock.calls[0][0].incident;
    expect(inc).toMatchObject({ ticketRef: "SR_1", outcome: "resolved_by_agent", resolution: "Fixed the door" });
    expect(inc.problem).toBe("Call me on [phone]");
    expect(parseProfile(h.crm.rows[0].profile)!.entries[0].ticketRef).toBe("SR_1");
  });

  it("is idempotent: an already-merged conversation calls nothing", async () => {
    const h = setup();
    await h.svc.merge(h.convId);
    const again = await h.svc.merge(h.convId);
    expect(again.status).toBe("already");
    expect(h.ai.profileMerge).toHaveBeenCalledTimes(1);
    expect(h.crm.activities).toHaveLength(1);
  });

  it("retries 3 times at 30/60/120 s, then fails and writes nothing (R11.6, R18.10)", async () => {
    const ai = { profileMerge: jest.fn(async () => ({ profile: { v: 1, entries: [] } })) };
    const h = setup({ ai });
    await expect(h.svc.merge(h.convId)).rejects.toBeInstanceOf(ProfileMergeFailed);
    expect(ai.profileMerge).toHaveBeenCalledTimes(4);
    expect(h.waits).toEqual([30_000, 60_000, 120_000]);
    expect(h.crm.rows[0]).toMatchObject({ profile: null, profileVersion: 0 });
    expect(h.crm.activities).toHaveLength(0);
  });

  it("a thrown AI error (timeout, 502) counts as a failed attempt", async () => {
    const ai = { profileMerge: jest.fn().mockRejectedValueOnce(new Error("timeout")).mockImplementation(goodAi().profileMerge) };
    const h = setup({ ai });
    const out = await h.svc.merge(h.convId);
    expect(out.ai).toBe(true);
    expect(ai.profileMerge).toHaveBeenCalledTimes(2);
    expect(h.waits).toEqual([30_000]);
  });

  it("with allowFallback the ai:false entry is written after the last failure (R11.7)", async () => {
    const ai = { profileMerge: jest.fn(async () => { throw new Error("down"); }) };
    const h = setup({ ai });
    const out = await h.svc.merge(h.convId, { allowFallback: true });
    expect(out).toMatchObject({ status: "merged", ai: false });
    const entry = parseProfile(h.crm.rows[0].profile)!.entries[0];
    expect(entry).toMatchObject({ conversationId: h.convId, ai: false });
    // The org time zone (R18.3): 10:05Z is 15:35 in Kolkata.
    expect(entry.at).toBe("2026-10-09T15:35:00+05:30");
    expect(h.crm.activities[0].meta.ai).toBe(false);
  });

  it("asks again with compress:true when the result is over 8000 characters (R18.9)", async () => {
    // A stored profile already near the cap: one more entry pushes it over.
    const big = Array.from({ length: 30 }, (_, i) => ({ conversationId: `old${i}`, at: new Date(2026, 0, 30 - i).toISOString(), summary: "x".repeat(250) }));
    const contacts = [{ id: CONTACT, organizationId: ORG, profile: { v: 1, facts: {}, adminOverrides: {}, entries: big } }];
    const ai = {
      profileMerge: jest.fn(async (req: any) => {
        const mine = { conversationId: req.conversation_id, at: req.ended_at, summary: "new" };
        if (!req.compress) return { profile: { ...req.profile, entries: [mine, ...req.profile.entries] } };
        return {
          profile: {
            ...req.profile,
            entries: [mine, ...req.profile.entries.slice(0, 5)],
            earlier: { summary: "old", count: 25, incidentRefs: [], incidentIds: [] },
          },
        };
      }),
    };
    const h = setup({ ai, contacts });
    await h.svc.merge(h.convId);
    expect(ai.profileMerge.mock.calls.map((c: any) => !!c[0].compress)).toEqual([false, true]);
    expect(profileSize(h.crm.rows[0].profile)).toBeLessThanOrEqual(PROFILE_MAX_CHARS);
  });

  it("fails without a contact, and for an archived (merged) contact", async () => {
    const convId = oid();
    const h = setup({ convs: [{ _id: convId, bot: BOT, platform: "widget", endedAt: new Date() }] });
    await expect(h.svc.merge(convId)).rejects.toThrow(/no CRM contact/);
    const h2 = setup({ contacts: [{ id: CONTACT, organizationId: ORG, archivedAt: new Date(), profile: null }] });
    await expect(h2.svc.merge(h2.convId)).rejects.toThrow(/not found or archived/);
  });

  it("never touches another org's contact with the same id", async () => {
    const h = setup({ contacts: [{ id: CONTACT, organizationId: "other-org", profile: null }] });
    await expect(h.svc.merge(h.convId)).rejects.toBeInstanceOf(ProfileMergeFailed);
    expect(h.crm.rows[0].profileVersion).toBe(0);
  });

  it("an admin edit during the AI call is kept: the merge rebases (R18.11, R18.12)", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const inner = goodAi().profileMerge;
    const ai = { profileMerge: jest.fn(async (req: any) => { await gate; return inner(req); }) };
    const h = setup({ ai });
    const merging = h.svc.merge(h.convId);
    await new Promise((r) => setImmediate(r));
    await h.svc.setFact(ORG, CONTACT, "facts.interests", ["escalators"], "admin1");
    release();
    await merging;
    const p = parseProfile(h.crm.rows[0].profile)!;
    expect(p.adminOverrides).toEqual({ "facts.interests": ["escalators"] });
    expect(p.facts.interests).toEqual(["escalators"]);
    expect(p.entries.map((e) => e.conversationId)).toEqual([h.convId]);
    expect(h.crm.rows[0].profileVersion).toBe(2);
  });

  it("Property 6: concurrent merges of one contact keep every entry and ref", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 6 }), fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 6, maxLength: 6 }), async (n, delays) => {
        const convs = Array.from({ length: n }, (_, i) => ({ _id: oid(), bot: BOT, visitor: VISITOR, platform: "widget", endedAt: new Date(2026, 9, 1, i) }));
        const incidents = convs.map((c, i) => ({ _id: oid(), conversationId: String(c._id), crmContactId: CONTACT, organizationId: ORG, ticketRef: `SR_${i}`, outcome: "resolved_by_bot", status: "resolved" }));
        let k = 0;
        const h = setup({ convs, incidents, chats: [], ai: goodAi({ delay: () => delays[k++ % delays.length] }) });
        await Promise.all(convs.map((c) => h.svc.merge(String(c._id))));
        const p = parseProfile(h.crm.rows[0].profile)!;
        const refs = profileRefs(p).tickets;
        return (
          entryCount(p) === n &&
          incidents.every((i) => refs.has(i.ticketRef)) &&
          h.crm.rows[0].profileVersion === n &&
          h.crm.activities.length === n &&
          profileSize(p) <= PROFILE_MAX_CHARS
        );
      }),
      { numRuns: 25 },
    );
  });
});

describe("profile admin edits and context", () => {
  it("deletes an entry and 404s an unknown one", async () => {
    const h = setup();
    await h.svc.merge(h.convId);
    await expect(h.svc.removeEntry(ORG, CONTACT, "c:unknown", "a")).rejects.toThrow(/not found/);
    const out = await h.svc.removeEntry(ORG, CONTACT, `c:${h.convId}`, "a");
    expect(out.profile.entries).toHaveLength(0);
    expect(h.crm.activities.at(-1)).toMatchObject({ meta: { kind: "profile_edit" }, createdById: "a" });
  });

  it("another org's contact is a 404", async () => {
    const h = setup();
    await expect(h.svc.getProfile("org2", CONTACT)).rejects.toThrow(/not found/i);
    await expect(h.svc.setFact("org2", CONTACT, "facts.interests", [], "a")).rejects.toThrow(/not found/i);
  });

  it("context for the AI is the facts + newest entries; null without a contact", async () => {
    const h = setup();
    expect(await h.svc.contextForConversation(h.convId)).toBeNull();
    await h.svc.merge(h.convId);
    (h.svc as any).contextCache.clear();
    const ctx: any = await h.svc.contextForConversation(h.convId);
    expect(ctx.entries[0].summary).toBe(`Summary of ${h.convId}`);
    expect(await h.svc.contextForConversation("bad")).toBeNull();
  });
});

describe("localIso", () => {
  it("formats in the zone with its offset", () => {
    const d = new Date("2026-10-09T10:05:00Z");
    expect(localIso(d, "Asia/Kolkata")).toBe("2026-10-09T15:35:00+05:30");
    expect(localIso(d, "America/New_York")).toBe("2026-10-09T06:05:00-04:00");
    expect(localIso(d, "UTC")).toBe("2026-10-09T10:05:00+00:00");
    expect(localIso(d, "Not/AZone")).toBe(d.toISOString());
  });
});
