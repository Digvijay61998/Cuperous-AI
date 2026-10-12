/**
 * Regression: a broken WEBHOOK node must not trap the conversation.
 *
 * Reproduces the KONE flow as imported with placeholder webhook ids
 * ("REPLACE_ME_..."). `callWebhook` throws for an unknown id; that used to
 * escape to handleNode's catch, which sent "Sorry, I did not understand that"
 * and left the visitor parked on the webhook node — so EVERY later message
 * re-ran the broken webhook and got the same apology.
 */
import * as path from "path";
import { of } from "rxjs";
import { MessageHandlerService } from "./message-handler.service";

const flow = require(path.resolve(
  __dirname,
  "../../../docs/koneTrainingData/bot/kone-mykone-assistant-flow.json",
));

const FALLBACK = "Sorry, I did not understand that. Please try again.";
const USER = "v1";

function harness() {
  const nodes: Record<string, any> = {};
  for (const n of flow.nodes) nodes[n.id] = { ...n, next: [] };
  for (const e of flow.edges) nodes[e.source]?.next.push(e.target);

  const store = new Map<string, any>();
  store.set(USER, {
    botId: "bot1",
    conversationId: "c1",
    mode: "live",
    currentNode: nodes.kone_start,
    startNode: nodes.kone_start,
    botSettings: { fallbackMessage: FALLBACK },
  });
  const nodeState = new Map<string, any>();
  const ss: any = {
    getUserData: (id: string) => store.get(id),
    updateUserData: (id: string, p: any) => store.set(id, { ...(store.get(id) || {}), ...p }),
    getNodeState: (_u: string, id: string) => nodeState.get(id) ?? "NEW",
    setNodeState: (_u: string, id: string, s: any) => nodeState.set(id, s),
    getQuestionNodeState: (u: string, id: string) => store.get(u)?.questionNodeState?.[id],
    setQuestionNodeState: (u: string, id: string, v: any) =>
      store.set(u, {
        ...store.get(u),
        questionNodeState: { ...(store.get(u)?.questionNodeState || {}), [id]: v },
      }),
  };
  const sent: string[] = [];
  const svc = new MessageHandlerService(
    { getBotNode: async (id: string) => nodes[id] ?? null } as any,
    ss,
    {} as any,
    // The webhook id is a placeholder -> callWebhook throws, like production.
    { callWebhook: async () => { throw new Error("Webhook not found"); } } as any,
    {} as any,
    { getConversationById: async () => ({ chats: [] }) } as any,
    { propagateEvent: (e: any) => sent.push(e?.data?.message?.value) } as any,
    {} as any,
    { create: () => undefined } as any,
    { findAnswer: async () => null } as any,
    { emit: () => undefined } as any,
    { post: jest.fn(() => of({ status: 200, data: { answer: "AI", confident: true } })) } as any,
    { get: (k: string) => ({ "delay.node": 0, "delay.message": 0, "ai.url": "x", "ai.timeout": 1 } as any)[k] } as any,
    {} as any,
    {} as any,
    // OPEN_TEMPLATE lookup fails like an unconfigured template; handled internally.
    { findOne: async () => null } as any,
    { orgIdForBot: async () => "org1" } as any,
    undefined,
    { raise: jest.fn(async () => null), setAssigned: jest.fn(async () => undefined) } as any,
  );
  (svc as any).logger.error = () => undefined;
  (svc as any).logger.warn = () => undefined;
  return { svc, sent, store };
}

describe("broken WEBHOOK node does not trap the visitor (KONE flow)", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance"] } as any));
  afterEach(() => jest.useRealTimers());

  const say = async (h: ReturnType<typeof harness>, text: string) => {
    h.sent.length = 0;
    await h.svc.handleMessage(text, { auth: { userId: USER, name: "V" } } as any);
    jest.runAllTimers();
    await Promise.resolve();
    jest.runAllTimers();
    return [...h.sent];
  };

  it("routes the failing webhook to its FAILURE branch and keeps the flow alive", async () => {
    const h = harness();
    await say(h, "start");
    await say(h, "delivery");

    const projects = await say(h, "my projects");
    expect(projects).not.toContain(FALLBACK);
    expect(projects.join(" ")).toMatch(/can't load your delivery data/i);

    const agent = await say(h, "talk to agent");
    expect(agent).not.toContain(FALLBACK);
    expect(agent.join(" ")).toMatch(/KONE specialist/i);

    const next = await say(h, "hello");
    expect(next).not.toContain(FALLBACK);
  });

  it("a node that throws is not left as the resting node", async () => {
    const h = harness();
    await say(h, "start");
    // Force an unexpected throw inside a node handler.
    (h.svc as any).handleBotResponse = async () => {
      throw new Error("boom");
    };
    await say(h, "anything");
    expect(h.store.get(USER).currentNode?.id).toBe("kone_start");
  });
});
