jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { Types } from "mongoose";
import { CRM_OP_LINK, CRM_OP_RESOLVE, CrmBridgeService } from "./crm-bridge.service";
import { CrmBridgeListener } from "./crm-bridge.listener";

const oid = () => new Types.ObjectId().toString();

/** Minimal Mongo models: conditional findOneAndUpdate + updateOne/updateMany. */
function mongoFake() {
  const rows: Record<string, any[]> = { Conversation: [], Visitor: [], Incident: [], Ticket: [] };
  const matches = (d: any, q: any): boolean =>
    Object.entries(q).every(([k, v]: [string, any]) => {
      if (k === "$or") return v.some((s: any) => matches(d, s));
      if (v && typeof v === "object" && "$exists" in v) return (d[k] !== undefined) === v.$exists;
      if (v === null) return d[k] == null;
      return String(d[k]) === String(v);
    });
  const model = (name: string) => ({
    findById: (id: string) => ({
      // A real promise: callers both `await` it and chain `.catch`.
      select: () => ({ lean: () => Promise.resolve(rows[name].find((r) => String(r._id) === String(id)) ?? null) }),
    }),
    findOneAndUpdate: (q: any, u: any) => ({
      select: () => ({
        lean: async () => {
          const d = rows[name].find((r) => matches(r, q));
          if (!d) return null;
          Object.assign(d, u.$set);
          return { ...d };
        },
      }),
    }),
    updateOne: (q: any, u: any) => ({
      catch: async () => {
        const d = rows[name].find((r) => matches(r, q));
        if (d) Object.assign(d, u.$set);
      },
    }),
    updateMany: (q: any, u: any) => ({
      catch: async () => {
        for (const d of rows[name].filter((r) => matches(r, q))) Object.assign(d, u.$set);
      },
    }),
  });
  const models = Object.fromEntries(Object.keys(rows).map((n) => [n, model(n)]));
  return { rows, conn: { models } };
}

function setup(resolveImpl?: any) {
  const m = mongoFake();
  const resolver = {
    resolve: jest.fn(resolveImpl ?? (async () => ({ kind: "linked", contactId: "c1", created: true }))),
    recordLink: jest.fn(async () => undefined),
    createAnonymous: jest.fn(async () => "anon1"),
  };
  const queued: any[] = [];
  const outbox = {
    registerHandler: jest.fn(),
    enqueue: jest.fn(async (op: string, payload: any, opts: any) => {
      queued.push({ op, payload, opts });
      return true;
    }),
    runOrEnqueue: jest.fn(async (_op: string, _p: any, fn: any) => {
      await fn();
      return true;
    }),
  };
  const events: any[] = [];
  const srs = {
    linkContactForConversation: jest.fn(async () => 0),
    repointContact: jest.fn(async () => 0),
    touchContact: jest.fn(async () => 0),
  };
  const bridge = new CrmBridgeService(
    resolver as any,
    outbox as any,
    { orgIdForBot: async () => "org1" } as any,
    { emit: (n: string, p: any) => events.push({ n, p }) } as any,
    m.conn as any,
    srs as any,
  );
  (bridge as any).logger.warn = () => undefined;
  return { bridge, m, resolver, outbox, queued, events, srs };
}

const on = { features: { crmCapture: true } };

