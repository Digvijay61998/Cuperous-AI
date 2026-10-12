/**
 * crm-incident-handover Phase 4: single owner per conversation (R7, Property 5).
 * Real ChannelThreadService.claim/release/override over an in-memory model
 * with atomic conditional findOneAndUpdate; real InboxService rules.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import * as fc from "fast-check";
import { Types } from "mongoose";
import { Role } from "src/common/enums/role.enum";
import { ChannelThreadService } from "src/channel-thread/channel-thread.service";
import { InboxService } from "./inbox.service";

const BOT = "64b0000000000000000000b1";
const ORG = "64b000000000000000000001";
const agents: Record<string, any> = {
  a1: { _id: "a1", name: "Asha", email: "asha@x.io", assignedBots: [BOT], organizationId: ORG, active: true },
  a2: { _id: "a2", name: "", email: "ben@x.io", assignedBots: [BOT], organizationId: ORG, active: true },
  a3: { _id: "a3", name: "Cara", assignedBots: [], organizationId: ORG, active: true },
  a4: { _id: "a4", name: "Dev", assignedBots: [BOT], organizationId: ORG, active: false },
  admin: { _id: "admin", name: "Ada", assignedBots: [], organizationId: ORG, active: true },
};

function threadModel(initial: any) {
  const doc: any = { _id: new Types.ObjectId(), channel: "widget", chatId: "64c0000000000000000000c1", bot: BOT, visitor: "64c0000000000000000000a1", ...initial };
  const tick = () => new Promise((r) => setImmediate(r));
  const owner = () => (doc.assignedAgent == null ? null : String(doc.assignedAgent));
  const matches = (q: any): boolean =>
    Object.entries(q).every(([k, v]: [string, any]) => {
      if (k === "_id") return true;
      if (k === "$or") return v.some((s: any) => matches(s));
      if (k === "assignedAgent") {
        if (v === null) return owner() === null;
        if (v && typeof v === "object" && "$exists" in v) return (doc.assignedAgent !== undefined) === v.$exists;
        return owner() === String(v);
      }
      return true;
    });
  const chain = (fn: () => any) => {
    const c: any = { select: () => c, populate: () => c, lean: async () => fn() };
    return c;
  };
  return {
    doc,
    findOneAndUpdate: (q: any, u: any) =>
      chain(async () => {
        await tick(); // concurrent claims interleave here
        if (!matches(q)) return null;
        const before = { ...doc };
        Object.assign(doc, u.$set || {});
        for (const k of Object.keys(u.$unset || {})) delete doc[k];
        return before;
      }),
    findById: () =>
      chain(() => {
        const a = owner() ? agents[owner()!] : null;
        return { ...doc, assignedAgent: a ? { ...a } : undefined };
      }),
  };
}

function setup(initial: any = {}) {
  const model = threadModel(initial);
  const cts = new ChannelThreadService(model as any);
  (cts as any).findByIdPopulated = async () => {
    const a = model.doc.assignedAgent ? agents[String(model.doc.assignedAgent)] : undefined;
    return { ...model.doc, assignedAgent: a ? { ...a } : undefined };
  };
  const published: any[] = [];
  const direct: any[] = [];
  const events: any[] = [];
  const saved: any[] = [];
  const inbox = new InboxService(
    cts,
    { saveChannelMessage: async (p: any) => { saved.push(p); return { chat: null }; } } as any,
    { findOne: async (id: string) => agents[id] ?? null } as any,
    { emit: (n: string, p: any) => events.push({ n, p }), emitAsync: async () => [] } as any,
    {
      publishThreadUpdated: async (p: any) => published.push(p),
      emitToUsers: (ids: string[], e: string, d: any) => direct.push({ ids, e, d }),
    } as any,
    { updateUserData: () => undefined } as any,
    { orgBotIdStrings: async () => [BOT] } as any,
  );
  (inbox as any).logger.warn = () => undefined;
  const id = String(model.doc._id);
  return { model, cts, inbox, id, published, direct, events, saved };
}

const user = (id: string, role = Role.AGENT): any => ({ _id: id, role, organizationId: ORG, name: agents[id]?.name });

describe("claim (R7.1, Property 5)", () => {
  it("property: concurrent takeovers by different agents -> exactly one owner", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.constantFrom("a1", "a2", "admin"), { minLength: 2, maxLength: 8 }), async (who) => {
        const { cts, model, id } = setup();
        const results = await Promise.all(who.map((u) => cts.claim(id, u)));
        const winners = results.filter((r) => r.ok && r.changed);
        expect(winners).toHaveLength(1);
        const owner = String(model.doc.assignedAgent);
        // Every loser is told who won (or is the winner re-claiming).
        results.forEach((r, i) => {
          if (r.ok) expect(who[i]).toBe(owner);
          else expect((r as any).owner?.id).toBe(owner);
        });
      }),
      { numRuns: 40 },
    );
  });

  it("re-claim by the owner is a no-op", async () => {
    const { cts, id } = setup();
    expect(await cts.claim(id, "a1")).toEqual({ ok: true, changed: true });
    expect(await cts.claim(id, "a1")).toEqual({ ok: true, changed: false });
  });

  it("owner name falls back to the email (R8.1)", async () => {
    const { cts, id } = setup({ assignedAgent: "a2", handledByAgent: true });
    expect(await cts.claim(id, "a1")).toEqual({ ok: false, owner: { id: "a2", name: "ben@x.io" } });
  });
});

describe("InboxService ownership rules", () => {
  it("takeover: 409 with the owner's name, admins get no bypass (R7.4)", async () => {
    const { inbox, id } = setup({ assignedAgent: "a1", handledByAgent: true });
    await expect(inbox.setBotControl(user("a2"), id, { action: "takeover" } as any)).rejects.toMatchObject({
      response: { reason: "thread_owned_by_other_agent", ownerName: "Asha" },
    });
    await expect(inbox.setBotControl(user("admin", Role.ORG_ADMIN), id, { action: "takeover" } as any)).rejects.toMatchObject({
      response: { reason: "thread_owned_by_other_agent" },
    });
  });

  it("exactly one thread-updated per owner change, none for a no-op (R7.5)", async () => {
    const { inbox, id, published, events } = setup();
    await inbox.setBotControl(user("a1"), id, { action: "takeover" } as any);
    await inbox.setBotControl(user("a1"), id, { action: "takeover" } as any);
    expect(published).toHaveLength(1);
    // The visitor is told about the agent only once.
    expect(events.filter((e) => e.n === "agent.took.over")).toHaveLength(1);
    await inbox.setBotControl(user("a1"), id, { action: "release" } as any);
    await inbox.setBotControl(user("a1"), id, { action: "release" } as any);
    expect(published).toHaveLength(2);
  });

  it("release is owner-only (R7.6)", async () => {
    const { inbox, id, model } = setup({ assignedAgent: "a1", handledByAgent: true });
    await expect(inbox.setBotControl(user("a2"), id, { action: "release" } as any)).rejects.toMatchObject({
      response: { reason: "thread_owned_by_other_agent", ownerName: "Asha" },
    });
    expect(String(model.doc.assignedAgent)).toBe("a1");
  });

  it("replies are owner-only: rejected before anything is persisted (R7.2)", async () => {
    const { inbox, id, saved } = setup({ assignedAgent: "a1", handledByAgent: true });
    (inbox as any).requireThread = async () => ({
      _id: id,
      handledByAgent: true,
      assignedAgent: { _id: "a1", name: "Asha" },
      channel: "widget",
    });
    await expect(inbox.sendMessage(user("a2"), id, { message: "hi" } as any)).rejects.toMatchObject({
      response: { reason: "not_thread_owner", ownerName: "Asha" },
    });
    expect(saved).toHaveLength(0);
  });

  describe("override (R7.3, R7.7)", () => {
    it("only org admins", async () => {
      const { inbox, id } = setup({ assignedAgent: "a1", handledByAgent: true });
      await expect(inbox.overrideOwner(user("a2"), id)).rejects.toMatchObject({ response: { reason: "override_not_admin" } });
    });

    it("rejects an unassigned or inactive target and leaves the owner", async () => {
      const { inbox, id, model } = setup({ assignedAgent: "a1", handledByAgent: true });
      const admin = user("admin", Role.ORG_ADMIN);
      for (const t of ["a3", "a4", "nobody"]) {
        await expect(inbox.overrideOwner(admin, id, t)).rejects.toMatchObject({ response: { reason: "override_invalid_target" } });
      }
      expect(String(model.doc.assignedAgent)).toBe("a1");
    });

    it("moves ownership, logs it, tells the previous owner who did it, one event", async () => {
      const { inbox, id, model, direct, events, published } = setup({ assignedAgent: "a1", handledByAgent: true });
      await inbox.overrideOwner(user("admin", Role.ORG_ADMIN), id, "a2");
      expect(String(model.doc.assignedAgent)).toBe("a2");
      expect(direct).toEqual([
        expect.objectContaining({ ids: ["a1"], e: "inbox:ownership-overridden", d: expect.objectContaining({ actorId: "admin", actorName: "Ada" }) }),
      ]);
      expect(events.find((e) => e.n === "inbox.ownership.overridden")?.p).toMatchObject({ from: "a1", to: "a2", actor: "admin" });
      expect(published).toHaveLength(1);
      // The previous owner can no longer reply.
      (inbox as any).requireThread = async () => ({ handledByAgent: true, assignedAgent: { _id: "a2", email: "ben@x.io" } });
      await expect(inbox.sendMessage(user("a1"), id, { message: "hi" } as any)).rejects.toMatchObject({
        response: { reason: "not_thread_owner", ownerName: "ben@x.io" },
      });
    });

    it("admin taking it themselves", async () => {
      const { inbox, id, model } = setup({ assignedAgent: "a1", handledByAgent: true });
      await inbox.overrideOwner(user("admin", Role.ORG_ADMIN), id);
      expect(String(model.doc.assignedAgent)).toBe("admin");
    });
  });
});
