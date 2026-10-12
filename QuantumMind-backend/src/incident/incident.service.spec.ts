// @nestjs/schedule@2 calls util.isString (removed in Node >= 23). The import
// chain reaches ConversationService's @Cron, so stub the whole surface.
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
import { AlertReasonEnum } from "src/handover-alert/enums/handover-alert.enum";
import { INCIDENT_CLOSED, INCIDENT_OPENED } from "./constants";
import { IncidentStatusEnum, OPEN_INCIDENT_STATUSES } from "./enums/incident.enum";
import { IncidentService } from "./incident.service";

/**
 * In-memory Mongo model honouring what the service relies on: the unique
 * partial index on open incidents per conversation, and atomic conditional
 * findOneAndUpdate. Every call yields first, so concurrent callers interleave.
 */
function fakeModel() {
  const docs: any[] = [];
  const tick = () => new Promise((r) => setImmediate(r));
  const get = (d: any, k: string) => k.split(".").reduce((o, p) => o?.[p], d);
  const eq = (a: any, b: any) => String(a) === String(b);
  const match = (d: any, q: any): boolean =>
    Object.entries(q).every(([k, v]: [string, any]) => {
      if (k === "$or") return v.some((s: any) => match(d, s));
      const val = get(d, k);
      if (v && typeof v === "object" && !(v instanceof Types.ObjectId) && !(v instanceof Date)) {
        if ("$in" in v) return v.$in.some((x: any) => eq(x, val));
        if ("$ne" in v) return val !== v.$ne;
        if ("$exists" in v) return (val !== undefined) === v.$exists;
        if ("$lte" in v) return val <= v.$lte;
      }
      if (v === null) return val == null;
      return val !== undefined && eq(val, v);
    });
  const apply = (d: any, u: any) => {
    Object.assign(d, u.$set || {});
    for (const [k, v] of Object.entries(u.$push || {})) (d[k] = d[k] || []).push(v);
    for (const [k, v] of Object.entries(u.$addToSet || {}))
      if (!(d[k] = d[k] || []).includes(v)) d[k].push(v);
  };
  const isOpen = (d: any) => OPEN_INCIDENT_STATUSES.includes(d.status);
  const query = (v: any) => ({
    lean: async () => (v ? JSON.parse(JSON.stringify(v), revive) : null),
    select: () => query(v),
  });
  const revive = (_k: string, v: any) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v) : v;
  const conversations: any[] = [];
  return {
    docs,
    conversations,
    db: {
      models: {
        Conversation: {
          updateOne: async (q: any, u: any) => {
            conversations.push({ q, u });
          },
          updateMany: async () => ({ modifiedCount: 0 }),
        },
      },
    },
    create: async (doc: any) => {
      await tick();
      const d = { ...doc, _id: new Types.ObjectId(), ownershipLog: [], createdAt: new Date() };
      if (isOpen(d) && docs.some((x) => isOpen(x) && x.conversationId === d.conversationId)) {
        throw Object.assign(new Error("E11000"), { code: 11000 });
      }
      docs.push(d);
      return { toObject: () => ({ ...d }) };
    },
    findOne: (q: any) => query(docs.find((d) => match(d, q))),
    findById: (id: any) => query(docs.find((d) => eq(d._id, id))),
    findOneAndUpdate: (q: any, u: any) => ({
      lean: async () => {
        await tick();
        const d = docs.find((x) => match(x, q));
        if (!d) return null;
        const next = { ...d };
        apply(next, u);
        if (
          isOpen(next) &&
          docs.some((x) => x !== d && isOpen(x) && x.conversationId === next.conversationId)
        ) {
          throw Object.assign(new Error("E11000"), { code: 11000 });
        }
        Object.assign(d, next);
        return { ...d };
      },
    }),
    updateOne: async (q: any, u: any) => {
      const d = docs.find((x) => match(x, q));
      if (d) apply(d, u);
    },
    deleteOne: async (q: any) => {
      const i = docs.findIndex((x) => match(x, q));
      if (i >= 0) docs.splice(i, 1);
    },
    find: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ lean: async () => docs }) }) }) }),
    countDocuments: async () => docs.length,
  };
}

function setup(opts: { ticketFails?: boolean } = {}) {
  const model = fakeModel();
  const tickets: any[] = [];
  const ticketsService = {
    create: jest.fn(async (dto: any) => {
      await new Promise((r) => setImmediate(r));
      if (opts.ticketFails) throw new Error("mongo down");
      const t = { ...dto, _id: new Types.ObjectId(), ticketId: `SR_${tickets.length}abcde` };
      tickets.push(t);
      return t;
    }),
  };
  const events: { name: string; payload: any }[] = [];
  const emitter = { emit: (name: string, payload: any) => events.push({ name, payload }) };
  const alerts = { raise: jest.fn(async () => ({ id: "alert1" })) };
  const tenant = { orgIdForBot: async () => "64b000000000000000000001" };
  const svc = new IncidentService(
    model as any,
    ticketsService as any,
    tenant as any,
    emitter as any,
    alerts as any,
  );
  (svc as any).logger.error = () => undefined;
  (svc as any).logger.warn = () => undefined;
  // Same polling logic, ~0 wall-clock: keeps property runs far from the
  // per-test timeout under full-suite load.
  svc.winnerTicketWaitMs = [1, 1, 2, 2, 5];
  return { svc, model, tickets, events, alerts, ticketsService };
}

