/** crm-incident-handover R9.3, R14.7: no automatic "start" on resume/reconnect. */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { JarCubeGateway } from "./jarcube.gateway";

const start = { id: "start" };
function setup(state: any) {
  const store = new Map<string, any>([["v1", state]]);
  const mh = { handleMessage: jest.fn(async () => undefined) };
  const gw = new JarCubeGateway(
    mh as any,
    {
      getUserData: (id: string) => store.get(id),
      updateUserData: (id: string, p: any) => store.set(id, { ...store.get(id), ...p }),
    } as any,
    {} as any,
    {} as any,
    {} as any,
    { emit: () => undefined } as any,
    {} as any,
  );
  const visitor = { auth: { userId: "v1", role: "visitor" } } as any;
  return { gw, mh, store, visitor };
}

describe("handleConnection", () => {
  it("sends start for a brand-new conversation", async () => {
    const h = setup({ currentNode: start, startNode: start });
    await h.gw.handleConnection(h.visitor);
    expect(h.mh.handleMessage).toHaveBeenCalledWith("start", h.visitor, "text", "en");
  });

  it.each([
    ["a resumed conversation", { resumed: true, currentNode: start, startNode: start }],
    ["one with history", { hasHistory: true, currentNode: start, startNode: start }],
    ["a reconnect mid-flow", { currentNode: { id: "q2" }, startNode: start }],
    ["a chat an agent is handling", { handledByAgent: true, currentNode: start, startNode: start }],
  ])("skips start for %s", async (_n, state) => {
    const h = setup(state);
    await h.gw.handleConnection(h.visitor);
    expect(h.mh.handleMessage).not.toHaveBeenCalled();
  });

  it("consumes the resume flag so a later fresh connection starts", async () => {
    const h = setup({ resumed: true, currentNode: start, startNode: start });
    await h.gw.handleConnection(h.visitor);
    await h.gw.handleConnection(h.visitor);
    expect(h.mh.handleMessage).toHaveBeenCalledTimes(1);
  });

  it("does nothing for agents", async () => {
    const h = setup({});
    await h.gw.handleConnection({ auth: { userId: "a1", role: "agent" } } as any);
    expect(h.mh.handleMessage).not.toHaveBeenCalled();
  });
});

describe("Ended_State (R14.6, R14.7)", () => {
  const ended = { conversationEnded: true, conversationId: "c1", currentNode: start, startNode: start };

  it("a reconnect to a closed conversation sends no start and re-sends the Ended_State", async () => {
    const h = setup(ended);
    const emit = jest.fn();
    await h.gw.handleConnection({ ...h.visitor, emit } as any);
    expect(h.mh.handleMessage).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith("conversation-ended", expect.objectContaining({ conversationId: "c1" }));
  });

  it("refuses visitor input after the close and answers with the Ended_State", async () => {
    const h = setup(ended);
    const out: any = await new Promise((r) =>
      (h.gw.handleEvents(h.visitor, { event: "chat-message-bot", data: { message: "hello" } }) as any).then((o: any) =>
        o.subscribe(r),
      ),
    );
    expect(h.mh.handleMessage).not.toHaveBeenCalled();
    expect(out.event).toBe("conversation-ended");
  });
});
