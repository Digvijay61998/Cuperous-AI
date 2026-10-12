/**
 * crm-incident-handover Phase 3 (task 3.7): replay the KONE flow from
 * "talk to agent" with NO agent online, with `incidentHandover` on.
 *
 * Expect exactly one incident and one ticket, exactly one "recorded" message
 * with the SR ref, no "no agent / busy" text, no menu restart, and the
 * assistant still answering afterwards (R19.1–R19.3, R19.5, D2).
 *
 * Real MessageHandler + real IncidentService over in-memory models. The
 * contact template is a placeholder, so the flow falls back to the in-chat
 * questionnaire exactly like a fresh install.
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
import { NO_PROBLEM_TEXT } from "src/incident/constants";
import { IncidentService } from "src/incident/incident.service";
import { MessageHandlerService } from "./message-handler.service";

const flow = require(path.resolve(__dirname, "../../../docs/koneTrainingData/bot/kone-mykone-assistant-flow.json"));

const USER = "64c0000000000000000000a1";
const CONV = "64c0000000000000000000c1";
// The old dead end. A "please wait, a specialist will join" notice is wanted now (owner).
const NO_AGENT_TEXT = /no agent is available|try again later|enter "start"/i;

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

function harness() {
  const nodes: Record<string, any> = {};
  for (const n of flow.nodes) nodes[n.id] = { ...n, next: [] };
  for (const e of flow.edges) nodes[e.source]?.next.push(e.target);

  const store = new Map<string, any>();
  store.set(USER, {
    botId: "64c0000000000000000000b1",
    conversationId: CONV,
    mode: "live",
    botName: "Assistant",
    currentNode: nodes.kone_start,
    startNode: nodes.kone_start,
    botSettings: { fallbackMessage: "fallback", features: { incidentHandover: true } },
  });
  const nodeState = new Map<string, any>();
  const ss: any = {
    getUserData: (id: string) => store.get(id),
    updateUserData: (id: string, p: any) => store.set(id, { ...(store.get(id) || {}), ...p }),
    getNodeState: (_u: string, id: string) => nodeState.get(id) ?? "NEW",
    setNodeState: (_u: string, id: string, s: any) => nodeState.set(id, s),
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
    update: jest.fn(async (id: string, dto: any) => {
      const t = tickets.find((x) => String(x._id) === String(id));
      if (t) Object.assign(t, dto);
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

  const sent: string[] = [];
  const propagated: any[] = [];
  const conversationService = {
    getConversationById: async () => ({ chats: [] }),
    setAwaitingProblem: async () => undefined,
    transferConversationToAgent: jest.fn(async () => undefined),
  };
  const assignAgent = jest.fn(async (): Promise<any> => null); // nobody online
  const svc = new MessageHandlerService(
    { getBotNode: async (id: string) => nodes[id] ?? null } as any,
    ss,
    {} as any,
    { callWebhook: async () => { throw new Error("Webhook not found"); } } as any,
    ticketsService as any,
    conversationService as any,
    { propagateEvent: (e: any) => (propagated.push(e), sent.push(e?.data?.message?.value)) } as any,
    { assignAgent } as any,
    { create: () => undefined } as any,
    { findAnswer: async () => null } as any,
    { emit: () => undefined } as any,
    { post: jest.fn(() => of({ status: 200, data: { answer: "Here is what I found.", confident: true } })) } as any,
    { get: (k: string) => ({ "delay.node": 0, "delay.message": 0, "ai.url": "x", "ai.timeout": 1 } as any)[k] } as any,
    {} as any,
    // Placeholder template id: the form takes FAILURE -> in-chat questionnaire.
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
  const say = async (text: string) => {
    sent.length = 0;
    await svc.handleMessage(text, { auth: { userId: USER, name: "V" } } as any);
    for (let i = 0; i < 6; i++) {
      jest.runAllTimers();
      await new Promise((r) => setImmediate(r));
    }
    return sent.filter(Boolean);
  };
  return { svc, say, store, model, tickets, alerts, assignAgent, nodes, propagated, conversationService };
}

/** Run the staggered bot-message timers and the work they start. */
const flushAll = async () => {
  for (let i = 0; i < 6; i++) {
    jest.runAllTimers();
    await new Promise((r) => setImmediate(r));
  }
};