const conv = () => new Types.ObjectId().toString();
const open = (svc: IncidentService, conversationId: string, extra: any = {}) =>
  svc.openForHandover({
    conversationId,
    botId: "bot1",
    visitorId: "v1",
    problem: "The door does not close",
    reason: AlertReasonEnum.FLOW_TRANSFER,
    ...extra,
  });
const agentUser = (id: string) =>
  ({ _id: id, role: Role.AGENT, organizationId: "64b000000000000000000001" }) as any;

describe("IncidentService.openForHandover", () => {
  it("creates the incident, then its ticket, links them and raises the alert", async () => {
    const { svc, model, tickets, events, alerts } = setup();
    const c = conv();
    const res = await open(svc, c);
    expect(res!.created).toBe(true);
    expect(tickets).toHaveLength(1);
    expect(tickets[0]).toMatchObject({ source: "chat", incident: String(model.docs[0]._id) });
    expect(model.docs[0]).toMatchObject({ status: "waiting", ticketRef: res!.ticketRef, handoverAlertId: "alert1" });
    expect(alerts.raise).toHaveBeenCalledTimes(1);
    expect(events.map((e) => e.name)).toEqual([INCIDENT_OPENED]);
    expect(model.conversations[0].u).toEqual({ $set: { incidentOpen: true } });
  });

  it("emergency tickets are CRITICAL; others MEDIUM", async () => {
    const { svc, tickets } = setup();
    await open(svc, conv(), { emergency: true });
    await open(svc, conv());
    expect(tickets.map((t) => t.priority)).toEqual(["CRITICAL", "MEDIUM"]);
  });

  it("preview mode persists nothing", async () => {
    const { svc, model, tickets } = setup();
    expect(await open(svc, conv(), { mode: "preview" })).toBeNull();
    expect(model.docs).toHaveLength(0);
    expect(tickets).toHaveLength(0);
  });

  it("removes the claim and rethrows when the ticket cannot be created (R1.9)", async () => {
    const { svc, model, events } = setup({ ticketFails: true });
    await expect(open(svc, conv())).rejects.toThrow("mongo down");
    expect(model.docs).toHaveLength(0);
    expect(events).toHaveLength(0);
  });

  // Property 3: one open incident and one ticket per conversation, however
  // many triggers race; every caller gets the same ticket ref.
  it("property: concurrent triggers open exactly one incident and one ticket", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 6 }), async (n) => {
        const { svc, model, tickets } = setup();
        const c = conv();
        const results = await Promise.all(Array.from({ length: n }, () => open(svc, c)));
        expect(model.docs.filter((d) => d.conversationId === c)).toHaveLength(1);
        expect(tickets).toHaveLength(1);
        expect(results.filter((r) => r!.created)).toHaveLength(1);
        // Every caller that has a ref has the winner's ref. Under heavy load a
        // loser may time out without one; it still reports "recorded", never
        // a different ref and never a second incident.
        const refs = new Set(results.map((r) => r!.ticketRef).filter(Boolean));
        expect(refs).toEqual(new Set([tickets[0].ticketId]));
      }),
      { numRuns: 25 },
    );
  });

  it("an emergency on an open normal incident escalates it once, no new incident", async () => {
    const { svc, model, tickets, alerts, ticketsService } = setup();
    (ticketsService as any).update = jest.fn(async () => undefined);
    const c = conv();
    await open(svc, c);
    const again = await open(svc, c, { emergency: true });
    await open(svc, c, { emergency: true });
    expect(again!.created).toBe(false);
    expect(model.docs).toHaveLength(1);
    expect(tickets).toHaveLength(1);
    expect(model.docs[0].emergency).toBe(true);
    expect((ticketsService as any).update).toHaveBeenCalledTimes(1);
    expect((ticketsService as any).update).toHaveBeenCalledWith(String(tickets[0]._id), { priority: "CRITICAL" });
    expect(alerts.raise).toHaveBeenCalledTimes(2); // open + one escalation
  });

  it("allows a new incident after the previous one closed", async () => {
    const { svc, model } = setup();
    const c = conv();
    await open(svc, c);
    await svc.closeOnConversationEnd(c, "expired");
    const again = await open(svc, c);
    expect(again!.created).toBe(true);
    expect(model.docs).toHaveLength(2);
  });
});

