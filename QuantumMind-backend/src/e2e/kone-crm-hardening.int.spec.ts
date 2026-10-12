/**
 * crm-plugins-service-desk task 5.1 against the REAL CRM Postgres. Mongo is
 * in-memory. Each scenario targets a correctness property under the
 * conditions unit tests cannot reproduce (row locks, advisory locks, unique
 * keys, real transactions):
 *
 *   - one person captured from three sources, in sequence and at once (Property 1, 2)
 *   - random plugin toggles from two server instances, per org (Property 3, 7)
 *   - random stage edits incl. delete-with-move (Property 4)
 *   - two people working the same cards at once, with stale neighbours (Property 5, 8)
 *   - the session lifecycle in `live` mode snapshots before it deletes chats (Property 9)
 *   - nothing of one org is reachable from another (Property 7)
 *
 * Opt-in: `npm run test:crm-int`. Fresh organization ids; every row written
 * is deleted in afterAll.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { HttpException } from "@nestjs/common";
import * as dotenv from "dotenv";
import * as fc from "fast-check";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { Types } from "mongoose";
import { ContactCaptureService } from "src/crm-bridge/contact-capture.service";
import { ContactResolverService } from "src/crm-bridge/contact-resolver.service";
import { CrmBridgeService } from "src/crm-bridge/crm-bridge.service";
import { CrmPluginService } from "src/crm/plugins/crm-plugin.service";
import { CRM_PLUGINS } from "src/crm/plugins/plugin-registry";
import { ServiceRequestStagesService } from "src/crm/service-requests/service-request-stages.service";
import { ServiceRequestTranscriptService } from "src/crm/service-requests/service-request-transcript.service";
import { ServiceRequestsService } from "src/crm/service-requests/service-requests.service";
import { fakeModel, fakeMongo } from "src/profile/fakes.testspec";
import { SessionLifecycleService } from "src/profile/session-lifecycle.service";
import { TicketsService } from "src/tickets/tickets.service";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const RUN = process.env.CRM_IT === "1";
const d = RUN ? describe : describe.skip;

const oid = () => new Types.ObjectId().toString();
const quiet = { warn: () => undefined, error: () => undefined, log: () => undefined };

let prisma: PrismaClient;
/** Every org this file wrote to, cleaned in afterAll. */
const ORGS: string[] = [];
const newOrg = () => {
  const o = oid();
  ORGS.push(o);
  return o;
};

/** Rule violations are 4xx: expected from random sequences. Anything else is a bug. */
const expected = (e: any) => {
  if (e instanceof HttpException && e.getStatus() < 500) return;
  throw e;
};

function deskStack(orgOfBot: Record<string, string>, models: Record<string, any> = {}) {
  const crm = { forOrg: () => prisma, client: prisma } as any;
  const mongo = fakeMongo({ Agent: fakeModel(), Bot: fakeModel(), Chat: fakeModel(), Conversation: fakeModel(), ...models });
  const tenantScope = { orgIdForBot: async (b: string) => orgOfBot[b] ?? null } as any;
  const stages = new ServiceRequestStagesService(crm);
  const requests = new ServiceRequestsService(crm, stages, tenantScope, { emit: () => undefined } as any, mongo);
  const transcripts = new ServiceRequestTranscriptService(crm, mongo);
  for (const s of [stages, requests, transcripts] as any[]) s.logger = quiet;
  return { crm, mongo, tenantScope, stages, requests, transcripts };
}

