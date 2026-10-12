/** ContactCaptureService (crm-plugins-service-desk R1, R4). */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));
import { fakeModel, fakeMongo, oid } from "src/profile/fakes.testspec";
import { ContactCaptureService, sourceForPlatform, VISITOR_DETAILS_UPDATED } from "./contact-capture.service";

function setup(visitor: Record<string, any> = {}, state: Record<string, any> | null = {}) {
  const visitorId = oid();
  const conversationId = oid();
  const models = {
    Visitor: fakeModel([{ _id: visitorId, name: "Anonymous", email: `${visitorId}@nomemail.com`, phone: "0000000000", ...visitor }]),
  };
  const bridge = {
    capture: jest.fn(async () => ({ outcome: { kind: "linked" }, contactId: "c1" })),
    fillName: jest.fn(async () => true),
  };
  const store: Record<string, any> = {};
  if (state) store[visitorId] = { conversationId, ...state };
  const socketState = {
    getUserData: (id: string) => store[id],
    updateUserData: (id: string, d: any) => (store[id] = { ...(store[id] || {}), ...d }),
  };
  const events: any[] = [];
  const svc = new ContactCaptureService(
    bridge as any,
    socketState as any,
    { emit: (n: string, p: any) => events.push({ n, p }) } as any,
    fakeMongo(models),
  );
  (svc as any).logger = { warn: () => undefined };
  const ctx = { conversationId, visitorId, botId: oid(), channel: "widget" };
  return { svc, models, bridge, store, events, ctx, visitorId, conversationId };
}

describe("ContactCaptureService", () => {
  it("replaces placeholders on the visitor, renames the live chat and tells the dashboard (R4.1, R4.2, R4.4)", async () => {
    const h = setup();
    await h.svc.capture(h.ctx, { name: "Raj Kumar", email: "Raj@X.com", phone: "+91 98765 43210" }, "widget_chat");
    expect(h.models.Visitor.docs[0]).toMatchObject({ name: "Raj Kumar", email: "raj@x.com", phone: "+919876543210" });
    expect(h.store[h.visitorId]).toMatchObject({ visitorName: "Raj Kumar", nameCaptured: true });
    expect(h.events).toEqual([
      expect.objectContaining({ n: VISITOR_DETAILS_UPDATED, p: expect.objectContaining({ name: "Raj Kumar", conversationId: h.conversationId }) }),
    ]);
    expect(h.bridge.capture).toHaveBeenCalledWith(
      h.ctx,
      { name: "Raj Kumar", email: "raj@x.com", phone: "+919876543210" },
      expect.objectContaining({ source: "widget_chat" }),
    );
  });

  it("the visitor follows the latest statement; the same value again changes nothing", async () => {
    const h = setup({ name: "Raj", email: "old@x.com", phone: "+15550001234" });
    await h.svc.capture(h.ctx, { email: "new@x.com" }, "widget_chat");
    expect(h.models.Visitor.docs[0].email).toBe("new@x.com");
    h.events.length = 0;
    await h.svc.capture(h.ctx, { email: "NEW@x.com", phone: "+1 (555) 000-1234" }, "widget_chat");
    expect(h.events).toHaveLength(0);
  });

  it("name only: renames the visitor and the linked contact, creates nothing (R1.6, D7)", async () => {
    const h = setup();
    await h.svc.capture(h.ctx, { name: "Raj" }, "widget_chat");
    expect(h.models.Visitor.docs[0].name).toBe("Raj");
    expect(h.bridge.fillName).toHaveBeenCalledWith(h.ctx, "Raj", { weakName: undefined });
    expect(h.bridge.capture).not.toHaveBeenCalled();
  });

  it("a guessed name (platform display name) only replaces 'Anonymous' on the visitor (D11)", async () => {
    const h = setup({ name: "Rajesh" });
    await h.svc.capture(h.ctx, { name: "Raj 🔥", weakName: true }, "whatsapp");
    expect(h.models.Visitor.docs[0].name).toBe("Rajesh");
    const g = setup();
    await g.svc.capture(g.ctx, { name: "Raj", weakName: true }, "telegram");
    expect(g.models.Visitor.docs[0].name).toBe("Raj");
  });

  it("'Anonymous' and junk are not names or identifiers", async () => {
    const h = setup();
    await h.svc.capture(h.ctx, { name: " anonymous ", email: "nope", phone: "12" }, "widget_form");
    expect(h.models.Visitor.docs[0].name).toBe("Anonymous");
    expect(h.bridge.capture).not.toHaveBeenCalled();
    expect(h.bridge.fillName).not.toHaveBeenCalled();
    expect(h.events).toHaveLength(0);
  });

  it("a platform id alone reaches the CRM (R22)", async () => {
    const h = setup();
    await h.svc.capture(h.ctx, { name: "Raj", channel: { kind: "TELEGRAM", value: "12345" } }, "telegram");
    expect(h.bridge.capture).toHaveBeenCalledWith(
      h.ctx,
      expect.objectContaining({ channel: { kind: "TELEGRAM", value: "12345" } }),
      expect.objectContaining({ source: "telegram" }),
    );
  });

  it("does not touch the live state of a different conversation", async () => {
    const h = setup({}, { conversationId: "another", visitorName: "Old" });
    await h.svc.capture(h.ctx, { name: "Raj", email: "raj@x.com" }, "widget_chat");
    expect(h.store[h.visitorId].visitorName).toBe("Old");
    expect(h.models.Visitor.docs[0].name).toBe("Raj");
  });

  it("CRM failure still updates the visitor and never throws (R1.9)", async () => {
    const h = setup();
    h.bridge.capture.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await expect(h.svc.capture(h.ctx, { name: "Raj", email: "raj@x.com" }, "widget_chat")).resolves.toBeNull();
    expect(h.models.Visitor.docs[0]).toMatchObject({ name: "Raj", email: "raj@x.com" });
  });

  it("preview writes nothing (R1.10)", async () => {
    const h = setup();
    await h.svc.capture({ ...h.ctx, mode: "preview" }, { name: "Raj", email: "raj@x.com" }, "widget_form");
    expect(h.models.Visitor.docs[0].name).toBe("Anonymous");
    expect(h.bridge.capture).not.toHaveBeenCalled();
    expect(h.events).toHaveLength(0);
  });

  it("maps platforms to capture sources", () => {
    expect(sourceForPlatform("whatsapp_web")).toBe("whatsapp_web");
    expect(sourceForPlatform("telegram")).toBe("telegram");
    expect(sourceForPlatform("widget")).toBe("widget_chat");
    expect(sourceForPlatform(undefined)).toBe("widget_chat");
  });
});