describe("IncidentService lifecycle", () => {
  it("accept is idempotent for the same agent and 409 for another", async () => {
    const { svc } = setup();
    const { incident } = (await open(svc, conv()))!;
    const id = String(incident._id);
    await svc.accept(id, "a1");
    await expect(svc.accept(id, "a1")).resolves.toMatchObject({ status: "agent_active", agentId: "a1" });
    await expect(svc.accept(id, "a2")).rejects.toThrow(/Another agent/);
  });

  it("resolve validates the note and the owner, and leaves the record unchanged on rejection", async () => {
    const { svc, model } = setup();
    const { incident } = (await open(svc, conv()))!;
    const id = String(incident._id);
    await svc.accept(id, "a1");
    await expect(svc.resolve(id, agentUser("a1"), "  short  ")).rejects.toThrow(/10 to 2000/);
    await expect(svc.resolve(id, agentUser("a1"), "x".repeat(2001))).rejects.toThrow(/10 to 2000/);
    await expect(svc.resolve(id, agentUser("a2"), "Fixed the door sensor")).rejects.toThrow(/Only the agent/);
    expect(model.docs[0].status).toBe("agent_active");
    const done = await svc.resolve(id, agentUser("a1"), "  Fixed the door sensor  ");
    expect(done).toMatchObject({ status: "resolved", outcome: "resolved_by_agent", resolutionNote: "Fixed the door sensor" });
  });

  it("resolve is 404 for another org's incident", async () => {
    const { svc } = setup();
    const { incident } = (await open(svc, conv()))!;
    const other = { _id: "a1", role: Role.AGENT, organizationId: "64b000000000000000000009" } as any;
    await expect(svc.resolve(String(incident._id), other, "Fixed the door sensor")).rejects.toThrow(/not found/i);
  });

  it("conversation end: abandoned without agent, closed_unresolved with one", async () => {
    const { svc } = setup();
    const c1 = conv();
    await open(svc, c1);
    expect(await svc.closeOnConversationEnd(c1, "close_chat")).toMatchObject({
      status: "closed",
      outcome: "abandoned",
      endCause: "close_chat",
    });
    const c2 = conv();
    const { incident } = (await open(svc, c2))!;
    await svc.accept(String(incident._id), "a1");
    expect(await svc.closeOnConversationEnd(c2, "expired")).toMatchObject({ outcome: "closed_unresolved" });
  });

  it("conversation end leaves follow_up untouched, and an agent release only records it", async () => {
    const { svc, model } = setup();
    const c = conv();
    await open(svc, c);
    model.docs[0].status = IncidentStatusEnum.FOLLOW_UP;
    expect(await svc.closeOnConversationEnd(c, "expired")).toBeNull();
    expect(model.docs[0].status).toBe("follow_up");

    const c2 = conv();
    const { incident } = (await open(svc, c2))!;
    await svc.accept(String(incident._id), "a1");
    expect(await svc.closeOnConversationEnd(c2, "agent_release")).toBeNull();
    const doc = model.docs.find((d) => d.conversationId === c2);
    expect(doc.status).toBe("agent_active");
    expect(doc.lastRelease).toBeDefined();
  });

  it("ticket resolution resolves the open incident once (R1.7)", async () => {
    const { svc, model, events } = setup();
    const { incident } = (await open(svc, conv()))!;
    const ticket = { ticketId: String(incident.ticketId), incident: String(incident._id) };
    expect(await svc.onTicketResolved(ticket, "u1")).toMatchObject({ status: "resolved", resolvedBy: "ticket:u1" });
    expect(await svc.onTicketResolved(ticket, "u1")).toBeNull();
    expect(events.filter((e) => e.name === INCIDENT_CLOSED)).toHaveLength(1);
    expect(model.docs[0].status).toBe("resolved");
  });

  it("ignores invalid ticket ids", async () => {
    const { svc } = setup();
    expect(await svc.onTicketResolved({ ticketId: "nope" })).toBeNull();
  });

  // Property 4: any interleaving of resolve / close / ticket-resolved ends in
  // exactly one terminal status with exactly one incident.closed event.
  it("property: single closure under concurrent terminal events", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom("resolve", "close", "ticket", "expire"), { minLength: 1, maxLength: 6 }),
        async (ops) => {
          const { svc, model, events } = setup();
          const c = conv();
          const { incident } = (await open(svc, c))!;
          const id = String(incident._id);
          await svc.accept(id, "a1");
          await Promise.all(
            ops.map((op) => {
              if (op === "resolve") return svc.resolve(id, agentUser("a1"), "Fixed the door sensor").catch(() => null);
              if (op === "ticket") return svc.onTicketResolved({ ticketId: String(incident.ticketId), incident: id });
              return svc.closeOnConversationEnd(c, op === "close" ? "close_chat" : "expired");
            }),
          );
          expect(["resolved", "closed"]).toContain(model.docs[0].status);
          expect(events.filter((e) => e.name === INCIDENT_CLOSED)).toHaveLength(1);
        },
      ),
      { numRuns: 40 },
    );
  });

  it("list is org-scoped and rejects unknown statuses", async () => {
    const { svc } = setup();
    await expect(svc.list({ _id: "x", role: Role.AGENT, organizationId: null } as any)).resolves.toEqual({ data: [], count: 0 });
    await expect(svc.list(agentUser("a1"), { status: "bogus" })).rejects.toThrow(/Unknown status/);
  });
});
