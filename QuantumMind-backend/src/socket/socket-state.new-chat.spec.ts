/**
 * crm-incident-handover R14.9: "Start new chat" builds the new conversation's
 * state before the widget drops its old socket. That old socket's disconnect
 * must not delete the new state or end the new conversation.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { SocketStateService } from "./socket-state.service";

function setup() {
  const conversationService = { endConversation: jest.fn(), addattributes: jest.fn() };
  const svc = new SocketStateService(
    conversationService as any,
    { updateAgentStatus: jest.fn() } as any,
    { updateStatus: jest.fn() } as any,
    { get: () => undefined } as any,
  );
  const sock = (id: string) => ({ id, auth: { role: "visitor", userId: "v1" } }) as any;
  return { svc, conversationService, sock };
}

describe("SocketStateService.remove after Start new chat", () => {
  it("keeps the new conversation's state when the old socket leaves", () => {
    const h = setup();
    h.svc.updateUserData("v1", { conversationId: "old", handledByAgent: true });
    const old = h.sock("s-old");
    h.svc.add("v1", old);
    // POST /widget/visitor {newConversation} rebuilt the entry.
    h.svc.updateUserData("v1", { conversationId: "new", handledByAgent: false, conversationEnded: false });
    h.svc.remove("v1", old);
    expect(h.svc.getUserData("v1")).toMatchObject({ conversationId: "new", socket: [] });
    expect(h.conversationService.endConversation).not.toHaveBeenCalled();
  });

  it("a plain last-socket disconnect still clears the entry (unchanged)", () => {
    const h = setup();
    h.svc.updateUserData("v1", { conversationId: "c1" });
    const s = h.sock("s1");
    h.svc.add("v1", s);
    h.svc.remove("v1", s);
    expect(h.svc.getUserData("v1")).toBeUndefined();
  });

  it("an agent-handled conversation still expires when its own socket leaves (unchanged)", () => {
    const h = setup();
    h.svc.updateUserData("v1", { conversationId: "c1", handledByAgent: true });
    const s = h.sock("s1");
    h.svc.add("v1", s);
    h.svc.remove("v1", s);
    expect(h.conversationService.endConversation).toHaveBeenCalledWith("c1", "expired", "disconnect");
  });
});
