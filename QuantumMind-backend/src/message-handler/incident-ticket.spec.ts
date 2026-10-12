/**
 * crm-incident-handover Phase 1: TICKET node (R1) and the problem gate (R4)
 * inside MessageHandler, with the flow and services faked.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { of } from "rxjs";
import { NO_PROBLEM_TEXT } from "src/incident/constants";
import { MessageHandlerService } from "./message-handler.service";

const USER = "v1";
const CONV = "64c0000000000000000000aa";

type Opts = {
  nodes: Record<string, any>;
  start: string;
  incident?: any;
  ticketFails?: boolean;
  attributes?: Record<string, unknown>;
  botSettings?: Record<string, any>;
};

function harness(opts: Opts) {
  const store = new Map<string, any>();
  store.set(USER, {
    botId: "bot1",
    conversationId: CONV,
    mode: "live",
    currentNode: opts.nodes[opts.start],
    startNode: opts.nodes[opts.start],
    attributes: opts.attributes ?? {},
    botSettings: { fallbackMessage: "fallback", ...(opts.botSettings || {}) },
  });
  const ss: any = {
    getUserData: (id: string) => store.get(id),
    updateUserData: (id: string, p: any) => store.set(id, { ...(store.get(id) || {}), ...p }),
    getNodeState: () => "NEW",
    setNodeState: () => undefined,
    getQuestionNodeState: () => undefined,
    setQuestionNodeState: () => undefined,
  };
  const sent: string[] = [];
  const tickets: any[] = [];
  const ticketsService = {
    create: jest.fn(async (dto: any) => {
      if (opts.ticketFails) throw new Error("db down");
      const t = { ...dto, _id: "t" + tickets.length, id: "INTERNAL_ID", ticketId: "SRabc12" + tickets.length };
      tickets.push(t);
      return t;
    }),
  };
  let incident = opts.incident ?? null;
  const incidentService = {
    findOpenByConversation: jest.fn(async () => incident),
    linkTicketIfMissing: jest.fn(async (_id: string, t: any) => {
      if (incident?.ticketRef) return incident.ticketRef;
      incident = { ...incident, ticketRef: t.ticketId };
      return t.ticketId;
    }),
    flagNoProblem: jest.fn(async () => undefined),
  };
  const conversationService = {
    getConversationById: async () => ({ chats: [] }),
    setAwaitingProblem: jest.fn(async () => undefined),
  };
  const svc = new MessageHandlerService(
    { getBotNode: async (id: string) => opts.nodes[id] ?? null } as any,
    ss,
    {} as any,
    {} as any,
    ticketsService as any,
    conversationService as any,
    { propagateEvent: (e: any) => sent.push(e?.data?.message?.value) } as any,
    {} as any,
    { create: () => undefined } as any,
    { findAnswer: async () => null } as any,
    { emit: () => undefined } as any,
    { post: jest.fn(() => of({ status: 200, data: { answer: "AI", confident: true } })) } as any,
    { get: (k: string) => ({ "delay.node": 0, "delay.message": 0, "ai.url": "x", "ai.timeout": 1 } as any)[k] } as any,
    {} as any,
    {} as any,
    { findOne: async () => null } as any,
    { orgIdForBot: async () => "org1" } as any,
    undefined,
    { raise: jest.fn(async () => null), setAssigned: jest.fn(async () => undefined) } as any,
    incidentService as any,
  );
  (svc as any).logger.error = () => undefined;
  (svc as any).logger.warn = () => undefined;
  return { svc, sent, store, tickets, ticketsService, incidentService, conversationService };
}

const flush = async () => {
  for (let i = 0; i < 4; i++) {
    jest.runAllTimers();
    await Promise.resolve();
  }
};

const ticketFlow = (payload: any = {}) => ({
  t: { id: "t", nodeType: "TICKET", next: ["ok", "bad"], payload: { ticketSubject: "Help", ...payload } },
  ok: { id: "ok", nodeType: "BOT_RESPONSE", next: [], responses: [{ type: "text", value: "after ticket" }] },
  bad: { id: "bad", nodeType: "FAILURE", next: [], responses: [] },
});

describe("TICKET node (R1)", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance"] } as any));
  afterEach(() => jest.useRealTimers());

  it("builds the description from the problem alias and shows the SR ref, not the _id", async () => {
    const h = harness({
      nodes: ticketFlow(),
      start: "t",
      attributes: { contact_topic: "Door is stuck on floor 3", ticket_summary: "Lift 2" },
    });
    await h.svc.handleCreateTicket("", h.store.get(USER).currentNode, USER);
    await flush();
    expect(h.tickets[0]).toMatchObject({
      description: "Door is stuck on floor 3\nLift 2",
      source: "chat",
      subject: "Help",
    });
    const confirm = h.sent.find((m) => /reference/.test(m ?? ""))!;
    expect(confirm).toContain("SRabc120");
    expect(confirm).not.toContain("INTERNAL_ID");
    expect(h.sent).toContain("after ticket");
  });

  it("writes the placeholder when there is no problem, and flags the open incident", async () => {
    const h = harness({ nodes: ticketFlow(), start: "t", incident: { _id: "i1", problem: NO_PROBLEM_TEXT } });
    await h.svc.handleCreateTicket("", h.store.get(USER).currentNode, USER);
    await flush();
    expect(h.tickets[0].description).toBe(NO_PROBLEM_TEXT);
    expect(h.tickets[0].incident).toBe("i1");
    expect(h.incidentService.flagNoProblem).toHaveBeenCalledWith("i1");
  });

  it("reuses the open incident's ticket instead of creating another (R1.8)", async () => {
    const h = harness({
      nodes: ticketFlow(),
      start: "t",
      incident: { _id: "i1", problem: "Door stuck badly", ticketRef: "SRexist" },
    });
    await h.svc.handleCreateTicket("", h.store.get(USER).currentNode, USER);
    await flush();
    expect(h.ticketsService.create).not.toHaveBeenCalled();
    expect(h.sent.join(" ")).toContain("SRexist");
  });

  it("on failure sends one message, no ref, and takes the FAILURE branch (R1.9)", async () => {
    const h = harness({ nodes: ticketFlow(), start: "t", ticketFails: true });
    await h.svc.handleCreateTicket("", h.store.get(USER).currentNode, USER);
    await flush();
    expect(h.sent.filter(Boolean)).toHaveLength(1);
    expect(h.sent[0]).toMatch(/could not record/);
    expect(h.sent.join(" ")).not.toMatch(/SR/);
    expect(h.store.get(USER).currentNode.id).toBe("bad");
  });

  it("without a FAILURE branch, rests on the node instead of crashing", async () => {
    const nodes = ticketFlow();
    nodes.t.next = [] as any;
    const h = harness({ nodes, start: "t", ticketFails: true });
    await h.svc.handleCreateTicket("", h.store.get(USER).currentNode, USER);
    await flush();
    expect(h.store.get(USER).currentNode.id).toBe("t");
  });
});

describe("problem gate (R4)", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance"] } as any));
  afterEach(() => jest.useRealTimers());

  const node = { id: "h", nodeType: "TRANSFER_TO_AGENT", next: [], payload: {} };
  const on = { features: { incidentHandover: true } };

  it("uses the problem alias when it is long enough, without asking", async () => {
    const h = harness({ nodes: { h: node }, start: "h", attributes: { contact_topic: "The lift is making noise" }, botSettings: on });
    await expect(h.svc.ensureProblemDescription(USER, node as any)).resolves.toEqual({
      problem: "The lift is making noise",
      flags: [],
    });
    expect(h.sent).toHaveLength(0);
  });

  it("never asks again while an incident is open (R4.8)", async () => {
    const h = harness({ nodes: { h: node }, start: "h", incident: { problem: "Known issue here", problemFlags: [] }, botSettings: on });
    await expect(h.svc.ensureProblemDescription(USER, node as any)).resolves.toMatchObject({ problem: "Known issue here" });
    expect(h.sent).toHaveLength(0);
  });

  it("asks, re-asks once on a short answer, then resumes the node with the answer", async () => {
    const h = harness({ nodes: { h: node }, start: "h", botSettings: { ...on, problemQuestion: "What is wrong?" } });
    const handle = jest.spyOn(h.svc, "handleNode").mockResolvedValue(undefined);

    expect(await h.svc.ensureProblemDescription(USER, node as any)).toBeNull();
    await flush();
    expect(h.sent).toEqual(["What is wrong?"]);
    expect(h.conversationService.setAwaitingProblem).toHaveBeenCalledWith(CONV, expect.objectContaining({ attempt: 1 }));

    h.sent.length = 0;
    await h.svc.handleMessage("help", { auth: { userId: USER } } as any);
    await flush();
    expect(h.sent[0]).toMatch(/^What is wrong\? For example/);
    expect(handle).not.toHaveBeenCalled();

    await h.svc.handleMessage("ok", { auth: { userId: USER } } as any);
    await flush();
    expect(handle).toHaveBeenCalledWith(node, "", USER);
    // The resumed node picks the accepted answer up exactly once.
    await expect(h.svc.ensureProblemDescription(USER, node as any)).resolves.toEqual({
      problem: "ok",
      flags: ["short"],
    });
    expect(h.store.get(USER).awaitingProblem).toBeUndefined();
    expect(h.conversationService.setAwaitingProblem).toHaveBeenLastCalledWith(CONV, null);
  });

  it("restart words and an expired question release the gate to the normal flow", async () => {
    const h = harness({ nodes: { h: node }, start: "h", botSettings: on });
    await h.svc.ensureProblemDescription(USER, node as any);
    h.store.get(USER).awaitingProblem.askedAt = Date.now() - 11 * 60_000;
    const consumed = await (h.svc as any).consumeProblemAnswer(USER, "the lift is broken", "text");
    expect(consumed).toBe(false);
    expect(h.store.get(USER).awaitingProblem).toBeUndefined();

    await h.svc.ensureProblemDescription(USER, node as any);
    expect(await (h.svc as any).consumeProblemAnswer(USER, "Start", "text")).toBe(false);
  });

  it("works for every bot: the incidentHandover switch is retired (incident first)", async () => {
    const h = harness({ nodes: { h: node }, start: "h" });
    jest.spyOn(h.svc, "handleNode").mockResolvedValue(undefined);
    h.store.get(USER).awaitingProblem = { attempt: 1, askedAt: Date.now(), nodeId: "h" };
    expect(await (h.svc as any).consumeProblemAnswer(USER, "the lift is broken", "text")).toBe(true);
  });
});