describe("CrmBridgeService", () => {
  it("does nothing in preview or without identifiers", async () => {
    const { bridge, resolver } = setup();
    const ctx = { conversationId: oid(), botId: "b", visitorId: oid() };
    expect(await bridge.captureFromAttributes({ ...ctx, botSettings: on, mode: "preview" }, { contact_email: "a@b.co" })).toBeNull();
    expect(await bridge.captureFromAttributes({ ...ctx, botSettings: on }, { contact_name: "Raj" })).toBeNull();
    expect(resolver.resolve).not.toHaveBeenCalled();
  });

  it("captures with the crmCapture flag off: capture is always on (crm-plugins-service-desk R2.1)", async () => {
    const { bridge, m, resolver } = setup();
    const conv = oid();
    m.rows.Conversation.push({ _id: conv });
    await bridge.captureFromAttributes({ conversationId: conv, botId: "b", botSettings: { features: {} } }, { contact_email: "a@b.co" });
    expect(resolver.resolve).toHaveBeenCalledTimes(1);
  });

  it("passes the capture source to the resolver (R5.1)", async () => {
    const { bridge, m, resolver } = setup();
    const conv = oid();
    m.rows.Conversation.push({ _id: conv });
    await bridge.capture({ conversationId: conv, botId: "b" }, { email: "a@b.co" }, { source: "widget_form" });
    expect(resolver.resolve).toHaveBeenCalledWith("org1", expect.objectContaining({ source: "widget_form" }));
  });

  it("links conversation, visitor, incident and ticket, and records the link (R3.1, R3.2)", async () => {
    const { bridge, m, resolver, events, srs } = setup();
    const conv = oid();
    const vis = oid();
    m.rows.Conversation.push({ _id: conv });
    m.rows.Visitor.push({ _id: vis });
    m.rows.Incident.push({ conversationId: conv });
    const res = await bridge.captureFromAttributes(
      { conversationId: conv, visitorId: vis, botId: "b", botName: "Bot", botSettings: on },
      { contact_email: "Raj@X.com" },
    );
    expect(res?.contactId).toBe("c1");
    expect(m.rows.Conversation[0].crmContactId).toBe("c1");
    expect(m.rows.Visitor[0].crmContactId).toBe("c1");
    expect(m.rows.Incident[0].crmContactId).toBe("c1");
    // Service Requests are linked in the CRM now (crm-plugins-service-desk R9.6).
    expect(srs.linkContactForConversation).toHaveBeenCalledWith("org1", conv, "c1", undefined);
    expect(resolver.recordLink).toHaveBeenCalledWith("org1", "c1", expect.objectContaining({ conversationId: conv, visitorId: vis }));
    expect(events.map((e) => e.n)).toContain("crm.contact.linked");
  });

  it("keeps an existing different link and writes no activity (R3.7)", async () => {
    const { bridge, m, resolver } = setup(async () => ({ kind: "linked", contactId: "c2", created: false }));
    const conv = oid();
    m.rows.Conversation.push({ _id: conv, crmContactId: "c1" });
    const res = await bridge.captureFromAttributes({ conversationId: conv, botId: "b", botSettings: on }, { contact_email: "a@b.co" });
    expect(res?.contactId).toBe("c1");
    expect(m.rows.Conversation[0].crmContactId).toBe("c1");
    expect(resolver.recordLink).not.toHaveBeenCalled();
  });

  it("an anonymous link is replaced when it is merged into a known contact (R20.3)", async () => {
    const { bridge, m, srs } = setup(async () => ({ kind: "linked", contactId: "real", created: false, merged: true }));
    const conv = oid();
    const vis = oid();
    m.rows.Conversation.push({ _id: conv, crmContactId: "anon" });
    m.rows.Visitor.push({ _id: vis, crmContactId: "anon" });
    m.rows.Incident.push({ conversationId: "other", crmContactId: "anon" });
    await bridge.captureFromAttributes({ conversationId: conv, visitorId: vis, botId: "b", botSettings: on }, { contact_email: "a@b.co" });
    expect(m.rows.Conversation[0].crmContactId).toBe("real");
    expect(m.rows.Visitor[0].crmContactId).toBe("real");
    // Every Mongo row and service request on the anonymous contact is repointed.
    expect(m.rows.Incident[0].crmContactId).toBe("real");
    expect(srs.repointContact).toHaveBeenCalledWith("org1", "anon", "real");
  });

  it("CRM down: queues the resolve with a dedupe key and never throws (R2.8)", async () => {
    const { bridge, m, queued } = setup(async () => {
      throw new Error("ECONNREFUSED");
    });
    const conv = oid();
    m.rows.Conversation.push({ _id: conv });
    await expect(
      bridge.captureFromAttributes({ conversationId: conv, botId: "b", botSettings: on }, { contact_email: "a@b.co" }),
    ).resolves.toBeNull();
    expect(queued).toEqual([
      expect.objectContaining({ op: CRM_OP_RESOLVE, opts: expect.objectContaining({ dedupeKey: `resolve:${conv}:a@b.co::` }) }),
    ]);
    // The queued payload carries no bot settings blob.
    expect(queued[0].payload.ctx.botSettings).toBeUndefined();
  });

  it("registers idempotent outbox handlers", () => {
    const { bridge, outbox } = setup();
    bridge.onModuleInit();
    expect(outbox.registerHandler.mock.calls.map((c: any) => c[0])).toEqual(
      expect.arrayContaining([CRM_OP_RESOLVE, CRM_OP_LINK]),
    );
  });

  it("anonymous contact whatever the flag, never in preview, and reuses an existing link (R2.4)", async () => {
    const { bridge, m, resolver } = setup();
    const conv = oid();
    m.rows.Conversation.push({ _id: conv });
    expect(await bridge.ensureAnonymous({ conversationId: conv, botId: "b", botSettings: on, mode: "preview" })).toBeNull();
    expect(await bridge.ensureAnonymous({ conversationId: conv, botId: "b", botSettings: { features: {} } })).toBe("anon1");
    expect(await bridge.ensureAnonymous({ conversationId: conv, botId: "b", botSettings: on })).toBe("anon1");
    expect(resolver.createAnonymous).toHaveBeenCalledTimes(1);
  });
});

