/**
 * crm-incident-handover Phase 2 in MessageHandler: ask once (R16),
 * identity conflict prompt (R17.2, R17.5), capture events (R2.1, R16.5).
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { of } from "rxjs";
import { MessageHandlerService } from "./message-handler.service";

const USER = "v1";
const on = { features: { crmCapture: true }, fallbackMessage: "fallback" };

function harness(opts: { nodes: Record<string, any>; start: string; attributes?: any; known?: any; botSettings?: any }) {
  const store = new Map<string, any>();
  store.set(USER, {
    botId: "bot1",
    conversationId: "c1",
    mode: "live",
    currentNode: opts.nodes[opts.start],
    startNode: opts.nodes[opts.start],
    attributes: opts.attributes ?? {},
    botSettings: opts.botSettings ?? on,
  });
  const qState = new Map<string, any>();
  const ss: any = {
    getUserData: (id: string) => store.get(id),
    updateUserData: (id: string, p: any) => store.set(id, { ...(store.get(id) || {}), ...p }),
    getNodeState: () => "NEW",
    setNodeState: () => undefined,
    getQuestionNodeState: (_u: string, id: string) => qState.get(id),
    setQuestionNodeState: (_u: string, id: string, v: any) => qState.set(id, v),
  };
  const sent: any[] = [];
  const events: any[] = [];
  const identity = {
    known: jest.fn(async () => opts.known ?? {}),
    settle: jest.fn(async () => undefined),
  };
  const svc = new MessageHandlerService(
    { getBotNode: async (id: string) => opts.nodes[id] ?? null } as any,
    ss,
    {} as any,
    {} as any,
    {} as any,
    { getConversationById: async () => ({ chats: [] }), setAwaitingProblem: async () => undefined } as any,
    { propagateEvent: (e: any) => sent.push(e?.data?.message) } as any,
    {} as any,
    { create: () => undefined } as any,
    { findAnswer: async () => null } as any,
    { emit: (n: string, p: any) => events.push({ n, p }) } as any,
    { post: jest.fn(() => of({ status: 200, data: { answer: "AI", confident: true } })) } as any,
    { get: (k: string) => ({ "delay.node": 0, "delay.message": 0, "ai.url": "x", "ai.timeout": 1 } as any)[k] } as any,
    {} as any,
    {} as any,
    { findOne: async () => null } as any,
    { orgIdForBot: async () => "org1" } as any,
    undefined,
    { raise: jest.fn(async () => null) } as any,
    undefined,
    identity as any,
  );
  (svc as any).logger.error = () => undefined;
  (svc as any).logger.warn = () => undefined;
  const say = async (text: string) => {
    sent.length = 0;
    await svc.handleMessage(text, { auth: { userId: USER } } as any);
    await flush();
    return sent.map((m) => m?.value);
  };
  return { svc, sent, events, store, identity, qState, say };
}

const flush = async () => {
  for (let i = 0; i < 5; i++) {
    jest.runAllTimers();
    await Promise.resolve();
  }
};

const qNode = (elements: any[]) => ({
  q: { id: "q", nodeType: "QUESTIONS", next: ["ok"], payload: { elements } },
  ok: { id: "ok", nodeType: "SUCCESS", next: [], responses: [{ type: "text", value: "done" }] },
  idle: { id: "idle", nodeType: "BOT_RESPONSE", next: [], responses: [] },
});
const els = [
  { alias: "contact_name", entity: "any", prompt: "Your name?" },
  { alias: "contact_email", entity: "email", prompt: "Your email?" },
];

describe("ask once (R16)", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance"] } as any));
  afterEach(() => jest.useRealTimers());

  it("all fields known: skips the node with a masked confirm and Yes / Update details", async () => {
    const h = harness({ nodes: qNode(els), start: "q", known: { name: "Raj", email: "raj@x.com" } });
    await h.svc.handleQuestion("", h.store.get(USER).currentNode, USER);
    await flush();
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].value).toBe(`We'll follow up with you at Raj, r•••@x.com. Is that right? Tap "Update details" to change them.`);
    expect(h.sent[0].buttons.map((b: any) => b.title)).toEqual(["Yes", "Update details"]);
    expect(h.store.get(USER).attributes).toMatchObject({ contact_name: "Raj", contact_email: "raj@x.com" });

    expect(await h.say("Yes")).toContain("done");
    expect(h.events.some((e) => e.n === "attribute.captured")).toBe(true);
  });

  it("Update details asks the node's questions again, without pre-fill (R16.3)", async () => {
    const h = harness({ nodes: qNode(els), start: "q", known: { name: "Raj", email: "raj@x.com" } });
    await h.svc.handleQuestion("", h.store.get(USER).currentNode, USER);
    await flush();
    const out = await h.say("Update details");
    expect(out).toEqual(["Your name?"]);
    expect(h.store.get(USER).attributes.contact_email).toBeUndefined();
  });

  it("some fields known: confirms them, then Yes asks only the rest (R23)", async () => {
    const h = harness({ nodes: qNode(els), start: "q", known: { name: "Raj" } });
    await h.svc.handleQuestion("", h.store.get(USER).currentNode, USER);
    await flush();
    expect(h.sent.map((m) => m.value)).toEqual([expect.stringContaining("We'll follow up with you at Raj.")]);
    expect(h.store.get(USER).attributes.contact_name).toBe("Raj");
    expect(await h.say("Yes")).toEqual(["Your email?"]);
    expect(await h.say("raj@x.com")).toContain("done");
  });

  it("pre-chat form details: a mixed questionnaire skips them and asks the rest (R23)", async () => {
    const nodes = qNode([
      { alias: "contact_name", entity: "jarcube.any", prompt: "Your name?" },
      { alias: "topic", entity: "jarcube.any", prompt: "What is it about?" },
      { alias: "mail", entity: "jarcube.email", prompt: "Your email?" },
      { alias: "ref", entity: "jarcube.any", prompt: "Reference?" },
    ]);
    // The real known() reads the mapped attributes the form seeded.
    const h = harness({
      nodes,
      start: "q",
      attributes: { contact_name: "Raj", contact_email: "raj@x.com" },
      known: { name: "Raj", email: "raj@x.com" },
    });
    await h.svc.handleQuestion("", h.store.get(USER).currentNode, USER);
    await flush();
    expect(h.sent.map((m) => m.value)).toEqual([expect.stringContaining("We'll follow up with you at Raj")]);
    expect(await h.say("Yes")).toEqual(["What is it about?"]);
    // The email question (typed jarcube.email) is skipped: the form gave it.
    expect(await h.say("Lift is stuck")).toEqual(["Reference?"]);
    expect(await h.say("R-1")).toContain("done");
    expect(h.store.get(USER).attributes).toMatchObject({ topic: "Lift is stuck", ref: "R-1" });
  });

  it("any other reply to the confirm keeps the details and asks the next question", async () => {
    const h = harness({ nodes: qNode(els), start: "q", known: { name: "Raj" } });
    await h.svc.handleQuestion("", h.store.get(USER).currentNode, USER);
    await flush();
    expect(await h.say("ok sure")).toEqual(["Your email?"]);
    expect(h.events.some((e) => e.n === "visitor.text" && e.p.text === "ok sure")).toBe(true);
  });

  it("always on (no switch), and asks normally for a node with a secure element", async () => {
    const off = harness({ nodes: qNode(els), start: "q", known: { name: "Raj", email: "raj@x.com" }, botSettings: { features: {} } });
    await off.svc.handleQuestion("", off.store.get(USER).currentNode, USER);
    await flush();
    expect(off.sent.map((m) => m.value)).toEqual([expect.stringContaining("We'll follow up with you at Raj")]);

    const mixed = harness({
      nodes: qNode([...els, { alias: "pin", entity: "any", prompt: "PIN?", secure: true }]),
      start: "q",
      known: { name: "Raj", email: "raj@x.com" },
    });
    await mixed.svc.handleQuestion("", mixed.store.get(USER).currentNode, USER);
    await flush();
    expect(mixed.sent.map((m) => m.value)).toEqual(["Your name?"]);
  });

  it("a slow CRM does not stall the visitor: it just asks", async () => {
    const h = harness({ nodes: qNode(els), start: "q" });
    h.identity.known.mockImplementation(() => new Promise(() => undefined));
    const p = h.svc.handleQuestion("", h.store.get(USER).currentNode, USER);
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
      jest.advanceTimersByTime(500);
    }
    await p;
    await flush();
    expect(h.sent.map((m) => m.value)).toEqual(["Your name?"]);
  });
});

describe("identity conflict prompt (R17)", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance"] } as any));
  afterEach(() => jest.useRealTimers());

  // A resting terminal node (stays current and lets the AI answer).
  const nodes = { idle: { id: "idle", nodeType: "FAILURE", next: [], responses: [] } };
  const conflict = { field: "phone", existingMasked: "•••234", newValue: "+15550009999" };

  it("asks once with three buttons and applies the answer", async () => {
    const h = harness({ nodes, start: "idle" });
    await h.svc.onIdentityConflict({ userId: USER, contactId: "c9", conflict });
    await flush();
    expect(h.sent[0].value).toBe("We have a different phone on file ending 234. Which should we use?");
    expect(h.sent[0].buttons.map((b: any) => b.title)).toEqual(["Keep existing", "Use new", "Keep both"]);
    // A second conflict while one is pending is not asked again.
    await h.svc.onIdentityConflict({ userId: USER, contactId: "c9", conflict });
    await flush();
    expect(h.sent).toHaveLength(1);

    await h.say("Keep both");
    expect(h.identity.settle).toHaveBeenCalledWith("bot1", expect.objectContaining({ contactId: "c9" }), "keep_both");
    expect(h.store.get(USER).pendingIdentity).toBeUndefined();
  });

  it("after 2 unanswered turns records a proposal and stops asking (R17.5)", async () => {
    const h = harness({ nodes, start: "idle" });
    await h.svc.onIdentityConflict({ userId: USER, contactId: "c9", conflict });
    await flush();
    await h.say("what are your hours");
    expect(h.store.get(USER).pendingIdentity).toMatchObject({ turns: 1 });
    await h.say("ok thanks");
    expect(h.identity.settle).toHaveBeenCalledWith("bot1", expect.anything(), "unanswered");
    expect(h.store.get(USER).pendingIdentity).toBeUndefined();
  });

  it("is never asked in preview", async () => {
    const h = harness({ nodes, start: "idle" });
    h.store.get(USER).mode = "preview";
    await h.svc.onIdentityConflict({ userId: USER, contactId: "c9", conflict });
    await flush();
    expect(h.sent).toHaveLength(0);
  });
});

describe("capture events (R2.1, R16.5)", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance"] } as any));
  afterEach(() => jest.useRealTimers());

  it("emits attribute.captured on a QUESTIONS answer, but never for a secure one", async () => {
    const h = harness({
      nodes: qNode([
        { alias: "contact_email", entity: "email", prompt: "Email?" },
        { alias: "pin", entity: "any", prompt: "PIN?", secure: true },
      ]),
      start: "q",
      botSettings: { features: {} },
    });
    await h.say("hi");
    await h.say("raj@x.com");
    await h.say("1234");
    const captured = h.events.filter((e) => e.n === "attribute.captured").flatMap((e) => e.p.keys);
    expect(captured).toEqual(["contact_email"]);
  });

  it("emits visitor.text for free text, not in preview", async () => {
    const h = harness({ nodes: { idle: { id: "idle", nodeType: "BOT_RESPONSE", next: [], responses: [] } }, start: "idle" });
    await h.say("I'm Raj, raj@x.com");
    expect(h.events.find((e) => e.n === "visitor.text")?.p.text).toBe("I'm Raj, raj@x.com");
    h.events.length = 0;
    h.store.get(USER).mode = "preview";
    await h.say("I'm Raj, raj@x.com");
    expect(h.events.find((e) => e.n === "visitor.text")).toBeUndefined();
  });
});

describe("capture everywhere in MessageHandler (crm-plugins-service-desk R3, R4)", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance"] } as any));
  afterEach(() => jest.useRealTimers());

  it("an answer validated as email/phone also fills the mapped alias, whatever it was saved as (R3.2)", async () => {
    const h = harness({
      nodes: qNode([
        { alias: "name", entity: "jarcube.any", prompt: "Name?" },
        { alias: "mail", entity: "jarcube.email", prompt: "Email?" },
        { alias: "mobile", entity: "jarcube.phone_number", prompt: "Phone?" },
      ]),
      start: "q",
      botSettings: { features: {} },
    });
    await h.say("hi");
    await h.say("Raj Kumar");
    await h.say("raj@x.com");
    await h.say("+91 98765 43210");
    const attrs = h.store.get(USER).attributes;
    expect(attrs).toMatchObject({ name: "Raj Kumar", mail: "raj@x.com", contact_email: "raj@x.com", mobile: "+91 98765 43210", contact_phone: "+91 98765 43210" });
    const keys = h.events.filter((e) => e.n === "attribute.captured").flatMap((e) => e.p.keys);
    expect(keys).toEqual(expect.arrayContaining(["name", "mail", "contact_email", "mobile", "contact_phone"]));
  });

  it("never overwrites a mapped alias that already has a value, and ignores secure answers (R3.2, R3.4)", async () => {
    const h = harness({
      nodes: qNode([
        { alias: "work_mail", entity: "jarcube.email", prompt: "Work email?" },
        { alias: "otp_mail", entity: "jarcube.email", prompt: "Code email?", secure: true },
      ]),
      start: "q",
      attributes: { contact_email: "first@x.com" },
      botSettings: { features: {} },
    });
    await h.say("hi");
    await h.say("work@x.com");
    await h.say("secret@x.com");
    const attrs = h.store.get(USER).attributes;
    expect(attrs.contact_email).toBe("first@x.com");
    const keys = h.events.filter((e) => e.n === "attribute.captured").flatMap((e) => e.p.keys);
    expect(keys).toEqual(["work_mail"]);
  });

  it("a captured name survives later messages carrying the widget token's 'Anonymous' (R4.3)", async () => {
    const h = harness({ nodes: { idle: { id: "idle", nodeType: "BOT_RESPONSE", next: [], responses: [] } }, start: "idle" });
    h.store.get(USER).visitorName = "Raj";
    h.store.get(USER).nameCaptured = true;
    await h.svc.handleMessage("hello", { auth: { userId: USER, name: "Anonymous" } } as any);
    expect(h.store.get(USER).visitorName).toBe("Raj");
    const s = h.store.get(USER);
    s.nameCaptured = false;
    s.currentNode = s.startNode;
    await h.svc.handleMessage("hello", { auth: { userId: USER, name: "Form Name" } } as any);
    expect(h.store.get(USER).visitorName).toBe("Form Name");
  });

  it("tells the legacy active-chat agent the visitor's new name (R4.4)", async () => {
    const h = harness({ nodes: { idle: { id: "idle", nodeType: "BOT_RESPONSE", next: [], responses: [] } }, start: "idle" });
    const emitted: any[] = [];
    (h.svc as any).emitEventToUser = (to: string, ev: string, data: any) => emitted.push({ to, ev, data });
    await h.svc.onVisitorDetailsUpdated({ visitorId: USER, conversationId: "c1", botId: "bot1", name: "Raj" });
    expect(emitted).toEqual([]); // no agent yet
    h.store.get(USER).assignedAgentId = "agent1";
    await h.svc.onVisitorDetailsUpdated({ visitorId: USER, conversationId: "other", botId: "bot1", name: "Raj" });
    expect(emitted).toEqual([]); // a different conversation
    await h.svc.onVisitorDetailsUpdated({ visitorId: USER, conversationId: "c1", botId: "bot1", name: "Raj" });
    expect(emitted).toEqual([{ to: "agent1", ev: "visitor-updated", data: { conversationId: "c1", visitorId: USER, name: "Raj" } }]);
  });
});
