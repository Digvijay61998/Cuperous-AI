/**
 * crm-incident-handover Phase 6 (task 6.8): the Closure_Prompt state machine
 * on the real KONE flow (Property 8) with `closurePrompt` on.
 *
 * Real MessageHandler + real IncidentService over in-memory models, the same
 * harness shape as handover-replay.spec.ts. Covers: one prompt and no menu
 * restart at a Terminal_Outcome, each reply, first-reply-only, the idle
 * close, Agent_Owned, the flow-builder Terminal toggle, CLOSE_CHAT with the
 * prompt off (6.4), other channels unchanged, and preview mode.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import * as path from "path";
import { Types } from "mongoose";
import { of } from "rxjs";
import { IncidentService } from "src/incident/incident.service";
import { DEFAULT_CLOSING_MESSAGE, DEFAULT_CLOSURE_PROMPT, SOMETHING_ELSE_TEXT } from "./closure";
import { MessageHandlerService } from "./message-handler.service";

const flow = require(path.resolve(__dirname, "../../../docs/koneTrainingData/bot/kone-mykone-assistant-flow.json"));

const USER = "64c0000000000000000000a1";
const CONV = "64c0000000000000000000c1";
const MAIN_MENU = /I'm the myKONE Assistant/;
const PROMPT = DEFAULT_CLOSURE_PROMPT;

function incidentModel() {
  const docs: any[] = [];
  const open = (d: any) => ["waiting", "agent_active", "follow_up"].includes(d.status);
  const match = (d: any, q: any) =>
    Object.entries(q).every(([k, v]: [string, any]) => {
      if (k === "$or") return v.some((s: any) => match(d, s));
      if (v && typeof v === "object" && "$in" in v) return v.$in.map(String).includes(String(d[k]));
      if (v && typeof v === "object" && "$exists" in v) return (d[k] !== undefined) === v.$exists;
      if (v === null) return d[k] == null;
      return String(d[k]) === String(v);
    });
  const q = (v: any) => ({ lean: async () => (v ? { ...v } : null), select: () => q(v) });
  return {
    docs,
    db: { models: { Conversation: { updateOne: async () => undefined } } },
    create: async (doc: any) => {
      if (open(doc) && docs.some((d) => open(d) && d.conversationId === doc.conversationId)) {
        throw Object.assign(new Error("dup"), { code: 11000 });
      }
      const d = { ...doc, _id: new Types.ObjectId(), ownershipLog: [], createdAt: new Date() };
      docs.push(d);
      return { toObject: () => ({ ...d }) };
    },
    findOne: (query: any) => q(docs.find((d) => match(d, query))),
    findById: (id: any) => q(docs.find((d) => String(d._id) === String(id))),
    findOneAndUpdate: (query: any, u: any) => ({
      lean: async () => {
        const d = docs.find((x) => match(x, query));
        if (!d) return null;
        Object.assign(d, u.$set || {});
        return { ...d };
      },
    }),
    updateOne: async (query: any, u: any) => {
      const d = docs.find((x) => match(x, query));
      if (d) Object.assign(d, u.$set || {});
    },
    deleteOne: async () => undefined,
  };
}

/** In-memory Conversation persistence for the closure fields. */
function conversationFake() {
  const row: any = { awaitingClosure: null, endedAt: null, endCause: null };
  const svc = {
    row,
    getConversationById: async () => ({ chats: [] }),
    setAwaitingProblem: async () => undefined,
    setFlowPosition: async () => undefined,
    setAwaitingClosure: jest.fn(async (_id: string, st: any) => {
      if (st && row.endedAt) return;
      row.awaitingClosure = st;
    }),
    endConversation: jest.fn(async (_id: string, _status: any, cause: string) => {
      if (row.endedAt) return;
      row.endedAt = new Date();
      row.endCause = cause;
      row.awaitingClosure = null;
    }),
    findClosureCandidates: async (now: Date) =>
      row.awaitingClosure && !row.endedAt && +row.awaitingClosure.sentAt <= now.getTime() - 60_000
        ? [{ id: CONV, visitorId: USER, ...row.awaitingClosure }]
        : [],
    claimClosure: async (_id: string, sentAt: Date) => {
      if (row.awaitingClosure && +row.awaitingClosure.sentAt === +sentAt && !row.endedAt) {
        row.awaitingClosure = null;
        return true;
      }
      return false;
    },
  };
  return svc;
}