describe("CrmBridgeListener free-text extraction (R16.5)", () => {
  const listener = (ai?: any) =>
    new CrmBridgeListener({} as any, {} as any, { emit: () => undefined } as any, ai);

  it("uses regexes alone when unambiguous", async () => {
    const ai = { extractContact: jest.fn() };
    expect(await listener(ai).extract("I'm Raj, raj@x.com")).toEqual({ name: "Raj", email: "raj@x.com" });
    expect(ai.extractContact).not.toHaveBeenCalled();
  });

  it("asks the AI when ambiguous, and falls back to regexes on AI failure", async () => {
    const ai = { extractContact: jest.fn(async () => ({ email: "c@d.co" })) };
    expect((await listener(ai).extract("a@b.co or c@d.co")).email).toBe("c@d.co");
    const broken = { extractContact: jest.fn(async () => { throw new Error("down"); }) };
    expect((await listener(broken).extract("a@b.co or c@d.co")).email).toBe("a@b.co");
  });
});

// Bug fix: a service request raised by hand from a chat had no contact, and
// cards kept "Anonymous visitor" after the contact got a name.
describe("service requests follow the chat's contact", () => {
  const flush = () => new Promise((r) => setImmediate(r));

  it("pushes the contact's cards again after a capture", async () => {
    const { bridge, m, srs } = setup();
    const conv = oid();
    m.rows.Conversation.push({ _id: conv });
    await bridge.captureFromAttributes({ conversationId: conv, botId: "b", botSettings: on }, { contact_email: "a@b.co" });
    await flush();
    expect(srs.touchContact).toHaveBeenCalledWith("org1", "c1");
  });

  it("a failing refresh never turns a good link into a queued retry", async () => {
    const { bridge, m, srs, queued } = setup();
    (srs as any).touchContact = () => {
      throw new Error("sync boom");
    };
    const conv = oid();
    m.rows.Conversation.push({ _id: conv });
    const res = await bridge.captureFromAttributes({ conversationId: conv, botId: "b", botSettings: on }, { contact_email: "a@b.co" });
    await flush();
    expect(res?.contactId).toBe("c1");
    expect(queued).toHaveLength(0);
  });

  it("needs-contact with details on the visitor: finds or creates the real contact and links the requests", async () => {
    const { bridge, m, resolver, srs } = setup();
    const conv = oid();
    const vis = oid();
    m.rows.Conversation.push({ _id: conv, bot: "b", visitor: vis, platform: "widget" });
    m.rows.Visitor.push({ _id: vis, name: "Raj Kumar", email: "raj@x.com", phone: "0000000000" });
    await bridge.onRequestNeedsContact({ orgId: "org1", id: "sr1", conversationId: conv, visitorId: vis, botId: "b" });
    expect(resolver.resolve).toHaveBeenCalledWith("org1", expect.objectContaining({ details: { name: "Raj Kumar", email: "raj@x.com" }, source: "agent" }));
    expect(m.rows.Conversation[0].crmContactId).toBe("c1");
    expect(srs.linkContactForConversation).toHaveBeenCalledWith("org1", conv, "c1", undefined);
  });

  it("needs-contact without email or phone: an anonymous contact, never a resolve", async () => {
    const { bridge, m, resolver } = setup();
    const conv = oid();
    const vis = oid();
    m.rows.Conversation.push({ _id: conv, bot: "b", visitor: vis });
    m.rows.Visitor.push({ _id: vis, name: "Anonymous" });
    await bridge.onRequestNeedsContact({ orgId: "org1", id: "sr1", conversationId: conv, visitorId: vis, botId: "b" });
    expect(resolver.resolve).not.toHaveBeenCalled();
    expect(resolver.createAnonymous).toHaveBeenCalledWith("org1", conv, vis);
    expect(m.rows.Conversation[0].crmContactId).toBe("anon1");
  });

  it("needs-contact when a capture linked it meanwhile: only the requests follow", async () => {
    const { bridge, m, resolver, srs } = setup();
    const conv = oid();
    m.rows.Conversation.push({ _id: conv, bot: "b", crmContactId: "c9" });
    await bridge.onRequestNeedsContact({ orgId: "org1", id: "sr1", conversationId: conv, botId: "b" });
    expect(resolver.resolve).not.toHaveBeenCalled();
    expect(srs.linkContactForConversation).toHaveBeenCalledWith("org1", conv, "c9");
  });

  it("needs-contact never throws on bad input", async () => {
    const { bridge } = setup();
    await expect(bridge.onRequestNeedsContact({ orgId: "org1", id: "x", conversationId: "not-an-id" })).resolves.toBeUndefined();
    await expect(bridge.onRequestNeedsContact(undefined as any)).resolves.toBeUndefined();
  });
});
