/**
 * crm-incident-handover Phase 6: a conversation ends exactly once, records
 * why, and only a closure / CLOSE_CHAT end counts as the Ended_State (R14.7;
 * an expiry or disconnect starts fresh, R9.11).
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { Types } from "mongoose";
import { ConversationService } from "./conversation.service";

const ID = new Types.ObjectId().toString();

function setup(row: any = {}) {
  const doc: any = { _id: ID, activities: ["a1"], status: "in_progress", ...row };
  const updates: any[] = [];
  const conversationModel: any = {
    findById: (id: string) => {
      const value = String(id) === ID ? { ...doc } : null;
      const q: any = Promise.resolve(value);
      q.select = () => ({ lean: async () => value });
      return q;
    },
    updateOne: jest.fn(async (filter: any, update: any) => {
      updates.push({ filter, update });
      if (filter.endedAt?.$exists === false && doc.endedAt) return { modifiedCount: 0 };
      if (filter["awaitingClosure.sentAt"] && +filter["awaitingClosure.sentAt"] !== +doc.awaitingClosure?.sentAt) {
        return { modifiedCount: 0 };
      }
      Object.assign(doc, update.$set || {});
      for (const k of Object.keys(update.$unset || {})) delete doc[k];
      return { modifiedCount: 1 };
    }),
  };
  const activity: any = { startedAt: new Date(Date.now() - 5000), save: jest.fn(async () => undefined) };
  const activities: any = { findOne: async () => activity };
  const emitted: any[] = [];
  const svc = new ConversationService(
    conversationModel,
    {} as any,
    activities,
    { emit: (name: string, p: any) => emitted.push({ name, p }) } as any,
    {} as any,
  );
  (svc as any).logger = { error: () => undefined, warn: () => undefined, log: () => undefined };
  return { svc, doc, emitted, updates, conversationModel };
}

describe("ConversationService end-of-conversation (R14)", () => {
  it("records endedAt and the cause, clears a pending prompt, emits once", async () => {
    const h = setup({ awaitingClosure: { sentAt: new Date() } });
    await h.svc.endConversation(ID, undefined, "closure_resolved");
    expect(h.doc).toMatchObject({ status: "completed", endCause: "closure_resolved" });
    expect(h.doc.endedAt).toBeInstanceOf(Date);
    expect(h.doc.awaitingClosure).toBeUndefined();
    expect(h.emitted).toEqual([{ name: "conversation.ended", p: { conversationId: ID, cause: "closure_resolved" } }]);
  });

  it("a second end (disconnect after the close) changes nothing and emits nothing", async () => {
    const h = setup();
    await h.svc.endConversation(ID, undefined, "idle");
    await h.svc.endConversation(ID, "expired" as any, "disconnect");
    expect(h.doc.endCause).toBe("idle");
    expect(h.doc.status).toBe("completed");
    expect(h.emitted).toHaveLength(1);
  });

  it("losing a concurrent end (conditional update matched nothing) emits nothing", async () => {
    const h = setup();
    h.conversationModel.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
    await h.svc.endConversation(ID, undefined, "idle");
    expect(h.emitted).toHaveLength(0);
  });

  it.each([
    ["closure_resolved", true],
    ["idle", true],
    ["close_chat", true],
    ["expired", false],
    ["disconnect", false],
  ])("resumeFacts: ended by %s -> Ended_State %s", async (cause, ended) => {
    const h = setup({ bot: "b", visitor: "v", status: "completed", endedAt: new Date(), endCause: cause, chats: [] });
    expect((await h.svc.resumeFacts(ID))?.ended).toBe(ended);
  });

  it("claimClosure wins only for the same prompt", async () => {
    const sentAt = new Date(1_700_000_000_000);
    const h = setup({ awaitingClosure: { sentAt, idleMinutes: 10 } });
    expect(await h.svc.claimClosure(ID, new Date(sentAt.getTime() + 1))).toBe(false);
    expect(await h.svc.claimClosure(ID, sentAt)).toBe(true);
    expect(h.doc.awaitingClosure).toBeUndefined();
    expect(await h.svc.claimClosure("not-an-id", sentAt)).toBe(false);
  });

  it("setAwaitingClosure never re-opens a prompt on an ended conversation", async () => {
    const h = setup({ endedAt: new Date() });
    await h.svc.setAwaitingClosure(ID, { sentAt: new Date(), idleMinutes: 10 });
    expect(h.doc.awaitingClosure).toBeUndefined();
  });
});
