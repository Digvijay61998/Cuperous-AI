/** crm-plugins-service-desk R4.4: the inbox shows a visitor's new name without a reload. */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));
import { Types } from "mongoose";
import { WidgetInboxBridgeService } from "./widget-inbox-bridge.service";

const thread = (o: any = {}) => ({
  _id: new Types.ObjectId(),
  channel: "widget",
  chatId: "c1",
  bot: { _id: "bot1", name: "Bot" },
  visitor: { _id: "v1", name: "Raj Kumar" },
  ...o,
});

function setup(threads: any[]) {
  const published: any[] = [];
  const threadsSvc = { findForVisitorOrConversation: jest.fn(async () => threads) };
  const svc = new WidgetInboxBridgeService(
    {} as any,
    threadsSvc as any,
    { publishThreadUpdated: async (p: any) => published.push(p) } as any,
    {} as any,
  );
  (svc as any).logger = { warn: () => undefined };
  return { svc, published, threadsSvc };
}

describe("visitor details -> inbox thread refresh", () => {
  it("republishes every thread of the visitor with the new name", async () => {
    const h = setup([thread(), thread({ channel: "whatsapp_web", bot: "bot2" })]);
    await h.svc.onVisitorDetailsUpdated({ visitorId: "v1", conversationId: "c1", botId: "bot1", name: "Raj Kumar" });
    expect(h.threadsSvc.findForVisitorOrConversation).toHaveBeenCalledWith("v1", "c1");
    expect(h.published.map((p) => [p.botId, p.channel, p.thread.name])).toEqual([
      ["bot1", "widget", "Raj Kumar"],
      ["bot2", "whatsapp_web", "Raj Kumar"],
    ]);
  });

  it("never throws", async () => {
    const h = setup([]);
    h.threadsSvc.findForVisitorOrConversation.mockRejectedValueOnce(new Error("mongo down"));
    await expect(
      h.svc.onVisitorDetailsUpdated({ visitorId: "v1", conversationId: "c1", botId: "b" }),
    ).resolves.toBeUndefined();
  });
});
