/** crm-incident-handover task 7.6: the Visitor_Profile reaches /query/ask (R18.8). */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { of } from "rxjs";
import { MessageHandlerService } from "./message-handler.service";

const USER = "64c0000000000000000000a1";
const CONV = "64c0000000000000000000c1";
const PROFILE = { facts: { products: ["Lift 2"] }, entries: [{ at: "2026-10-01", summary: "Door fault", ticketRef: "SR_1" }] };

function harness(o: { features?: any; mode?: string; context?: () => Promise<any> } = {}) {
  const store = new Map<string, any>([
    [USER, { botId: "b1", botName: "Assistant", conversationId: CONV, mode: o.mode ?? "live", botSettings: { features: o.features ?? { profileSummaries: true } } }],
  ]);
  const ss: any = {
    getUserData: (id: string) => store.get(id),
    updateUserData: (id: string, p: any) => store.set(id, { ...store.get(id), ...p }),
  };
  const post = jest.fn(() => of({ status: 200, data: { answer: "ok", confident: true } }));
  const profiles = { contextForConversation: jest.fn(o.context ?? (async () => PROFILE)) };
  const args: any[] = [
    { getBotNode: async () => null },
    ss,
    {},
    {},
    {},
    { getConversationById: async () => ({ chats: [] }) },
    { propagateEvent: () => undefined },
    {},
    {},
    {},
    { emit: () => undefined },
    { post },
    { get: (k: string) => ({ "delay.node": 0, "delay.message": 0, "ai.url": "http://ai", "ai.timeout": 1000 } as any)[k] },
    {},
    {},
    {},
    {},
    undefined, // entitlement
    undefined, // handover alerts
    undefined, // incidents
    undefined, // identity prompt
    profiles,
  ];
  const svc = new (MessageHandlerService as any)(...args) as MessageHandlerService;
  (svc as any).logger = { log: () => undefined, warn: () => undefined, error: () => undefined, debug: () => undefined, verbose: () => undefined };
  return { svc, post, profiles };
}

const bodyOf = (post: jest.Mock) => (post.mock.calls[0] as any[])[1];

describe("visitor_profile in the AI request (R18.8)", () => {
  it("is sent when profileSummaries is on", async () => {
    const h = harness();
    await h.svc.handleAiResponse("what is the warranty?", { id: "ai", next: [], payload: {} } as any, USER);
    expect(bodyOf(h.post).visitor_profile).toEqual(PROFILE);
    expect(h.profiles.contextForConversation).toHaveBeenCalledWith(CONV);
  });

  it.each([
    ["flag off", { features: {} }],
    ["preview", { mode: "preview" }],
  ])("is not sent: %s", async (_n, o) => {
    const h = harness(o as any);
    await h.svc.handleAiResponse("what is the warranty?", { id: "ai", next: [], payload: {} } as any, USER);
    expect(bodyOf(h.post)).not.toHaveProperty("visitor_profile");
    expect(h.profiles.contextForConversation).not.toHaveBeenCalled();
  });

  it("a slow or failing CRM never delays or breaks the answer", async () => {
    for (const context of [() => new Promise(() => undefined), async () => { throw new Error("db down"); }]) {
      const h = harness({ context: context as any });
      const t0 = Date.now();
      await h.svc.handleAiResponse("what is the warranty?", { id: "ai", next: [], payload: {} } as any, USER);
      expect(Date.now() - t0).toBeLessThan(1500);
      expect(bodyOf(h.post)).not.toHaveProperty("visitor_profile");
    }
  });
});