function harness(opts: { features?: any; platform?: string; mode?: string; settings?: any } = {}) {
  const nodes: Record<string, any> = {};
  for (const n of flow.nodes) nodes[n.id] = { ...n, next: [] };
  for (const e of flow.edges) nodes[e.source]?.next.push(e.target);

  const store = new Map<string, any>();
  store.set(USER, {
    botId: "64c0000000000000000000b1",
    conversationId: CONV,
    mode: opts.mode ?? "live",
    platform: opts.platform,
    botName: "Assistant",
    currentNode: nodes.kone_start,
    startNode: nodes.kone_start,
    botSettings: {
      fallbackMessage: "fallback",
      features: opts.features ?? { incidentHandover: true, closurePrompt: true },
      ...(opts.settings || {}),
    },
  });
  const ss: any = {
    getUserData: (id: string) => store.get(id),
    updateUserData: (id: string, p: any) => store.set(id, { ...(store.get(id) || {}), ...p }),
    // Same as SocketStateService: node progress lives in BotNodeState, so a
    // reset ({}) really resets it.
    getNodeState: (_u: string, id: string) => store.get(USER)?.BotNodeState?.[id] ?? "NEW",
    setNodeState: (_u: string, id: string, s: any) => {
      const cur = store.get(USER);
      store.set(USER, { ...cur, BotNodeState: { ...(cur?.BotNodeState || {}), [id]: s } });
    },
    getQuestionNodeState: (u: string, id: string) => store.get(u)?.questionNodeState?.[id],
    setQuestionNodeState: (u: string, id: string, v: any) =>
      store.set(u, { ...store.get(u), questionNodeState: { ...(store.get(u)?.questionNodeState || {}), [id]: v } }),
  };

  const tickets: any[] = [];
  const ticketsService = {
    create: jest.fn(async (dto: any) => {
      const t = { ...dto, _id: new Types.ObjectId(), ticketId: `SR_T${tickets.length + 1}0000` };
      tickets.push(t);
      return t;
    }),
  };
  const alerts = { raise: jest.fn(async () => ({ id: "alert1" })), setAssigned: jest.fn(async () => undefined) };
  const model = incidentModel();
  const incidents = new IncidentService(
    model as any,
    ticketsService as any,
    { orgIdForBot: async () => "64b000000000000000000001" } as any,
    { emit: () => undefined } as any,
    alerts as any,
  );
  (incidents as any).logger.warn = () => undefined;

  const events: { event: string; value?: string; data?: any }[] = [];
  const emitted: { name: string; payload: any }[] = [];
  const conv = conversationFake();
  const svc = new MessageHandlerService(
    { getBotNode: async (id: string) => nodes[id] ?? null } as any,
    ss,
    {} as any,
    { callWebhook: async () => { throw new Error("Webhook not found"); } } as any,
    ticketsService as any,
    conv as any,
    { propagateEvent: (e: any) => events.push({ event: e?.event, value: e?.data?.message?.value, data: e?.data }) } as any,
    { assignAgent: jest.fn(async () => null) } as any,
    { create: () => undefined } as any,
    { findAnswer: async () => null } as any,
    { emit: (name: string, payload: any) => emitted.push({ name, payload }) } as any,
    { post: jest.fn(() => of({ status: 200, data: { answer: "Here is what I found.", confident: true } })) } as any,
    { get: (k: string) => ({ "delay.node": 0, "delay.message": 0, "ai.url": "x", "ai.timeout": 1 } as any)[k] } as any,
    {} as any,
    { create: async () => { throw new Error("template not found"); }, findById: async () => null } as any,
    { findOne: async () => null } as any,
    { orgIdForBot: async () => "64b000000000000000000001" } as any,
    undefined,
    alerts as any,
    incidents,
  );
  for (const s of [svc, incidents] as any[]) {
    s.logger.error = () => undefined;
    s.logger.warn = () => undefined;
  }
  const flush = async () => {
    for (let i = 0; i < 6; i++) {
      jest.runAllTimers();
      await new Promise((r) => setImmediate(r));
    }
  };
  /** Messages (values) sent to the visitor during one step. */
  const step = async (fn: () => Promise<unknown>) => {
    const from = events.length;
    await fn();
    await flush();
    return events.slice(from);
  };
  const texts = (evs: typeof events) => evs.filter((e) => e.event === "chat-message-bot").map((e) => e.value as string);
  const say = async (text: string) => texts(await step(() => svc.handleMessage(text, { auth: { userId: USER, name: "V" } } as any)));
  const node = async (id: string) => texts(await step(() => svc.handleNode(nodes[id], "", USER)));
  const endedEvents = () => events.filter((e) => e.event === "conversation-ended");
  return { svc, store, nodes, model, tickets, conv, events, emitted, say, node, step, texts, endedEvents, flush };
}

