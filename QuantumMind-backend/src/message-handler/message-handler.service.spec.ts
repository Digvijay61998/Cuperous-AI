import { of } from "rxjs";
import { NodeTypeEnum } from "src/bots/enums/node-type.enum";
import { ModeEnum } from "src/widget/enums/mode.enum";
import { MessageHandlerService } from "./message-handler.service";

/**
 * Regression coverage for the workflow execution engine.
 *
 * These tests lock in the fix for the "static flow stopped executing" bug:
 *  - static-only flows must deliver EVERY node's message, in order;
 *  - AI is only invoked when an AI node is actually reached (it must not
 *    intercept/replace the static engine);
 *  - the per-conversation send-delay baseline is reset on every inbound
 *    message so scheduled messages never drift into the far future;
 *  - a node with no responses is a safe no-op (never throws / corrupts delay).
 */
describe("MessageHandlerService — workflow execution", () => {
  type AnyNode = Record<string, any>;

  const USER_ID = "visitor-1";
  const CONV_ID = "conv-1";

  const buildUser = () => ({ auth: { userId: USER_ID, name: "Visitor" } } as any);

  /** In-memory socket state with the merge semantics the service relies on. */
  function makeSocketState(initial: AnyNode) {
    const store = new Map<string, AnyNode>();
    store.set(USER_ID, initial);
    return {
      store,
      getUserData: (id: string) => store.get(id),
      updateUserData: (id: string, patch: AnyNode) => {
        store.set(id, { ...(store.get(id) || {}), ...patch });
      },
      getNodeState: () => undefined,
      setNodeState: jest.fn(),
      getQuestionNodeState: () => undefined,
      setQuestionNodeState: jest.fn(),
    };
  }

  /** Build the service with just the collaborators the flow paths touch. */
  function buildService(opts: {
    nodes: Record<string, AnyNode>;
    initialState: AnyNode;
    aiResponse?: AnyNode;
    agentService?: AnyNode;
    handoverAlertService?: AnyNode;
  }) {
    const socketStateService = makeSocketState(opts.initialState);

    const botsService = {
      getBotNode: jest.fn(async (id: string) => opts.nodes[id] ?? null),
    };
    const propagate = jest.fn();
    const redisPropagatorService = { propagateEvent: propagate };
    const eventEmitter = { emit: jest.fn() };
    const questionsService = { findAnswer: jest.fn(async () => null) };
    const conversationService = {
      getConversationById: jest.fn(async () => ({ chats: [] })),
    };
    const httpPost = jest.fn(() =>
      of({
        status: 200,
        data:
          opts.aiResponse ?? {
            answer: "AI answer",
            confident: true,
            tokens_used: 3,
            provider: "openai",
            model: "gpt-test",
          },
      })
    );
    const httpService = { post: httpPost };
    const configService = {
      get: (key: string) => {
        const map: Record<string, any> = {
          "delay.node": 1000,
          "delay.message": 750,
          "ai.url": "http://ai.local",
          "ai.timeout": 20000,
        };
        return map[key];
      },
    };

    const noop = () => undefined;
    const service = new MessageHandlerService(
      botsService as any,
      socketStateService as any,
      { addVisitor: noop, removeVisitor: noop } as any, // segments
      {} as any, // webhook
      {} as any, // tickets
      conversationService as any,
      redisPropagatorService as any,
      (opts.agentService ?? {}) as any, // agent
      { create: noop } as any, // unanswered
      questionsService as any,
      eventEmitter as any,
      httpService as any,
      configService as any,
      {} as any, // messagingRegistry
      {} as any, // templateSession
      {} as any, // template
      { orgIdForBot: async () => "org1" } as any, // tenantScope
      undefined, // entitlementService
      opts.handoverAlertService as any
    );

    return {
      service,
      socketStateService,
      propagate,
      httpPost,
      eventEmitter,
    };
  }

  /** Collect the ordered text values delivered to the widget. */
  const deliveredValues = (propagate: jest.Mock) =>
    propagate.mock.calls.map((c) => c[0]?.data?.message?.value);

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['performance'] });
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("static-only flow delivers welcome + every BOT_RESPONSE in order", async () => {
    const nodes: Record<string, AnyNode> = {
      start: { id: "start", nodeType: NodeTypeEnum.START_NODE, next: ["a"], responses: [] },
      a: {
        id: "a",
        nodeType: NodeTypeEnum.BOT_RESPONSE,
        next: ["b"],
        responses: [{ type: "text", value: "Message A" }],
      },
      b: {
        id: "b",
        nodeType: NodeTypeEnum.BOT_RESPONSE,
        next: [],
        responses: [{ type: "text", value: "Message B" }],
      },
    };

    const { service, propagate, httpPost } = buildService({
      nodes,
      initialState: {
        mode: ModeEnum.preview,
        conversationId: CONV_ID,
        currentNode: nodes.start,
        startNode: nodes.start,
        botSettings: { welcomeMessages: "Welcome!", blockedContent: [] },
        attributes: {},
      },
    });

    await service.handleMessage("start", buildUser());
    jest.runAllTimers();

    expect(deliveredValues(propagate)).toEqual([
      "Welcome!",
      "Message A",
      "Message B",
    ]);
    // No AI node in this flow -> the AI service must never be called.
    expect(httpPost).not.toHaveBeenCalled();
  });

  it("mixed flow runs static nodes first, then calls AI only at the AI node", async () => {
    const nodes: Record<string, AnyNode> = {
      start: { id: "start", nodeType: NodeTypeEnum.START_NODE, next: ["a"], responses: [] },
      a: {
        id: "a",
        nodeType: NodeTypeEnum.BOT_RESPONSE,
        next: ["ai"],
        responses: [{ type: "text", value: "Static first" }],
      },
      ai: { id: "ai", nodeType: NodeTypeEnum.AI_NODE, next: [], responses: [], payload: {} },
    };

    const { service, propagate, httpPost } = buildService({
      nodes,
      initialState: {
        mode: ModeEnum.preview,
        conversationId: CONV_ID,
        currentNode: nodes.start,
        startNode: nodes.start,
        botId: "bot-1",
        botName: "Bot",
        botSettings: { welcomeMessages: "Welcome!", blockedContent: [] },
        attributes: {},
      },
      aiResponse: { answer: "AI reply", confident: true, tokens_used: 2 },
    });

    await service.handleMessage("start", buildUser());
    jest.runAllTimers();

    expect(deliveredValues(propagate)).toEqual([
      "Welcome!",
      "Static first",
      "AI reply",
    ]);
    expect(httpPost).toHaveBeenCalledTimes(1);
  });

  it("resets the per-conversation delay baseline on every inbound message", async () => {
    const nodes: Record<string, AnyNode> = {
      start: { id: "start", nodeType: NodeTypeEnum.START_NODE, next: ["a"], responses: [] },
      a: {
        id: "a",
        nodeType: NodeTypeEnum.BOT_RESPONSE,
        next: [],
        responses: [{ type: "text", value: "A" }],
      },
    };

    const { service } = buildService({
      nodes,
      initialState: {
        mode: ModeEnum.preview,
        conversationId: CONV_ID,
        currentNode: nodes.start,
        startNode: nodes.start,
        botSettings: { welcomeMessages: "W", blockedContent: [] },
        attributes: {},
      },
    });

    // Simulate a long-lived session that already accumulated a large baseline.
    // The baseline now lives in the visitor's socket state (messageDelay).
    (service as any).socketStateService.updateUserData(USER_ID, {
      messageDelay: 99999,
    });

    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    await service.handleMessage("start", buildUser());

    // The very first scheduled message of the new turn must fire at 0ms, proving
    // the stale accumulated baseline was cleared (pre-fix it would be 99999+).
    expect(setTimeoutSpy.mock.calls[0][1]).toBe(0);
    jest.runAllTimers();
  });

  it("treats a node with no responses as a safe no-op", async () => {
    const { service, propagate, socketStateService } = buildService({
      nodes: {},
      initialState: {
        mode: ModeEnum.preview,
        conversationId: CONV_ID,
        currentNode: { id: "x", nodeType: NodeTypeEnum.BOT_RESPONSE, next: [] },
        botSettings: { blockedContent: [] },
        attributes: {},
      },
    });

    await expect(
      (service as any).sendBotMessage(USER_ID, [])
    ).resolves.not.toThrow();
    await expect(
      (service as any).sendBotMessage(USER_ID, undefined)
    ).resolves.not.toThrow();

    jest.runAllTimers();
    expect(propagate).not.toHaveBeenCalled();
    // Delay accumulator must never go negative from empty input.
    expect(
      socketStateService.getUserData(USER_ID)?.messageDelay ?? 0
    ).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Handover alert hooks: the agent alert is raised only by structured signals
 * (TRANSFER_TO_AGENT node, AI `handover: true`, Agent_Intent), never by text.
 */
describe("MessageHandlerService — handover alert hooks", () => {
  const USER_ID = "visitor-1";
  const CONV_ID = "conv-1";
  const user = { auth: { userId: USER_ID, name: "Visitor" } } as any;

  function harness(opts: {
    nodes: Record<string, any>;
    current: any;
    aiResponse?: any;
    agent?: any;
    botSettings?: any;
  }) {
    const store = new Map<string, any>();
    store.set(USER_ID, {
      mode: ModeEnum.live,
      conversationId: CONV_ID,
      botId: "bot-1",
      botName: "Bot",
      visitorName: "Digvijay",
      currentNode: opts.current,
      startNode: opts.current,
      botSettings: { blockedContent: [], ...(opts.botSettings || {}) },
      attributes: {},
    });
    const socketStateService = {
      getUserData: (id: string) => store.get(id),
      updateUserData: (id: string, patch: any) =>
        store.set(id, { ...(store.get(id) || {}), ...patch }),
      getNodeState: () => undefined,
      setNodeState: jest.fn(),
      getQuestionNodeState: () => undefined,
      setQuestionNodeState: jest.fn(),
    };
    const handover = {
      raise: jest.fn(async (_input: any): Promise<any> => ({ id: "alert-1" })),
      setAssigned: jest.fn(async () => undefined),
    };
    const agentService = {
      assignAgent: jest.fn(async () => opts.agent ?? null),
    };
    const propagate = jest.fn();
    const svc = new MessageHandlerService(
      { getBotNode: jest.fn(async (id: string) => opts.nodes[id] ?? null) } as any,
      socketStateService as any,
      {} as any,
      {} as any,
      {} as any,
      {
        getConversationById: jest.fn(async () => ({ chats: [] })),
        transferConversationToAgent: jest.fn(async () => undefined),
      } as any,
      { propagateEvent: propagate } as any,
      agentService as any,
      { create: () => undefined } as any,
      { findAnswer: jest.fn(async () => null) } as any,
      { emit: jest.fn() } as any,
      {
        post: jest.fn(() =>
          of({ status: 200, data: opts.aiResponse ?? { answer: "ok", confident: true } })
        ),
      } as any,
      {
        get: (k: string) =>
          ({ "delay.node": 0, "delay.message": 0, "ai.url": "http://ai", "ai.timeout": 1000 } as any)[k],
      } as any,
      {} as any,
      {} as any,
      {} as any,
      { orgIdForBot: async () => "org1" } as any,
      undefined,
      handover as any
    );
    return { svc, handover, agentService, propagate };
  }

  const ok = { id: "ok", nodeType: NodeTypeEnum.SUCCESS, next: [], responses: [] };
  const fail = { id: "fail", nodeType: NodeTypeEnum.FAILURE, next: [], responses: [] };
  const transfer = (payload: any = {}) => ({
    id: "t",
    nodeType: NodeTypeEnum.TRANSFER_TO_AGENT,
    next: ["ok", "fail"],
    responses: [],
    payload,
  });

  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance"] }));
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("TRANSFER_TO_AGENT raises flow_transfer, then records the assigned agent", async () => {
    const t = transfer();
    const { svc, handover } = harness({
      nodes: { ok, fail, t },
      current: t,
      agent: { id: "agent-9", name: "Asha" },
    });
    await svc.TransferToAgent("talk to kone", t as any, USER_ID);
    expect(handover.raise).toHaveBeenCalledTimes(1);
    expect(handover.raise.mock.calls[0][0]).toMatchObject({
      conversationId: CONV_ID,
      botId: "bot-1",
      reason: "flow_transfer",
      visitorName: "Digvijay",
    });
    expect(handover.setAssigned).toHaveBeenCalledWith(CONV_ID, "agent-9");
  });

  it("an emergency node raises reason emergency", async () => {
    const t = transfer({ emergency: true });
    const { svc, handover } = harness({ nodes: { ok, fail, t }, current: t });
    await svc.TransferToAgent("emergency", t as any, USER_ID);
    expect(handover.raise.mock.calls[0][0].reason).toBe("emergency");
  });

  it("no agent online still raises the alert and takes FAILURE", async () => {
    const t = transfer();
    const { svc, handover } = harness({ nodes: { ok, fail, t }, current: t, agent: null });
    await svc.TransferToAgent("talk", t as any, USER_ID);
    expect(handover.raise).toHaveBeenCalledTimes(1);
    expect(handover.setAssigned).not.toHaveBeenCalled();
  });

  const aiNode = (next: string[]) => ({
    id: "ai",
    nodeType: NodeTypeEnum.AI_NODE,
    next,
    responses: [],
    payload: {},
  });

  it("AI handover:true raises ai_escalation (reason truncated) and routes to FAILURE", async () => {
    const ai = aiNode(["fail"]);
    const { svc, handover, propagate } = harness({
      nodes: { ai, fail },
      current: ai,
      aiResponse: {
        answer: "Let me connect you with a specialist.",
        confident: false,
        handover: true,
        handover_reason: "r".repeat(400),
      },
    });
    await svc.handleAiResponse("i want a human", ai as any, USER_ID);
    jest.runAllTimers();
    expect(handover.raise).toHaveBeenCalledTimes(1);
    expect(handover.raise.mock.calls[0][0]).toMatchObject({ reason: "ai_escalation" });
    expect(handover.raise.mock.calls[0][0].handoverReason).toHaveLength(200);
    expect(propagate.mock.calls.map((c) => c[0]?.data?.message?.value)).toContain(
      "Let me connect you with a specialist."
    );
  });

  it("AI handover:true with no FAILURE child transfers to an agent directly", async () => {
    const ai = aiNode([]);
    const { svc, handover, agentService } = harness({
      nodes: { ai },
      current: ai,
      aiResponse: { answer: "", confident: true, handover: true },
    });
    const transferSpy = jest.spyOn(svc, "TransferToAgent").mockResolvedValue(undefined);
    await svc.handleAiResponse("talk to a person", ai as any, USER_ID);
    expect(handover.raise).toHaveBeenCalledTimes(1);
    expect(transferSpy).toHaveBeenCalledTimes(1);
    expect(agentService.assignAgent).not.toHaveBeenCalled(); // spy short-circuits
  });

  it.each([
    ["handover false", { answer: "I can't connect you to an agent here, sorry.", confident: true, handover: false }],
    ["handover missing", { answer: "Our agents are available 9-5.", confident: true }],
    ["handover non-boolean", { answer: "Talk to an agent? Sure.", confident: true, handover: "true" }],
  ])("AI %s never raises an alert, whatever the answer text", async (_label, aiResponse) => {
    const ai = aiNode([]);
    const { svc, handover } = harness({ nodes: { ai }, current: ai, aiResponse });
    await svc.handleAiResponse("question", ai as any, USER_ID);
    jest.runAllTimers();
    expect(handover.raise).not.toHaveBeenCalled();
  });

  it("Agent_Intent phrase raises visitor_intent only when configured", async () => {
    const bot = { id: "b", nodeType: NodeTypeEnum.BOT_RESPONSE, next: [], responses: [] };
    const configured = harness({
      nodes: { b: bot },
      current: bot,
      botSettings: { agentIntents: ["talk to agent", "human"] },
    });
    await configured.svc.handleMessage("Please, I need a HUMAN!", user);
    expect(configured.handover.raise).toHaveBeenCalledTimes(1);
    expect(configured.handover.raise.mock.calls[0][0].reason).toBe("visitor_intent");

    const unconfigured = harness({ nodes: { b: bot }, current: bot });
    await unconfigured.svc.handleMessage("I need a human", user);
    expect(unconfigured.handover.raise).not.toHaveBeenCalled();
  });
});
