/**
 * crm-incident-handover Phase 4 on the legacy socket path:
 * owner-only replies (R7.2, R8.9) and the owner typing signal (R8.6–R8.8).
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { lastValueFrom } from "rxjs";
import { AGENT_TYPING_THROTTLE_MS, JarCubeGateway } from "./jarcube.gateway";

const VISITOR = "64c0000000000000000000a1";

function setup(state: any) {
  const store = new Map<string, any>([
    [VISITOR, { conversationId: "64c0000000000000000000c1", ...state }],
    // Agents have their own (minimal) socket state.
    ["a1", { role: "agent" }],
    ["a2", { role: "agent" }],
  ]);
  const emitted: any[] = [];
  const events: any[] = [];
  const mh = { emitEventToUser: jest.fn((to: string, ev: string, data: any) => emitted.push({ to, ev, data })) };
  const gw = new JarCubeGateway(
    mh as any,
    { getUserData: (id: string) => store.get(id) } as any,
    { getConversationById: async () => ({}) } as any, // caller is in the org
    {} as any,
    {} as any,
    { emit: (n: string, p: any) => events.push({ n, p }) } as any,
    { findOne: async (id: string) => ({ _id: id, name: id === "a2" ? "Priya" : "", email: "p@x.io" }) } as any,
  );
  const agent = (id: string) => ({ auth: { userId: id, _id: id, role: "agent", name: `Agent ${id}` } }) as any;
  return { gw, emitted, events, store, agent, mh };
}

const send = (gw: JarCubeGateway, client: any, text: string) =>
  gw.handleEvents(client, { event: "chat-message-from-agent", data: { to: VISITOR, message: text } }).then(lastValueFrom);

describe("legacy agent replies are owner-only (R7.2)", () => {
  it("delivers the owner's reply", async () => {
    const h = setup({ handledByAgent: true, assignedAgentId: "a1" });
    await send(h.gw, h.agent("a1"), "hello");
    expect(h.emitted).toHaveLength(1);
    expect(h.emitted[0]).toMatchObject({ to: VISITOR, ev: "chat-message-bot" });
  });

  it("rejects a non-owner by name, delivers nothing, and returns the text", async () => {
    const h = setup({ handledByAgent: true, assignedAgentId: "a2" });
    const res: any = await send(h.gw, h.agent("a1"), "hello");
    expect(h.emitted).toHaveLength(0);
    expect(res).toEqual({
      event: "chat-message-rejected",
      data: expect.objectContaining({ reason: "not_thread_owner", ownerName: "Priya", text: "hello", visitorId: VISITOR }),
    });
  });

  it("falls back to the owner's email when nameless", async () => {
    const h = setup({ handledByAgent: true, assignedAgentId: "a3" });
    const res: any = await send(h.gw, h.agent("a1"), "hi");
    expect(res.data.ownerName).toBe("p@x.io");
  });
});

describe("owner typing signal (R8.6–R8.8)", () => {
  const typing = (gw: JarCubeGateway, client: any) =>
    gw.handleAgentTyping(client, { data: { visitorId: VISITOR, threadId: "t1" } });

  it("fans out once per 3 s, only for the owner, and reaches the widget when typingIndicator is on", async () => {
    const h = setup({ handledByAgent: true, assignedAgentId: "a1", botSettings: { typingIndicator: true } });
    const now = jest.spyOn(Date, "now");
    now.mockReturnValue(1_000_000);
    await typing(h.gw, h.agent("a1"));
    await typing(h.gw, h.agent("a1"));
    now.mockReturnValue(1_000_000 + AGENT_TYPING_THROTTLE_MS);
    await typing(h.gw, h.agent("a1"));
    await typing(h.gw, h.agent("a2")); // not the owner
    now.mockRestore();
    expect(h.events.filter((e) => e.n === "inbox.agent.typing")).toHaveLength(2);
    expect(h.emitted.filter((e) => e.ev === "typing")).toHaveLength(2);
    expect(h.events[0].p).toMatchObject({ visitorId: VISITOR, threadId: "t1", agentId: "a1", name: "Agent a1" });
  });

  it("does not reach the widget when typingIndicator is off", async () => {
    const h = setup({ handledByAgent: true, assignedAgentId: "a1", botSettings: {} });
    await typing(h.gw, h.agent("a1"));
    expect(h.events).toHaveLength(1);
    expect(h.emitted).toHaveLength(0);
  });

  it("ignores visitors and unowned chats", async () => {
    const h = setup({ handledByAgent: false });
    await typing(h.gw, h.agent("a1"));
    await typing(h.gw, { auth: { userId: "v", role: "visitor" } } as any);
    expect(h.events).toHaveLength(0);
  });
});