/** Drive the KONE flow to a Terminal_Outcome: handover recording fails -> CLOSE_CHAT. */
async function reachFailedHandover(h: ReturnType<typeof harness>) {
  (h.svc as any).incidentService.openForHandover = async () => {
    throw new Error("db down");
  };
  await h.say("start");
  h.store.get(USER).attributes = { contact_topic: "The lift door does not close" };
  return h.texts(await h.step(() => h.svc.TransferToAgent("", h.nodes.kone_agent, USER)));
}

describe("Closure_Prompt (R14, Property 8)", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance", "setImmediate"] } as any));
  afterEach(() => jest.useRealTimers());

  it("a failed handover ends in one prompt, never the main menu (R14.1, R14.8)", async () => {
    const h = harness();
    const out = await reachFailedHandover(h);
    expect(out.filter((m) => m === PROMPT)).toHaveLength(1);
    expect(out.join("\n")).not.toMatch(MAIN_MENU);
    expect(out.join("\n")).not.toMatch(/type start/i);
    expect(h.store.get(USER).awaitingClosure).toMatchObject({ idleMinutes: 10 });
    expect(h.conv.row.awaitingClosure).toMatchObject({ idleMinutes: 10, closingMessage: DEFAULT_CLOSING_MESSAGE });
    // The prompt's buttons.
    const prompt = h.events.find((e) => e.value === PROMPT);
    expect(prompt?.data.message.buttons.map((b: any) => b.title)).toEqual([
      "Yes, resolved",
      "I need something else",
      "Start again",
    ]);
  });

  it("a successful handover keeps answering with no prompt (R19.3 unchanged)", async () => {
    const h = harness();
    await h.say("start");
    h.store.get(USER).attributes = { contact_topic: "The lift door on floor 3 does not close" };
    const rec = h.texts(await h.step(() => h.svc.TransferToAgent("", h.nodes.kone_agent, USER)));
    expect(rec.join(" ")).toContain(h.tickets[0].ticketId);
    const after = await h.say("what is the warranty on doors?");
    expect(after).toContain("Here is what I found.");
    expect([...rec, ...after]).not.toContain(PROMPT);
    expect(h.store.get(USER).currentNode.id).toBe("kone_ai_rest");
  });

  it('"Yes, resolved": closing message once, ends once, Ended_State once; later clicks ignored (R14.2)', async () => {
    const h = harness();
    await reachFailedHandover(h);
    const out = await h.say("Yes, resolved");
    expect(out).toEqual([DEFAULT_CLOSING_MESSAGE]);
    expect(h.endedEvents()).toHaveLength(1);
    expect(h.endedEvents()[0].data).toMatchObject({ conversationId: CONV });
    expect(h.conv.endConversation).toHaveBeenCalledTimes(1);
    expect(h.conv.endConversation).toHaveBeenCalledWith(CONV, undefined, "closure_resolved");
    expect(h.store.get(USER).conversationEnded).toBe(true);

    expect(await h.say("Yes, resolved")).toEqual([]);
    expect(await h.say("hello?")).toEqual([]);
    expect(h.endedEvents()).toHaveLength(1);
    expect(h.conv.endConversation).toHaveBeenCalledTimes(1);
  });

  it('"Yes, resolved" resolves an open incident by the bot, or by the agent who handled it (R10.3)', async () => {
    for (const agent of [undefined, "agent1"]) {
      const h = harness();
      await h.say("start");
      h.store.get(USER).attributes = { contact_topic: "The lift door does not close properly" };
      await h.step(() => h.svc.TransferToAgent("", h.nodes.kone_agent, USER));
      if (agent) {
        await h.svc.onAgentTookOver({ visitorId: USER, conversationId: CONV, agentId: agent, agentName: "Priya" });
        await h.svc.onAgentReleased({ conversationId: CONV, agentId: agent, visitorId: USER });
      }
      // Back with the bot, the flow reaches CLOSE_CHAT.
      const atClose = await h.node("kone_close");
      expect(atClose.filter((m) => m === PROMPT)).toHaveLength(1);
      await h.say("yes, resolved");
      expect(h.model.docs[0]).toMatchObject({
        status: "resolved",
        outcome: agent ? "resolved_by_agent" : "resolved_by_bot",
      });
    }
  });

  it('"I need something else": one question, then the next input is read at the start menu (R14.3)', async () => {
    const h = harness();
    await reachFailedHandover(h);
    h.store.get(USER).attributes = { ...h.store.get(USER).attributes, contact_name: "Raj" };
    expect(await h.say("I need something else")).toEqual([SOMETHING_ELSE_TEXT]);
    expect(h.store.get(USER).attributes.contact_name).toBe("Raj");
    const next = await h.say("invoices");
    expect(next.join("\n")).toMatch(/Invoices\. What do you need\?/);
    expect(next.join("\n")).not.toMatch(MAIN_MENU);
    // The old prompt's buttons do nothing now (first response only).
    expect(await h.say("Yes, resolved")).toEqual([]);
    expect(h.conv.endConversation).not.toHaveBeenCalled();
  });

  it("free text after the prompt is handled as the first input at the start node (R14.10)", async () => {
    const h = harness();
    await reachFailedHandover(h);
    const out = await h.say("invoices");
    expect(out.join("\n")).toMatch(/Invoices\. What do you need\?/);
    expect(out).not.toContain(SOMETHING_ELSE_TEXT);
    expect(out.join("\n")).not.toMatch(MAIN_MENU);
    expect(h.store.get(USER).conversationId).toBe(CONV);
  });

  it.each(["Start again", "start", "  RESTART "])('"%s" restarts in the same conversation (R14.4)', async (word) => {
    const h = harness();
    await reachFailedHandover(h);
    const out = await h.say(word);
    expect(out.join("\n")).toMatch(MAIN_MENU);
    expect(h.store.get(USER).conversationId).toBe(CONV);
    expect(h.conv.endConversation).not.toHaveBeenCalled();
    expect(h.store.get(USER).awaitingClosure).toBeUndefined();
  });

  it("idle close: once, after the configured minutes, from when the prompt was sent (R14.5)", async () => {
    const h = harness({ settings: { closureIdleMinutes: 3 } });
    await reachFailedHandover(h);
    // Measured from when the prompt was sent (the fake clock moves on flush).
    const t0 = +h.conv.row.awaitingClosure.sentAt;
    expect(await h.svc.closeIdleClosures(new Date(t0 + 2 * 60_000))).toBe(0);
    let closed = 0;
    const out = h.texts(
      await h.step(async () => {
        closed = await h.svc.closeIdleClosures(new Date(t0 + 3 * 60_000 + 1000));
      }),
    );
    expect(closed).toBe(1);
    expect(out).toEqual([DEFAULT_CLOSING_MESSAGE]);
    expect(h.endedEvents()).toHaveLength(1);
    expect(h.conv.endConversation).toHaveBeenCalledWith(CONV, undefined, "idle");
    expect(await h.svc.closeIdleClosures(new Date(t0 + 30 * 60_000))).toBe(0);
    expect(await h.say("Yes, resolved")).toEqual([]);
    expect(h.conv.endConversation).toHaveBeenCalledTimes(1);
  });

  it("an answer beats the idle close; the cron then does nothing", async () => {
    const h = harness();
    await reachFailedHandover(h);
    // Measured from when the prompt was sent (the fake clock moves on flush).
    const t0 = +h.conv.row.awaitingClosure.sentAt;
    await h.say("I need something else");
    expect(await h.svc.closeIdleClosures(new Date(t0 + 60 * 60_000))).toBe(0);
    expect(h.conv.endConversation).not.toHaveBeenCalled();
  });

  it("idle close of a visitor this instance does not hold still ends it and notifies once", async () => {
    const h = harness();
    await reachFailedHandover(h);
    // Measured from when the prompt was sent (the fake clock moves on flush).
    const t0 = +h.conv.row.awaitingClosure.sentAt;
    h.store.delete(USER); // disconnected / on another instance
    const evs = await h.step(() => h.svc.closeIdleClosures(new Date(t0 + 11 * 60_000)));
    expect(h.conv.endConversation).toHaveBeenCalledWith(CONV, undefined, "idle");
    expect(evs.map((e) => e.event)).toEqual(["chat-message-bot", "conversation-ended"]);
    expect(evs[0].value).toBe(DEFAULT_CLOSING_MESSAGE);
  });

  it("Agent_Owned: a takeover cancels the pending prompt and its countdown; no prompt while owned (R14.11)", async () => {
    const h = harness();
    await reachFailedHandover(h);
    // Measured from when the prompt was sent (the fake clock moves on flush).
    const t0 = +h.conv.row.awaitingClosure.sentAt;
    await h.svc.onAgentTookOver({ visitorId: USER, conversationId: CONV, agentId: "a1", agentName: "Priya" });
    expect(h.store.get(USER).awaitingClosure).toBeUndefined();
    expect(h.conv.row.awaitingClosure).toBeNull();
    expect(await h.svc.closeIdleClosures(new Date(t0 + 60 * 60_000))).toBe(0);

    h.store.get(USER).handledByAgent = true;
    const out = await h.node("kone_ai_rest_fail");
    expect(out).not.toContain(PROMPT);
  });

  it("the flow-builder Terminal toggle replaces the menu restart (questionnaire abandoned)", async () => {
    const h = harness();
    await h.say("start");
    await h.say("talk to agent");
    await h.say("Raj Kumar");
    await h.say("not-an-email");
    const out = await h.say("still-not-an-email");
    expect(out.join("\n")).toMatch(/let's leave it there/);
    expect(out.filter((m) => m === PROMPT)).toHaveLength(1);
    expect(out.join("\n")).not.toMatch(MAIN_MENU);
    expect(h.store.get(USER).currentNode.id).toBe("kone_r_q_fail");
  });

  it("prompt off: the same node keeps the old menu restart (R15.2)", async () => {
    const h = harness({ features: { incidentHandover: true } });
    await h.say("start");
    await h.say("talk to agent");
    await h.say("Raj Kumar");
    await h.say("not-an-email");
    const out = await h.say("still-not-an-email");
    expect(out).not.toContain(PROMPT);
    expect(out.join("\n")).toMatch(MAIN_MENU);
  });

  it("prompt off, widget CLOSE_CHAT: thank-you, no 'type start', Ended_State, state kept (6.4)", async () => {
    const h = harness({ features: {}, settings: { thankyoumsg: "Thanks for chatting." } });
    await h.say("start");
    const out = await h.node("kone_close");
    expect(out).toEqual(["Thanks for chatting."]);
    expect(h.endedEvents()).toHaveLength(1);
    expect(h.conv.endConversation).toHaveBeenCalledWith(CONV, undefined, "close_chat");
    expect(h.store.get(USER)).toMatchObject({ conversationEnded: true });
    expect(h.emitted.map((e) => e.name)).not.toContain("end.conversation");
  });

  it("other channels: CLOSE_CHAT is unchanged even with the flag on (R15.7)", async () => {
    const h = harness({ platform: "whatsapp" });
    await h.say("start");
    const out = await h.node("kone_close");
    expect(out).toContain('To start again type "start"');
    expect(out).not.toContain(PROMPT);
    expect(h.emitted.map((e) => e.name)).toContain("end.conversation");
    expect(h.endedEvents()).toHaveLength(0);
  });

  it("preview: the prompt works but nothing is persisted or ended in the database (R15.1)", async () => {
    const h = harness({ mode: "preview" });
    await h.say("start");
    expect(await h.node("kone_close")).toEqual([PROMPT]);
    expect(h.conv.setAwaitingClosure).not.toHaveBeenCalled();
    expect(await h.say("Yes, resolved")).toEqual([DEFAULT_CLOSING_MESSAGE]);
    expect(h.endedEvents()).toHaveLength(1);
    expect(h.conv.endConversation).not.toHaveBeenCalled();
  });

  it("two replies racing: only the first acts (R14.1)", async () => {
    const h = harness();
    await reachFailedHandover(h);
    const a = h.svc.handleMessage("Yes, resolved", { auth: { userId: USER } } as any);
    const b = h.svc.handleMessage("I need something else", { auth: { userId: USER } } as any);
    await Promise.all([a, b]);
    await h.flush();
    expect(h.conv.endConversation).toHaveBeenCalledTimes(1);
    const all = h.texts(h.events);
    expect(all.filter((m) => m === SOMETHING_ELSE_TEXT)).toHaveLength(0);
    expect(all.filter((m) => m === DEFAULT_CLOSING_MESSAGE)).toHaveLength(1);
  });
});
