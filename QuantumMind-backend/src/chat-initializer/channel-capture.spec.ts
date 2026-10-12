/** crm-plugins-service-desk R1.4, R1.5, R22: social channels become CRM leads. */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));
import { ChatInitializerService } from "./chat-initializer.service";

function setup(existingState = false) {
  const state = new Map<string, any>();
  if (existingState) state.set("v1", { conversationId: "old" });
  const capture = { capture: jest.fn(async () => null) };
  const svc = new ChatInitializerService(
    { CreateVisitorfromSocialMedia: async () => "v1" } as any,
    {
      getBotDataForWidget: async () => ({ id: "bot1", name: "Bot", botSetting: {}, botFlow: { startNode: "n0" } }),
      getBotNode: async () => ({ id: "n0" }),
    } as any,
    { createConversation: async () => ({ id: "conv1" }) } as any,
    { getUserData: (id: string) => state.get(id), updateUserData: (id: string, d: any) => state.set(id, d) } as any,
    { emit: () => undefined } as any,
    capture as any,
  );
  return { svc, capture };
}

describe("ChatInitializerService channel capture", () => {
  it("captures the platform details when a conversation starts", async () => {
    const h = setup();
    const details = { name: "Raj", channel: { kind: "TELEGRAM", value: "42" } };
    await h.svc.initializeChat({ name: "Raj", username: "42", bot: "bot1", platform: "telegram" } as any, "bot1", {
      source: "telegram",
      details,
    });
    expect(h.capture.capture).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: "conv1", visitorId: "v1", botId: "bot1", channel: "telegram", mode: "live" }),
      { ...details, weakName: true }, // a display name never replaces a stated one
      "telegram",
    );
  });

  it("does not capture again for every message of an ongoing conversation", async () => {
    const h = setup(true);
    await h.svc.initializeChat({ name: "Raj", bot: "bot1", platform: "whatsapp" } as any, "bot1", {
      source: "whatsapp",
      details: { phone: "+919876543210" },
    });
    expect(h.capture.capture).not.toHaveBeenCalled();
  });

  it("works without capture details (old callers)", async () => {
    const h = setup();
    await expect(h.svc.initializeChat({ name: "x", bot: "bot1" } as any, "bot1")).resolves.toEqual({ visitorId: "v1" });
    expect(h.capture.capture).not.toHaveBeenCalled();
  });
});
