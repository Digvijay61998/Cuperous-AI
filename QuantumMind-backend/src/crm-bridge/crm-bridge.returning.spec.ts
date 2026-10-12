/** CrmBridgeService.linkReturning (R16.4, R18.8; found in Phase 9). */
jest.mock("@nestjs/schedule", () => ({ Interval: () => () => undefined, Cron: () => () => undefined }));
import { fakeModel, fakeMongo, oid } from "src/profile/fakes.testspec";
import { CrmBridgeService } from "./crm-bridge.service";

const ON = { features: { crmCapture: true } };

function setup(o: { contact?: string | null; summary?: any; existingLink?: string } = {}) {
  const conv = oid();
  const visitor = oid();
  const models = {
    Conversation: fakeModel([{ _id: conv, crmContactId: o.existingLink }]),
    Visitor: fakeModel([{ _id: visitor, crmContactId: o.contact === undefined ? "ct1" : o.contact }]),
    Incident: fakeModel(),
    Ticket: fakeModel(),
  };
  const resolver = {
    summary: jest.fn(async () => (o.summary === undefined ? { id: "ct1" } : o.summary)),
    recordLink: jest.fn(async () => undefined),
  };
  const outbox = { registerHandler: () => undefined, enqueue: jest.fn(), runOrEnqueue: async (_op: string, _p: any, fn: () => Promise<void>) => (await fn(), true) };
  const svc = new CrmBridgeService(resolver as any, outbox as any, { orgIdForBot: async () => "org1" } as any, { emit: () => undefined } as any, fakeMongo(models));
  (svc as any).logger = { warn: () => undefined };
  const ctx = (extra: any = {}) => ({ conversationId: conv, visitorId: visitor, botId: oid(), botSettings: ON, ...extra });
  return { svc, models, resolver, conv, ctx };
}

describe("linkReturning", () => {
  it("links the new conversation to the visitor's contact and records one chat link", async () => {
    const h = setup();
    expect(await h.svc.linkReturning(h.ctx())).toBe("ct1");
    expect(h.models.Conversation.docs[0].crmContactId).toBe("ct1");
    expect(h.resolver.recordLink).toHaveBeenCalledTimes(1);
  });

  it("links with the crmCapture flag off: capture is always on (crm-plugins-service-desk R2.1)", async () => {
    const h = setup();
    expect(await h.svc.linkReturning(h.ctx({ botSettings: { features: {} } }))).toBe("ct1");
  });

  it.each([
    ["preview", { mode: "preview" }, {}],
    ["no visitor id", { visitorId: undefined }, {}],
    ["visitor has no contact", {}, { contact: null }],
    ["contact archived (merged away)", {}, { summary: null }],
  ])("does nothing when %s", async (_n, ctx, o) => {
    const h = setup(o as any);
    expect(await h.svc.linkReturning(h.ctx(ctx))).toBeNull();
    expect(h.models.Conversation.docs[0].crmContactId).toBeUndefined();
    expect(h.resolver.recordLink).not.toHaveBeenCalled();
  });

  it("keeps a different existing link (R3.7)", async () => {
    const h = setup({ existingLink: "other" });
    expect(await h.svc.linkReturning(h.ctx())).toBe("other");
    expect(h.models.Conversation.docs[0].crmContactId).toBe("other");
  });

  it("never throws into the widget path", async () => {
    const h = setup();
    h.resolver.summary.mockRejectedValueOnce(new Error("CRM down"));
    await expect(h.svc.linkReturning(h.ctx())).resolves.toBeNull();
  });
});
