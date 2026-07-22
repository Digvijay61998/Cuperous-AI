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
      {} as any, // agent
      { create: noop } as any, // unanswered
      questionsService as any,
      eventEmitter as any,
      httpService as any,
      configService as any,
      {} as any, // messagingRegistry
      {} as any, // templateSession
      {} as any // template
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
    jest.useFakeTimers();
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
    (service as any).delay[CONV_ID] = 99999;

    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    await service.handleMessage("start", buildUser());

    // The very first scheduled message of the new turn must fire at 0ms, proving
    // the stale accumulated baseline was cleared (pre-fix it would be 99999+).
    expect(setTimeoutSpy.mock.calls[0][1]).toBe(0);
    jest.runAllTimers();
  });

  it("treats a node with no responses as a safe no-op", async () => {
    const { service, propagate } = buildService({
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
    expect((service as any).delay[CONV_ID] ?? 0).toBeGreaterThanOrEqual(0);
  });
});
