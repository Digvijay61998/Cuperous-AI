/**
 * crm-incident-handover tasks 7.4, 7.5, 7.9: what happens to chats when a
 * conversation ends. Property 7: no chat is deleted without a merge.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import * as fc from "fast-check";
import { fakeModel, fakeMongo, oid } from "./fakes.testspec";
import { decideLifecycle, LifecycleFacts, MAX_MERGE_RUNS } from "./lifecycle";
import { ProfileMergeFailed } from "./profile.service";
import { SessionLifecycleService } from "./session-lifecycle.service";

const SETTING = oid();
const BOT = oid();

function setup(
  o: {
    conv?: any;
    incidents?: any[];
    mode?: "dry_run" | "live";
    flag?: boolean;
    merge?: jest.Mock;
    chats?: number;
    transcripts?: { snapshotForConversation: jest.Mock };
  } = {},
) {
  const convId = oid();
  const conv = { _id: convId, bot: BOT, platform: "widget", crmContactId: "ct1", endedAt: new Date("2026-10-09T10:00:00Z"), status: "completed", transcriptState: "kept", mergeAttempts: 0, chats: ["a"], ...(o.conv || {}) };
  const Chat = fakeModel(Array.from({ length: o.chats ?? 3 }, (_, i) => ({ _id: oid(), conversationId: convId, time: new Date("2026-10-09T09:0" + i + ":00Z") })));
  const models = {
    Conversation: fakeModel([conv]),
    Chat,
    Incident: fakeModel(o.incidents?.map((i) => ({ conversationId: convId, ...i })) ?? []),
    Bot: fakeModel([{ _id: BOT, botSetting: SETTING }]),
    BotSetting: fakeModel([{ _id: SETTING, features: { profileSummaries: o.flag ?? true } }]),
  };
  const merge = o.merge ?? jest.fn(async () => ({ status: "merged", ai: true, contactId: "ct1" }));
  const svc = new SessionLifecycleService(
    { merge } as any,
    { get: (k: string) => (k === "crm.profilePurgeMode" ? o.mode ?? "live" : undefined) } as any,
    fakeMongo(models),
    o.transcripts as any,
  );
  (svc as any).logger = { log: () => undefined, warn: () => undefined, error: () => undefined };
  const state = () => models.Conversation.docs[0];
  return { svc, models, convId, merge, state, chats: () => Chat.docs.length };
}

describe("decideLifecycle", () => {
  const base: LifecycleFacts = { ended: true, flagOn: true, mode: "live", openIncident: false, hasIncident: false, contactId: "c" };
  it.each<[string, Partial<LifecycleFacts>, string]>([
    ["other channel", { platform: "whatsapp" }, "skip"],
    ["flag off", { flagOn: false }, "skip"],
    ["still open", { ended: false }, "skip"],
    ["already summarised", { state: "summarised" }, "skip"],
    ["already purged", { state: "purged" }, "skip"],
    ["expired but still in use", { recentActivity: true }, "skip"],
    ["open incident (R18.6)", { openIncident: true }, "keep"],
    ["no contact, no incident (R18.7)", { contactId: null }, "purge"],
    ["contact (R18.2)", {}, "merge"],
    ["incident without contact", { contactId: null, hasIncident: true }, "merge"],
    ["dry-run marker in dry run", { state: "would_purge", mode: "dry_run" }, "skip"],
    ["dry-run marker in live", { state: "would_purge", plan: "purge" }, "finish"],
  ])("%s -> %s", (_n, f, action) => {
    expect(decideLifecycle({ ...base, ...f }).action).toBe(action);
  });
});

describe("SessionLifecycleService", () => {
  it("live: merges, then deletes the chats and keeps the counters (R18.5)", async () => {
    const h = setup();
    expect(await h.svc.process(h.convId)).toBe("summarised");
    expect(h.merge).toHaveBeenCalledWith(h.convId, { allowFallback: false });
    expect(h.chats()).toBe(0);
    expect(h.state()).toMatchObject({ transcriptState: "summarised", transcriptPlan: "summarise", messageCount: 3, chats: [] });
    expect(h.state().lifecycleLeaseUntil).toBeUndefined();
  });

  it("dry run: merges but only marks would_purge, nothing deleted (rollout §2)", async () => {
    const h = setup({ mode: "dry_run" });
    expect(await h.svc.process(h.convId)).toBe("would_purge");
    expect(h.merge).toHaveBeenCalled();
    expect(h.chats()).toBe(3);
    expect(h.state()).toMatchObject({ transcriptState: "would_purge", transcriptPlan: "summarise", messageCount: 3 });
  });

  it("switching to live finishes a dry-run conversation without merging again", async () => {
    const h = setup({ conv: { transcriptState: "would_purge", transcriptPlan: "summarise" } });
    expect(await h.svc.process(h.convId)).toBe("summarised");
    expect(h.merge).not.toHaveBeenCalled();
    expect(h.chats()).toBe(0);
  });

  it("no contact and no incident: deleted without generating anything (R18.7)", async () => {
    const h = setup({ conv: { crmContactId: undefined } });
    expect(await h.svc.process(h.convId)).toBe("purged");
    expect(h.merge).not.toHaveBeenCalled();
    expect(h.chats()).toBe(0);
  });

  it("open incident: chats kept until it closes, then summarised (R18.6)", async () => {
    const h = setup({ incidents: [{ status: "waiting", crmContactId: "ct1" }] });
    expect(await h.svc.process(h.convId)).toBe("kept_open_incident");
    expect(h.chats()).toBe(3);
    h.models.Incident.docs[0].status = "resolved";
    await h.svc.onIncidentClosed({ conversationId: h.convId });
    expect(h.state().transcriptState).toBe("summarised");
    expect(h.chats()).toBe(0);
  });

  it("an incident that closes while the chat is still open does nothing yet", async () => {
    const h = setup({ conv: { endedAt: undefined, status: "in_progress" }, incidents: [{ status: "resolved" }] });
    await h.svc.onIncidentClosed({ conversationId: h.convId });
    expect(h.merge).not.toHaveBeenCalled();
    expect(h.chats()).toBe(3);
  });

  it("flag off, other channels, agent release: untouched", async () => {
    for (const h of [setup({ flag: false }), setup({ conv: { platform: "whatsapp" } })]) {
      expect(await h.svc.process(h.convId)).toBe("skipped");
      expect(h.chats()).toBe(3);
    }
    const h = setup();
    await h.svc.onConversationEnded({ conversationId: h.convId, cause: "agent_release" });
    expect(h.merge).not.toHaveBeenCalled();
  });

  it("an expired conversation still in use is left for later", async () => {
    const recent = new Date();
    const h = setup({ conv: { endedAt: undefined, status: "expired" } });
    h.models.Chat.docs[0].time = recent;
    expect(await h.svc.process(h.convId, { now: new Date(recent.getTime() + 60_000) })).toBe("skipped");
    expect(await h.svc.process(h.convId, { now: new Date(recent.getTime() + 31 * 60_000) })).toBe("summarised");
  });

  it("merge failure: chats kept, pending_merge, retried daily, fallback only on the last run (R18.10)", async () => {
    const merge = jest.fn(async (_id: string, o: any) => {
      if (o.allowFallback) return { status: "merged", ai: false };
      throw new ProfileMergeFailed("AI down");
    });
    const h = setup({ merge });
    expect(await h.svc.process(h.convId)).toBe("pending_merge");
    expect(h.state()).toMatchObject({ transcriptState: "pending_merge", mergeAttempts: 1, lastMergeError: "AI down" });
    expect(h.chats()).toBe(3);
    // Daily runs 2 and 3 still fail without the fallback; run 4 may use it.
    await h.svc.runDaily();
    await h.svc.runDaily();
    expect(h.state().mergeAttempts).toBe(3);
    expect(h.chats()).toBe(3);
    const counts = await h.svc.runDaily();
    expect(counts).toMatchObject({ summarised: 1 });
    expect(merge.mock.calls.map((c) => c[1].allowFallback)).toEqual([false, false, false, true]);
    expect(h.chats()).toBe(0);
    expect(MAX_MERGE_RUNS).toBe(4);
  });

  it("no contact ever linked: after the retries the chats are kept, not deleted", async () => {
    const merge = jest.fn(async () => {
      throw new ProfileMergeFailed("conversation has no CRM contact");
    });
    const h = setup({ conv: { crmContactId: undefined }, incidents: [{ status: "closed" }], merge });
    for (let i = 0; i < MAX_MERGE_RUNS; i++) await h.svc.process(h.convId, { daily: true });
    expect(h.state().transcriptState).toBe("kept");
    expect(h.chats()).toBe(3);
    await h.svc.runDaily();
    expect(merge).toHaveBeenCalledTimes(MAX_MERGE_RUNS);
  });

  it("one worker at a time: a concurrent end event and incident close merge once", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const merge = jest.fn(async () => {
      await gate;
      return { status: "merged", ai: true };
    });
    const h = setup({ merge });
    const a = h.svc.process(h.convId);
    await new Promise((r) => setImmediate(r));
    const b = await h.svc.process(h.convId);
    release();
    expect(await a).toBe("summarised");
    expect(b).toBe("busy");
    expect(merge).toHaveBeenCalledTimes(1);
  });

  it("daily run repairs a summarised conversation whose delete did not happen", async () => {
    const h = setup({ conv: { transcriptState: "summarised" } });
    const counts = await h.svc.runDaily();
    expect(counts.repaired).toBe(1);
    expect(h.chats()).toBe(0);
  });

  it("daily run picks up a missed end event", async () => {
    const h = setup();
    const counts = await h.svc.runDaily(new Date("2026-10-09T12:00:00Z"));
    expect(counts.summarised).toBe(1);
  });

  it("Property 7: whatever fails, chats are deleted only after a successful merge", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("ai_error", "invalid", "contact_gone", "ok"),
        fc.constantFrom<"dry_run" | "live">("dry_run", "live"),
        fc.boolean(),
        async (failure, mode, openIncident) => {
          const merge = jest.fn(async () => {
            if (failure === "ok") return { status: "merged", ai: true };
            throw new ProfileMergeFailed(failure);
          });
          const h = setup({ merge, mode, incidents: openIncident ? [{ status: "agent_active" }] : [] });
          await h.svc.process(h.convId);
          const deleted = h.chats() === 0;
          const shouldDelete = failure === "ok" && mode === "live" && !openIncident;
          return deleted === shouldDelete;
        },
      ),
      { numRuns: 60 },
    );
  });
});

// crm-plugins-service-desk R16.2, Property 9: chats are copied onto the
// conversation's service requests before they are deleted.
describe("service request snapshot before deletion", () => {
  it("snapshots, then deletes", async () => {
    const transcripts = { snapshotForConversation: jest.fn(async () => 1) };
    const h = setup({ transcripts });
    expect(await h.svc.process(h.convId)).toBe("summarised");
    expect(transcripts.snapshotForConversation).toHaveBeenCalledWith(h.convId);
    expect(h.chats()).toBe(0);
  });

  it("property: a failed snapshot never deletes the chats; the daily repair retries", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("timeout", "db down", "boom"), async (msg) => {
        const transcripts = { snapshotForConversation: jest.fn<Promise<number>, [string]>(async () => { throw new Error(msg); }) };
        const h = setup({ transcripts });
        await h.svc.process(h.convId).catch(() => undefined);
        expect(h.chats()).toBe(3);
        // Marked done but rows left: the daily repair deletes once the snapshot works.
        transcripts.snapshotForConversation.mockResolvedValue(1);
        await h.svc.runDaily(new Date("2026-10-10T12:00:00Z"));
        expect(h.chats()).toBe(0);
      }),
      { numRuns: 3 },
    );
  });
});