describe("KONE flow handover with no agent online (incidentHandover on)", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance", "setImmediate"] } as any));
  afterEach(() => jest.useRealTimers());

  it("records one incident + one ticket, says so once, never mentions availability, keeps answering", async () => {
    const h = harness();
    const all: string[] = [];
    const run = async (t: string) => {
      const out = await h.say(t);
      all.push(...out);
      return out;
    };

    await run("start");
    await run("talk to agent");
    // Questionnaire (form template is a placeholder).
    await run("Raj Kumar");
    await run("raj@example.com");
    await run("skip");
    await run("Lift 2, Building A");
    const recorded = await run("The lift door on floor 3 does not close properly");

    expect(h.model.docs).toHaveLength(1);
    expect(h.tickets).toHaveLength(1);
    const inc = h.model.docs[0];
    expect(inc).toMatchObject({ status: "waiting", problem: "The lift door on floor 3 does not close properly" });
    expect(h.tickets[0]).toMatchObject({ source: "chat", subject: "Customer request from myKONE Assistant" });
    expect(h.tickets[0].description).toBe(
      "The lift door on floor 3 does not close properly\nLift 2, Building A",
    );

    const ref = h.tickets[0].ticketId;
    const handover = all.filter((m) => m.includes(ref));
    expect(handover).toHaveLength(1);
    expect(handover[0]).toMatch(/Your incident ticket SR_\w+ has been created and our team will follow up with you/);
    expect(recorded.join(" ")).toContain(ref);
    expect(all.join("\n")).not.toMatch(NO_AGENT_TEXT);
    expect(h.alerts.raise).toHaveBeenCalledTimes(1);

    // The bot keeps answering; no menu restart, no second incident.
    const after = await run("what is the warranty on doors?");
    expect(after).toContain("Here is what I found.");
    expect(after.join(" ")).not.toMatch(/main menu|how can i help/i);
    expect(h.store.get(USER).currentNode.id).toBe("kone_ai_rest");

    // Asking for an agent again quotes the same request, no new incident.
    const again = await run("talk to agent");
    expect(h.model.docs).toHaveLength(1);
    expect(h.tickets).toHaveLength(1);
    expect(again.join(" ")).not.toMatch(NO_AGENT_TEXT);
  });

  it("incident first: records the incident and gives the number at once, then asks for the problem and fills it in", async () => {
    const h = harness();
    await h.say("start");
    // Jump straight to the handover node without the questionnaire.
    h.store.get(USER).currentNode = h.nodes.kone_agent;
    await h.svc.TransferToAgent("", h.nodes.kone_agent, USER);
    for (let i = 0; i < 4; i++) {
      jest.runAllTimers();
      await new Promise((r) => setImmediate(r));
    }
    // Recorded before any question: nothing is lost if nobody answers.
    expect(h.model.docs).toHaveLength(1);
    expect(h.tickets).toHaveLength(1);
    expect(h.model.docs[0]).toMatchObject({ problem: NO_PROBLEM_TEXT, problemFlags: ["none"] });
    expect(h.alerts.raise).toHaveBeenCalledTimes(1);
    const ref = h.tickets[0].ticketId;

    const out = await h.say("My elevator makes a loud grinding noise");
    expect(h.model.docs).toHaveLength(1);
    expect(h.tickets).toHaveLength(1);
    expect(h.model.docs[0].problem).toBe("My elevator makes a loud grinding noise");
    expect(h.model.docs[0].problemFlags).not.toContain("none");
    expect(h.tickets[0].description).toMatch(/^My elevator makes a loud grinding noise/);
    expect(out.join(" ")).toContain(`added this to your incident ticket ${ref}`);
    // One alert, one "created" message.
    expect(h.alerts.raise).toHaveBeenCalledTimes(1);
  });

  it("incident first: an answer that arrives after an agent took over is still recorded", async () => {
    const h = harness();
    await h.say("start");
    h.store.get(USER).currentNode = h.nodes.kone_agent;
    await h.svc.TransferToAgent("", h.nodes.kone_agent, USER);
    expect(h.model.docs[0].problemFlags).toContain("none");
    // The agent takes over while the question is open; the visitor answers.
    Object.assign(h.store.get(USER), {
      handledByAgent: true,
      acceptedProblem: { problem: "Door stuck on floor 3", flags: [], nodeId: h.nodes.kone_agent.id },
    });
    await h.svc.TransferToAgent("", h.nodes.kone_agent, USER);
    expect(h.model.docs[0].problem).toBe("Door stuck on floor 3");
    expect(h.tickets[0].description).toMatch(/^Door stuck on floor 3/);
    expect(h.tickets).toHaveLength(1);
  });

  it("live chat: with an agent online the chat goes to their Live Chat tab at once, after the ticket number", async () => {
    const h = harness();
    h.assignAgent.mockResolvedValue({ id: "agent7", name: "Priya" });
    (h.alerts as any).acknowledgeByConversation = jest.fn(async () => undefined);
    await h.say("start");
    h.store.get(USER).currentNode = h.nodes.kone_agent;
    h.propagated.length = 0;
    const toAgent = jest.spyOn(h.svc, "emitEventToUser");
    await h.svc.TransferToAgent("", h.nodes.kone_agent, USER);
    await flushAll();
    const msgs = h.propagated.filter((e) => e?.data?.message).map((e) => e.data.message);
    const ref = h.tickets[0].ticketId;
    // 1. the ticket card, 2. the agent joined; no waiting notice, no problem question
    expect(msgs.map((m) => m.value)).toEqual([
      expect.stringContaining(ref),
      "Priya has joined the chat and will help you from here.",
    ]);
    expect(msgs[0].info).toBe("success");
    expect(msgs[1]).toMatchObject({ switchToAgent: true, info: "success" });
    const s = h.store.get(USER);
    expect(s).toMatchObject({ handledByAgent: true, assignedAgentId: "agent7", announcedAgentId: "agent7" });
    expect(s.awaitingProblem).toBeUndefined();
    expect(h.conversationService.transferConversationToAgent).toHaveBeenCalledWith(CONV, "agent7");
    expect(toAgent).toHaveBeenCalledWith("agent7", "new-visitor", expect.objectContaining({ _id: CONV, visitor: expect.objectContaining({ _id: USER }) }));
    expect(h.model.docs[0]).toMatchObject({ status: "agent_active", agentId: "agent7" });
    expect((h.alerts as any).acknowledgeByConversation).toHaveBeenCalled();
    // A repeat takeover event for the same agent is not announced twice.
    h.propagated.length = 0;
    await h.svc.onAgentTookOver({ visitorId: USER, conversationId: CONV, agentId: "agent7", agentName: "Priya" });
    expect(h.propagated.filter((e) => /has joined/.test(e?.data?.message?.value ?? ""))).toHaveLength(0);
  });

  it("live chat: nobody online, the visitor is told to wait; the first agent to accept takes it, a second is refused", async () => {
    const h = harness();
    (h.alerts as any).acknowledgeByConversation = jest.fn(async () => undefined);
    await h.say("start");
    h.store.get(USER).attributes = { contact_topic: "The lift door does not close" };
    h.propagated.length = 0;
    await h.svc.TransferToAgent("", h.nodes.kone_agent, USER);
    await flushAll();
    const texts = h.propagated.filter((e) => e?.data?.message).map((e) => e.data.message);
    expect(texts[1]).toMatchObject({ info: "info", value: expect.stringMatching(/specialists are busy right now/) });
    expect(h.store.get(USER).handledByAgent).toBeFalsy();

    expect(await h.svc.onAgentAcceptLive({ visitorId: USER, agentId: "agentA", agentName: "Asha" })).toBe("connected");
    expect(await h.svc.onAgentAcceptLive({ visitorId: USER, agentId: "agentB", agentName: "Ben" })).toBe("taken");
    expect(await h.svc.onAgentAcceptLive({ visitorId: USER, agentId: "agentA", agentName: "Asha" })).toBe("connected");
    expect(await h.svc.onAgentAcceptLive({ visitorId: "gone", agentId: "agentA" })).toBe("offline");
    expect(h.store.get(USER).assignedAgentId).toBe("agentA");
    expect(h.conversationService.transferConversationToAgent).toHaveBeenCalledTimes(1);
  });

  it("incident first: the problem question is skipped when the problem is already known", async () => {
    const h = harness();
    await h.say("start");
    h.store.get(USER).attributes = { contact_topic: "The lift door does not close" };
    const before = (h.svc as any).askProblemQuestion;
    const ask = jest.fn(before.bind(h.svc));
    (h.svc as any).askProblemQuestion = ask;
    await h.svc.TransferToAgent("", h.nodes.kone_agent, USER);
    expect(h.model.docs[0].problem).toBe("The lift door does not close");
    expect(ask).not.toHaveBeenCalled();
  });

  it("takes FAILURE only when the incident cannot be created (R19.5)", async () => {
    const h = harness();
    (h.svc as any).incidentService.openForHandover = async () => {
      throw new Error("db down");
    };
    await h.say("start");
    h.store.get(USER).attributes = { contact_topic: "The lift door does not close" };
    const visited: string[] = [];
    const orig = h.svc.handleNode.bind(h.svc);
    jest.spyOn(h.svc, "handleNode").mockImplementation((node: any, ...rest: any[]) => {
      if (node?.id) visited.push(node.id);
      return (orig as any)(node, ...rest);
    });
    await h.svc.TransferToAgent("", h.nodes.kone_agent, USER);
    for (let i = 0; i < 4; i++) {
      jest.runAllTimers();
      await new Promise((r) => setImmediate(r));
    }
    expect(visited.slice(0, 3)).toEqual(["kone_agent_fail", "kone_r_agent_fail", "kone_close"]);
    expect(visited).not.toContain("kone_agent_ok");
  });

  it("agent takeover tells the visitor the name once and marks the incident agent_active (R19.4)", async () => {
    const h = harness();
    await h.say("start");
    // "start" clears attributes, so set the problem afterwards.
    h.store.get(USER).attributes = { contact_topic: "The lift door does not close" };
    await h.svc.TransferToAgent("", h.nodes.kone_agent, USER);
    expect(h.model.docs[0].status).toBe("waiting");

    const sent: string[] = [];
    (h.svc as any).redisPropagatorService.propagateEvent = (e: any) => sent.push(e?.data?.message?.value);
    const ev = { visitorId: USER, conversationId: CONV, agentId: "agent1", agentName: "Priya" };
    await h.svc.onAgentTookOver(ev);
    await h.svc.onAgentTookOver(ev);
    jest.runAllTimers();
    expect(sent.filter((m) => /Priya has joined/.test(m ?? ""))).toHaveLength(1);
    expect(h.model.docs[0]).toMatchObject({ status: "agent_active", agentId: "agent1" });
  });

  it("the incidentHandover switch is retired: a bot with it off still records the incident", async () => {
    const h = harness();
    h.store.get(USER).botSettings.features = {};
    await h.say("start");
    const out: string[] = [];
    (h.svc as any).redisPropagatorService.propagateEvent = (e: any) => out.push(e?.data?.message?.value);
    await h.svc.TransferToAgent("", h.nodes.kone_agent, USER);
    expect(h.model.docs).toHaveLength(1);
    expect(h.tickets).toHaveLength(1);
    expect(out.join("\n")).not.toMatch(NO_AGENT_TEXT);
  });
});
