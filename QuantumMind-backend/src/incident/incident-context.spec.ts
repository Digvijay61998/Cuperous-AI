/**
 * crm-incident-handover Phase 5 task 5.1: GET /incidents/:id/context and the
 * by-conversation variant. History completeness (R9.1, R9.8), earlier
 * incidents with a pager (R9.4, R9.6) and org scope (R9.7).
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import * as fc from "fast-check";
import { Types } from "mongoose";
import { Role } from "src/common/enums/role.enum";
import { IncidentService } from "./incident.service";

const ORG = "64b000000000000000000001";
const OTHER_ORG = "64b000000000000000000002";
const BOT = "64b0000000000000000000b1";
const VIS = "64c0000000000000000000a1";
const user = (org = ORG) => ({ _id: "a1", role: Role.AGENT, organizationId: org }) as any;

/** Minimal chainable query over an array with filter/sort/limit/select. */
function collection(rows: any[]) {
  const match = (d: any, q: any): boolean =>
    Object.entries(q).every(([k, v]: [string, any]) => {
      const val = d[k];
      if (v && typeof v === "object" && !(v instanceof Types.ObjectId) && !(v instanceof Date)) {
        if ("$ne" in v) return String(val) !== String(v.$ne);
        if ("$lt" in v) return val < v.$lt;
        if ("$in" in v) return v.$in.map(String).includes(String(val));
      }
      return String(val) === String(v);
    });
  const query = (q: any) => {
    let out = rows.filter((r) => match(r, q));
    const c: any = {
      sort: (s: Record<string, 1 | -1>) => {
        const keys = Object.entries(s);
        out = [...out].sort((a, b) => {
          for (const [k, dir] of keys) {
            const x = a[k] instanceof Date ? a[k].getTime() : a[k] ?? 0;
            const y = b[k] instanceof Date ? b[k].getTime() : b[k] ?? 0;
            if (x < y) return -dir;
            if (x > y) return dir;
          }
          return 0;
        });
        return c;
      },
      limit: (n: number) => {
        out = out.slice(0, n);
        return c;
      },
      select: () => c,
      lean: async () => out.map((r) => ({ ...r })),
    };
    return c;
  };
  return {
    rows,
    find: query,
    findOne: (q: any) => {
      const c = query(q);
      const one: any = { sort: (s: any) => (c.sort(s), one), select: () => one, lean: async () => (await c.lean())[0] ?? null };
      return one;
    },
    findById: (id: any) => ({
      select: () => ({ lean: async () => rows.find((r) => String(r._id) === String(id)) ?? null }),
      lean: async () => rows.find((r) => String(r._id) === String(id)) ?? null,
    }),
  };
}

function setup() {
  const conv = { _id: new Types.ObjectId(), bot: BOT, visitor: VIS, crmContactId: "c1" };
  const incidents = collection([]);
  const chats = collection([]);
  const conversations = collection([conv]);
  const model: any = {
    ...incidents,
    db: { models: { Chat: chats, Conversation: conversations } },
  };
  const crm = {
    forOrg: () => ({ contact: { findFirst: async () => ({ profile: { v: 1, facts: { language: "en" }, entries: [] } }) } }),
  };
  const svc = new IncidentService(
    model,
    {} as any,
    { orgBotIds: async (u: any) => (u.organizationId === ORG ? [new Types.ObjectId(BOT)] : []), orgIdForBot: async () => ORG } as any,
    { emit: () => undefined } as any,
    undefined,
    undefined,
    crm as any,
  );
  const addIncident = (p: any = {}) => {
    const d = {
      _id: new Types.ObjectId(),
      organizationId: ORG,
      botId: BOT,
      conversationId: String(conv._id),
      crmContactId: "c1",
      problem: "Door stuck",
      status: "waiting",
      createdAt: new Date(),
      ...p,
    };
    incidents.rows.push(d);
    return d;
  };
  return { svc, conv, incidents, chats, addIncident };
}