d("hardening on real Postgres (task 5.1)", () => {
  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: process.env.CRM_DATABASE_URL } } });
    await prisma.$queryRaw`SELECT 1`;
  });
  afterAll(async () => {
    if (!prisma) return;
    const where = { organizationId: { in: ORGS } };
    await prisma.serviceRequest.deleteMany({ where });
    await prisma.serviceRequestStage.deleteMany({ where });
    await prisma.crmPluginSetting.deleteMany({ where });
    await prisma.contactFact.deleteMany({ where });
    await prisma.activity.deleteMany({ where });
    await prisma.contact.deleteMany({ where });
    expect(await prisma.serviceRequestEvent.count({ where })).toBe(0);
    expect(await prisma.contactIdentifier.count({ where })).toBe(0);
    await prisma.$disconnect();
  });

  // ------------------------------------------------------------ Property 1, 2

  describe("one person from three sources (Property 1, 2)", () => {
    const BOT = oid();

    function captureStack(org: string, convs: { id: string; visitor: string; platform: string }[]) {
      const models = {
        Conversation: fakeModel(convs.map((c) => ({ _id: c.id, platform: c.platform, bot: BOT }))),
        Visitor: fakeModel(convs.map((c) => ({ _id: c.visitor, name: "Anonymous", email: "", phone: "0000000000" }))),
        Incident: fakeModel(),
      };
      const desk = deskStack({ [BOT]: org }, models);
      const resolver = new ContactResolverService(desk.crm);
      // Like the real outbox: run now, queue for retry on failure. Any queued
      // operation in these tests means a capture failed under contention.
      const outbox: any = {
        registerHandler: () => undefined,
        enqueue: jest.fn(async (..._a: any[]) => true),
        runOrEnqueue: async (op: string, payload: any, fn: () => Promise<void>) => {
          try {
            await fn();
            return true;
          } catch (e) {
            await outbox.enqueue(op, payload, { lastError: (e as Error)?.message });
            return false;
          }
        },
      };
      const bridge = new CrmBridgeService(resolver, outbox as any, desk.tenantScope, { emit: () => undefined } as any, desk.mongo, desk.requests);
      const socketState = { getUserData: () => null, updateUserData: () => undefined };
      const events: any[] = [];
      const capture = new ContactCaptureService(bridge, socketState as any, { emit: (_n: string, p: any) => events.push(p) } as any, desk.mongo);
      for (const s of [resolver, bridge, capture] as any[]) s.logger = quiet;
      const ctx = (c: { id: string; visitor: string; platform: string }) => ({ conversationId: c.id, visitorId: c.visitor, botId: BOT, channel: c.platform });
      return { ...desk, models, capture, outbox, ctx, events };
    }

    const conv = (platform: string) => ({ id: oid(), visitor: oid(), platform });

    it("pre-chat form, then WhatsApp, then the agent: one contact, every identifier, every conversation linked", async () => {
      const org = newOrg();
      const web = conv("widget");
      const wa = conv("whatsapp");
      const tg = conv("telegram");
      const s = captureStack(org, [web, wa, tg]);
      // A request raised on WhatsApp before anyone knew who it was.
      const sr = await s.requests.createFromChat({ botId: BOT, conversationId: wa.id, visitorId: wa.visitor, subject: "Lift noise" });

      await s.capture.capture(s.ctx(web), { name: "Priya Shah", email: "priya@x.com", phone: "+91 98200 11122" }, "widget_form");
      await s.capture.capture(s.ctx(wa), { phone: "919820011122", name: "Priya" , weakName: true } as any, "whatsapp");
      await s.capture.capture(s.ctx(tg), { channel: { kind: "TELEGRAM", value: "5551234" }, name: "P S", weakName: true } as any, "telegram");
      // The agent on the Telegram chat learns her new work email.
      await s.capture.capture(s.ctx(tg), { email: "priya@work.com", phone: "+919820011122" }, "agent");

      const active = await prisma.contact.findMany({ where: { organizationId: org, archivedAt: null } });
      expect(active).toHaveLength(1);
      const c = active[0];
      expect(c).toMatchObject({ firstName: "Priya", lastName: "Shah", email: "priya@work.com", sourceChannel: "widget_form" });
      const ids = await prisma.contactIdentifier.findMany({ where: { organizationId: org, contactId: c.id } });
      expect(ids.map((i) => `${i.kind}:${i.value}`).sort()).toEqual([
        "EMAIL:priya@work.com",
        "EMAIL:priya@x.com",
        "PHONE:919820011122",
        "TELEGRAM:5551234",
      ]);
      // Every conversation and visitor points at her; so does the request.
      expect(s.models.Conversation.docs.map((x: any) => x.crmContactId)).toEqual([c.id, c.id, c.id]);
      expect((await s.requests.byId(org, sr.id)).contactId).toBe(c.id);
      // Property 2: each Visitor record holds the latest stated values; a
      // guessed platform name never replaced a stated one.
      const v = (id: string) => s.models.Visitor.docs.find((x: any) => x._id === id);
      expect(v(web.visitor)).toMatchObject({ name: "Priya Shah", email: "priya@x.com" });
      expect(v(tg.visitor)).toMatchObject({ email: "priya@work.com" });
      expect(s.outbox.enqueue).not.toHaveBeenCalled();
    });

    it("the same three sources at the same moment still leave one contact", async () => {
      await fc.assert(
        fc.asyncProperty(fc.shuffledSubarray([0, 1, 2], { minLength: 3, maxLength: 3 }), async (order) => {
          const org = newOrg();
          const convs = [conv("widget"), conv("whatsapp"), conv("widget")];
          const s = captureStack(org, convs);
          const caps: [any, string][] = [
            [{ name: "Ravi", email: "ravi@x.com" }, "widget_form"],
            [{ phone: "+15550009999", email: "ravi@x.com" }, "whatsapp"],
            [{ email: "RAVI@x.com", phone: "+1 555 000 9999" }, "agent"],
          ];
          await Promise.all(order.map((i) => s.capture.capture(s.ctx(convs[i]), caps[i][0], caps[i][1] as any)));
          const active = await prisma.contact.findMany({ where: { organizationId: org, archivedAt: null } });
          expect(active).toHaveLength(1);
          expect(new Set(s.models.Conversation.docs.map((x: any) => x.crmContactId))).toEqual(new Set([active[0].id]));
          expect(s.outbox.enqueue).not.toHaveBeenCalled();
        }),
        { numRuns: 4 },
      );
    });
  });

  // ------------------------------------------------------------ Property 3, 7

  it("random plugin toggles from two server instances keep dependencies and stay per org (Property 3, 7)", async () => {
    const keys = CRM_PLUGINS.map((p) => p.key);
    const optional = CRM_PLUGINS.filter((p) => !p.core).map((p) => p.key);
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({ server: fc.integer({ min: 0, max: 1 }), key: fc.constantFrom(...keys), on: fc.boolean() }), { minLength: 3, maxLength: 10 }),
        async (ops) => {
          const org = newOrg();
          const bystander = newOrg();
          const servers = [0, 1].map(() => new CrmPluginService({ forOrg: () => prisma } as any));
          await servers[0].setEnabled(bystander, "deals", true, "b");
          for (const op of ops) {
            await servers[op.server].setEnabled(org, op.key, op.on, `u${op.server}`).catch(expected);
          }
          // A fresh instance reads only the database.
          const list = await new CrmPluginService({ forOrg: () => prisma } as any).list(org);
          const on = new Map(list.map((p) => [p.key, p.enabled]));
          for (const p of CRM_PLUGINS) {
            if (p.core) expect(on.get(p.key)).toBe(true);
            if (on.get(p.key)) for (const dep of p.dependsOn) expect(on.get(dep)).toBe(true);
          }
          // The other org never moved.
          const other = await new CrmPluginService({ forOrg: () => prisma } as any).list(bystander);
          expect(other.filter((p) => optional.includes(p.key)).every((p) => p.enabled)).toBe(true);
        },
      ),
      { numRuns: 8 },
    );
  });

  // ------------------------------------------------------------ Property 4

  it("random stage edits incl. delete-with-move keep the stage rules and no request on an archived stage (Property 4)", async () => {
    const CATS = ["OPEN", "IN_PROGRESS", "ON_HOLD", "DONE"];
    const op = fc.oneof(
      fc.record({ t: fc.constant("create"), name: fc.constantFrom("Triage", "triage", "Parts", "QA", "Done 2"), cat: fc.constantFrom(...CATS), def: fc.boolean() }),
      fc.record({ t: fc.constant("category"), i: fc.nat(), cat: fc.constantFrom(...CATS) }),
      fc.record({ t: fc.constant("default"), i: fc.nat() }),
      fc.record({ t: fc.constant("rename"), i: fc.nat(), name: fc.constantFrom("Open", "Blocked", "Waiting", " x ") }),
      fc.record({ t: fc.constant("reorder"), seed: fc.nat() }),
      fc.record({ t: fc.constant("delete"), i: fc.nat(), to: fc.nat() }),
      fc.record({ t: fc.constant("request"), i: fc.nat() }),
    );
    await fc.assert(
      fc.asyncProperty(fc.array(op, { minLength: 4, maxLength: 12 }), async (ops) => {
        const org = newOrg();
        const BOT = oid();
        const { stages, requests } = deskStack({ [BOT]: org });
        const admin = { id: oid(), name: "Admin", role: "org_admin" };
        await stages.list(org);
        for (const o of ops as any[]) {
          const cur = await stages.list(org);
          const at = (i: number) => cur[i % cur.length];
          const run = async () => {
            switch (o.t) {
              case "create":
                return stages.create(org, { name: o.name, category: o.cat, isDefault: o.def });
              case "category":
                return stages.update(org, at(o.i).id, { category: o.cat });
              case "default":
                return stages.update(org, at(o.i).id, { isDefault: true });
              case "rename":
                return stages.update(org, at(o.i).id, { name: o.name });
              case "reorder":
                return stages.reorder(org, [...cur].sort((a, b) => ((a.id.charCodeAt(5) * (o.seed + 1)) % 7) - ((b.id.charCodeAt(5) * (o.seed + 1)) % 7)).map((s) => s.id));
              case "delete":
                return stages.remove(org, at(o.i).id, at(o.to).id, admin);
              case "request": {
                const sr = await requests.createFromChat({ botId: BOT, subject: "r" });
                return requests.move(org, admin, sr.id, { stageId: at(o.i).id });
              }
            }
          };
          await run().catch(expected);

          const active = await prisma.serviceRequestStage.findMany({ where: { organizationId: org, archivedAt: null } });
          expect(active.some((s) => s.category === "OPEN")).toBe(true);
          expect(active.some((s) => s.category === "DONE")).toBe(true);
          const defs = active.filter((s) => s.isDefault);
          expect(defs).toHaveLength(1);
          expect(defs[0].category).toBe("OPEN");
          expect(new Set(active.map((s) => s.name.toLowerCase())).size).toBe(active.length);
          const orphans = await prisma.serviceRequest.count({ where: { organizationId: org, stage: { archivedAt: { not: null } } } });
          expect(orphans).toBe(0);
        }
      }),
      { numRuns: 6 },
    );
  });

  // ------------------------------------------------------------ Property 5, 8

  it("two people working the same cards at once, with stale neighbours: distinct positions, consistent history (Property 5, 8)", async () => {
    const org = newOrg();
    const BOT = oid();
    const A = oid();
    const B = oid();
    const { stages, requests } = deskStack(
      { [BOT]: org },
      {
        Agent: fakeModel([
          { _id: A, name: "Asha", email: "a@x.com", role: "agent", organizationId: org, active: true },
          { _id: B, name: "Ben", email: "b@x.com", role: "org_manager", organizationId: org, active: true },
        ]),
      },
    );
    const people = [{ id: A, name: "Asha", role: "agent" }, { id: B, name: "Ben", role: "org_manager" }];
    const cols = (await stages.list(org)).slice(0, 4);
    const cards = await Promise.all(Array.from({ length: 8 }, (_, i) => requests.createFromChat({ botId: BOT, subject: `card ${i}` })));
    const initial = new Map(cards.map((c) => [c.id, { subject: c.subject, priority: c.priority }]));

    // Each person reads the board once and then works from that stale view.
    const staleView = await prisma.serviceRequest.findMany({ where: { organizationId: org }, select: { id: true } });
    const step = fc.record({
      kind: fc.constantFrom("move", "move", "move", "assign", "priority", "edit"),
      card: fc.nat({ max: 7 }),
      col: fc.nat({ max: 3 }),
      n1: fc.nat({ max: 7 }),
      n2: fc.nat({ max: 7 }),
      who: fc.nat({ max: 1 }),
    });
    const plans = fc.sample(fc.array(step, { minLength: 25, maxLength: 25 }), { numRuns: 2, seed: 42 });
    await Promise.all(
      plans.map(async (plan, p) => {
        for (const s of plan) {
          const actor = people[p];
          const id = cards[s.card].id;
          const go = async () => {
            switch (s.kind) {
              case "move":
                return requests.move(org, actor, id, {
                  stageId: cols[s.col].id,
                  aboveId: staleView[s.n1].id,
                  belowId: staleView[s.n2].id,
                });
              case "assign":
                return requests.assign(org, actor, id, people[s.who].id);
              case "priority":
                return requests.update(org, actor, id, { priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][s.n1 % 4] });
              case "edit":
                return requests.update(org, actor, id, { subject: `card ${s.card} v${s.n1}`, tags: [`t${s.n2 % 3}`] });
            }
          };
          await go().catch(expected);
        }
      }),
    );

    // Property 5: no two cards share a position in a column.
    const rows = await prisma.serviceRequest.findMany({ where: { organizationId: org } });
    for (const c of cols) {
      const pos = rows.filter((r) => r.stageId === c.id).map((r) => r.boardPosition);
      expect(new Set(pos).size).toBe(pos.length);
    }

    // Property 8: each field's history is an unbroken chain ending at the current value.
    for (const r of rows) {
      const { data, count } = await requests.listEvents(org, r.id, 0, 1000);
      expect(data).toHaveLength(count);
      const ev = [...data].reverse();
      const chain = (type: string, pick: (x: any) => any, start: any) => {
        let last = start;
        for (const e of ev.filter((x) => x.type === type)) {
          const from = pick(e.from);
          if (from !== undefined) expect(from).toEqual(last);
          last = pick(e.to);
        }
        return last;
      };
      const created = ev[0];
      expect(created.type).toBe("CREATED");
      expect(chain("STAGE_CHANGED", (x) => x?.stageId, (created.to as any).stageId)).toBe(r.stageId);
      expect(chain("ASSIGNED", (x) => x?.assigneeId ?? null, null)).toBe(r.assigneeId);
      expect(chain("PRIORITY_CHANGED", (x) => x?.priority, initial.get(r.id)!.priority)).toBe(r.priority);
      const edits = ev.filter((x) => x.type === "EDITED");
      const field = (k: string, start: any) =>
        edits.reduce((last, e: any) => {
          if (!(k in (e.to || {}))) return last;
          expect(e.from[k]).toEqual(last);
          return e.to[k];
        }, start);
      expect(field("subject", initial.get(r.id)!.subject)).toBe(r.subject);
      expect(field("tags", [])).toEqual(r.tags);
    }
  });

  // ------------------------------------------------------------ Property 9

  describe("chat purge in live mode (Property 9)", () => {
    function lifecycle(org: string, transcripts: ServiceRequestTranscriptService | { snapshotForConversation: (id: string) => Promise<number> }) {
      return (models: Record<string, any>) => {
        const svc = new SessionLifecycleService(
          { merge: async () => ({ status: "merged", ai: true, contactId: "ct1" }) } as any,
          { get: (k: string) => (k === "crm.profilePurgeMode" ? "live" : undefined) } as any,
          fakeMongo(models),
          transcripts as any,
        );
        (svc as any).logger = quiet;
        return svc;
      };
    }

    function chatWorld() {
      const BOT = oid();
      const SETTING = oid();
      const CONV = oid();
      const VISITOR = oid();
      const models = {
        Conversation: fakeModel([
          { _id: CONV, bot: BOT, platform: "widget", crmContactId: "ct1", endedAt: new Date(), status: "completed", transcriptState: "kept", mergeAttempts: 0, chats: ["a"] },
        ]),
        Chat: fakeModel([
          { _id: oid(), conversationId: CONV, message: "Lift 2 makes a noise", sender: VISITOR, time: new Date(1000) },
          { _id: oid(), conversationId: CONV, message: "Recorded, an engineer will call", sender: BOT, time: new Date(2000) },
          { _id: oid(), conversationId: CONV, message: "1234", sender: VISITOR, time: new Date(3000), secured: true },
        ]),
        Incident: fakeModel(),
        Bot: fakeModel([{ _id: BOT, botSetting: SETTING }]),
        BotSetting: fakeModel([{ _id: SETTING, features: { profileSummaries: true } }]),
      };
      return { BOT, CONV, VISITOR, models };
    }

    it("every request of the conversation gets the copy before the chats go", async () => {
      const org = newOrg();
      const w = chatWorld();
      const desk = deskStack({ [w.BOT]: org }, w.models);
      const a = await desk.requests.createFromChat({ botId: w.BOT, conversationId: w.CONV, visitorId: w.VISITOR, subject: "Noise" });
      const b = await desk.requests.createFromChat({ botId: w.BOT, conversationId: w.CONV, visitorId: w.VISITOR, subject: "Second issue" });
      const svc = lifecycle(org, desk.transcripts)(w.models);

      await svc.process(w.CONV);
      expect(w.models.Chat.docs).toHaveLength(0);
      for (const id of [a.id, b.id]) {
        const t = await desk.transcripts.forRequest(org, id);
        expect(t.source).toBe("snapshot");
        expect(t.lines.map((l) => l.text)).toEqual(["Lift 2 makes a noise", "Recorded, an engineer will call", "[secure]"]);
      }
    });

    it("a failing database keeps the chats; the daily repair deletes them once the copy works", async () => {
      const org = newOrg();
      const w = chatWorld();
      const desk = deskStack({ [w.BOT]: org }, w.models);
      const sr = await desk.requests.createFromChat({ botId: w.BOT, conversationId: w.CONV, visitorId: w.VISITOR, subject: "Noise" });
      await prisma.serviceRequest.update({ where: { id: sr.id }, data: { transcript: [], transcriptAt: null } });

      // The snapshot write fails: the real query path, with the update refused.
      const broken = new Proxy(prisma, {
        get: (t: any, k) =>
          k === "serviceRequest"
            ? new Proxy(t.serviceRequest, {
                get: (m: any, op) =>
                  op === "update"
                    ? async () => {
                        throw new Error("db down");
                      }
                    : typeof m[op] === "function"
                    ? m[op].bind(m)
                    : m[op],
              })
            : t[k],
      });
      const failing = new ServiceRequestTranscriptService({ forOrg: () => broken, client: broken } as any, desk.mongo);
      (failing as any).logger = quiet;
      await lifecycle(org, failing)(w.models).process(w.CONV).catch(() => undefined);
      expect(w.models.Chat.docs).toHaveLength(3);
      expect((await prisma.serviceRequest.findUnique({ where: { id: sr.id } }))!.transcriptAt).toBeNull();

      await lifecycle(org, desk.transcripts)(w.models).runDaily(new Date(Date.now() + 86_400_000));
      expect(w.models.Chat.docs).toHaveLength(0);
      expect((await desk.transcripts.forRequest(org, sr.id)).lines).toHaveLength(3);
    });
  });

  // ------------------------------------------------------------ Property 7

  it("nothing of one org is reachable from another: detail, notes, history, transcript, stages, search, stats (Property 7)", async () => {
    const mine = newOrg();
    const theirs = newOrg();
    const BOT = oid();
    const THEIR_BOT = oid();
    const USER = oid();
    const desk = deskStack({ [BOT]: mine, [THEIR_BOT]: theirs });
    const tickets = new TicketsService(desk.requests, desk.crm, desk.mongo);
    (tickets as any).logger = quiet;
    const secret = await desk.requests.createFromChat({ botId: THEIR_BOT, subject: "Secret zebra request", emergency: true });
    await desk.requests.addComment(theirs, { id: oid(), name: "X", role: "agent" }, secret.id, "zebra note");
    const theirStage = (await desk.stages.list(theirs))[1];
    await desk.stages.list(mine);
    const me = { id: USER, name: "Me", role: "org_admin" };

    const notFound = (p: Promise<any>) => expect(p).rejects.toMatchObject({ status: 404 });
    await notFound(desk.requests.byId(mine, secret.id));
    await notFound(desk.requests.listComments(mine, secret.id));
    await notFound(desk.requests.listEvents(mine, secret.id));
    await notFound(desk.transcripts.forRequest(mine, secret.id));
    await notFound(desk.requests.update(mine, me, secret.id, { subject: "hijack" }));
    await notFound(desk.requests.assign(mine, me, secret.id, null));
    await notFound(desk.requests.addComment(mine, me, secret.id, "hello"));
    await notFound(desk.stages.update(mine, theirStage.id, { name: "Hijacked" }));
    // Moving my request into their stage is refused too.
    const own = await desk.requests.createFromChat({ botId: BOT, subject: "Mine" });
    await notFound(desk.requests.move(mine, me, own.id, { stageId: theirStage.id }));

    for (const q of [{ q: "zebra" }, { stageId: [theirStage.id] }, { emergency: true }]) {
      const res: any = await desk.requests.list(mine, USER, q as any, { view: "list" });
      expect(res.data.map((r: any) => r.id)).not.toContain(secret.id);
    }
    const user: any = { _id: USER, role: "org_admin", organizationId: mine };
    const critical = (await tickets.ticketStats(7, user)).find((c) => c.title === "Critical")!;
    expect(critical.stats).toBe(0);
    expect((await desk.stages.list(theirs)).find((s) => s.id === theirStage.id)!.name).toBe(theirStage.name);
    expect((await desk.requests.byId(theirs, secret.id)).subject).toBe("Secret zebra request");
  });
});