describe("incident context (R9)", () => {
  it("returns every chat oldest first with sender roles, from the server", async () => {
    const h = setup();
    const inc = h.addIncident();
    const t = (s: number) => new Date(1_700_000_000_000 + s * 1000);
    // Inserted out of order on purpose.
    h.chats.rows.push(
      { _id: new Types.ObjectId(), conversationId: String(h.conv._id), sender: BOT, message: "hi, how can I help", time: t(1) },
      { _id: new Types.ObjectId(), conversationId: String(h.conv._id), sender: "agent9", direction: "outbound", message: "I'm Priya", time: t(3) },
      { _id: new Types.ObjectId(), conversationId: String(h.conv._id), sender: VIS, message: "door stuck", time: t(2) },
      { _id: new Types.ObjectId(), conversationId: String(h.conv._id), sender: VIS, message: "1234", secured: true, time: t(4) },
      { _id: new Types.ObjectId(), conversationId: "other", sender: VIS, message: "not mine", time: t(0) },
    );
    const ctx = await h.svc.context(String(inc._id), user());
    expect(ctx.chats.map((c) => [c.senderRole, c.message])).toEqual([
      ["bot", "hi, how can I help"],
      ["visitor", "door stuck"],
      ["agent", "I'm Priya"],
      ["visitor", "••••••"],
    ]);
    expect(ctx.profile).toMatchObject({ v: 1 });
    expect(ctx.incident).toMatchObject({ id: String(inc._id), problem: "Door stuck" });
  });

  // R9.8 history completeness: same set, same order, no duplicates.
  it("property: the history is complete and ordered", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.integer({ min: 0, max: 50 }), { maxLength: 40 }), async (times) => {
        const h = setup();
        const inc = h.addIncident();
        const ids = times.map((s) => {
          const id = new Types.ObjectId();
          h.chats.rows.push({ _id: id, conversationId: String(h.conv._id), sender: VIS, message: `m${s}`, time: new Date(s * 1000) });
          return { id: String(id), s };
        });
        const ctx = await h.svc.context(String(inc._id), user());
        expect(ctx.chats).toHaveLength(ids.length);
        expect(new Set(ctx.chats.map((c) => c.id)).size).toBe(ids.length);
        const ts = ctx.chats.map((c) => new Date(c.time).getTime());
        expect([...ts].sort((a, b) => a - b)).toEqual(ts);
      }),
      { numRuns: 40 },
    );
  });

  it("lists earlier incidents of the contact, newest first, 20 per page, excluding the current one", async () => {
    const h = setup();
    const current = h.addIncident({ createdAt: new Date(2026, 9, 9) });
    for (let i = 0; i < 25; i++) {
      h.addIncident({
        conversationId: `c${i}`,
        createdAt: new Date(2026, 0, 1 + i),
        status: "resolved",
        outcome: "resolved_by_agent",
        resolutionNote: `fixed ${i}`,
        ticketRef: `SR${i}`,
      });
    }
    h.addIncident({ conversationId: "x", crmContactId: "someone-else", createdAt: new Date(2026, 5, 1) });
    h.addIncident({ conversationId: "y", organizationId: OTHER_ORG, createdAt: new Date(2026, 5, 2) });

    const p1 = await h.svc.context(String(current._id), user());
    expect(p1.earlier).toHaveLength(20);
    expect(p1.earlier[0]).toMatchObject({ ticketRef: "SR24", summary: "fixed 24", outcome: "resolved_by_agent" });
    expect(p1.earlier.map((e) => e.id)).not.toContain(String(current._id));
    expect(p1.earlierHasMore).toBe(true);
    // Earlier items carry the summary, never chats (D9).
    expect(Object.keys(p1.earlier[0])).not.toContain("chats");

    const p2 = await h.svc.context(String(current._id), user(), { earlierBefore: p1.earlierCursor! });
    expect(p2.earlier.map((e) => e.ticketRef)).toEqual(["SR4", "SR3", "SR2", "SR1", "SR0"]);
    expect(p2.earlierHasMore).toBe(false);
  });

  it("no contact means no earlier incidents (R9.6)", async () => {
    const h = setup();
    const inc = h.addIncident({ crmContactId: undefined });
    const ctx = await h.svc.context(String(inc._id), user());
    expect(ctx.earlier).toEqual([]);
    expect(ctx.profile).toBeNull();
  });

  it("another org's incident or conversation is a 404 (R9.7)", async () => {
    const h = setup();
    const inc = h.addIncident();
    await expect(h.svc.context(String(inc._id), user(OTHER_ORG))).rejects.toThrow(/not found/i);
    await expect(h.svc.contextForConversation(String(h.conv._id), user(OTHER_ORG))).rejects.toThrow(/not found/i);
  });

  it("by conversation: uses the open incident, else history-only", async () => {
    const h = setup();
    h.chats.rows.push({ _id: new Types.ObjectId(), conversationId: String(h.conv._id), sender: VIS, message: "hello", time: new Date() });
    const none = await h.svc.contextForConversation(String(h.conv._id), user());
    expect(none.incident).toBeNull();
    expect(none.chats).toHaveLength(1);
    const inc = h.addIncident();
    const withInc = await h.svc.contextForConversation(String(h.conv._id), user());
    expect(withInc.incident?.id).toBe(String(inc._id));
  });
});
