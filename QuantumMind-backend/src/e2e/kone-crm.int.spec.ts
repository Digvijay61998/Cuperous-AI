/**
 * crm-incident-handover task 9.1: the CRM journeys, against the REAL CRM
 * Postgres (advisory locks, the lower(email) unique index, raw SQL,
 * SELECT ... FOR UPDATE). Mongo is in-memory; the AI is a stub.
 *
 *   1. anonymous handover -> agent adds details -> merge into the existing contact
 *   2. the conversation ends -> profile merged -> the returning visitor's next
 *      AI answer carries the profile
 *   3. two merges of one contact at the same time keep both entries
 *   4. preview writes nothing to the CRM
 *
 * Opt-in, because it needs the database:  CRM_IT=1 npx jest src/e2e/kone-crm
 * (`npm run test:crm-int`). Uses a fresh organization id and deletes every
 * row it wrote in afterAll.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import * as dotenv from "dotenv";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { ContactResolverService } from "src/crm-bridge/contact-resolver.service";
import { CrmBridgeService } from "src/crm-bridge/crm-bridge.service";
import { CrmLinksService } from "src/crm-bridge/crm-links.service";
import { cleanDetails } from "src/crm-bridge/identity";
import { fakeModel, fakeMongo } from "src/profile/fakes.testspec";
import { parseProfile, profileRefs } from "src/profile/profile-schema";
import { ProfileService } from "src/profile/profile.service";
import { SessionLifecycleService } from "src/profile/session-lifecycle.service";
import { harness, oid } from "./kone-harness.testspec";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const RUN = process.env.CRM_IT === "1";
const d = RUN ? describe : describe.skip;

const ORG = oid();
const BOT = oid();
const SETTING = oid();
const VISITOR = oid();
const FEATURES = { crmCapture: true, incidentHandover: true, profileSummaries: true };

let prisma: PrismaClient;

function crmStack(models: Record<string, any>) {
  const crm = { forOrg: () => prisma } as any;
  const resolver = new ContactResolverService(crm);
  const outbox = {
    registerHandler: () => undefined,
    enqueue: jest.fn(async (..._args: any[]) => true),
    runOrEnqueue: async (op: string, payload: any, fn: () => Promise<void>) => {
      try {
        await fn();
        return true;
      } catch (e) {
        await outbox.enqueue(op, payload);
        return false;
      }
    },
  };
  const tenantScope = { orgIdForBot: async () => ORG, orgBotIds: async () => [BOT] };
  const mongo = fakeMongo(models);
  const bridge = new CrmBridgeService(resolver, outbox as any, tenantScope as any, { emit: () => undefined } as any, mongo);
  const links = new CrmLinksService(crm, bridge, resolver, mongo);
  for (const s of [resolver, bridge] as any[]) s.logger = { warn: () => undefined, error: () => undefined, log: () => undefined };
  return { crm, resolver, bridge, links, outbox, tenantScope, mongo };
}

/** AI stub that appends one entry, like the real /profile/merge. */
const mergeAi = () => ({
  profileMerge: jest.fn(async (req: any) => {
    const prev = req.profile ?? { v: 1, facts: {}, adminOverrides: {}, entries: [] };
    return {
      profile: {
        ...prev,
        facts: { ...prev.facts, products: [...new Set([...(prev.facts.products || []), "Lift 2, Building A"])] },
        entries: [
          {
            conversationId: req.conversation_id,
            at: req.ended_at,
            summary: req.incident?.problem ? `Reported: ${req.incident.problem}` : "General questions",
            outcome: req.incident?.outcome ?? "answered",
            ticketRef: req.incident?.ticketRef,
            incidentId: req.incident?.id,
          },
          ...prev.entries,
        ],
      },
    };
  }),
});

d("KONE journeys against the real CRM Postgres", () => {
  const models: Record<string, any> = {
    Conversation: fakeModel(),
    Visitor: fakeModel(),
    Ticket: fakeModel(),
    Chat: fakeModel(),
    Agent: fakeModel(),
    Organization: fakeModel([{ _id: ORG, timeZone: "Asia/Kolkata" }]),
    Bot: fakeModel([{ _id: BOT, name: "myKONE Assistant", organizationId: ORG, botSetting: SETTING }]),
    BotSetting: fakeModel([{ _id: SETTING, features: FEATURES }]),
  };
  let raj: string;
  let anon: string;
  let conv1: string;
  let ticketRef: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: process.env.CRM_DATABASE_URL } } });
    await prisma.$queryRaw`SELECT 1`;
  });
  afterAll(async () => {
    if (!prisma) return;
    await prisma.contactFact.deleteMany({ where: { organizationId: ORG } });
    await prisma.activity.deleteMany({ where: { organizationId: ORG } });
    await prisma.contact.deleteMany({ where: { organizationId: ORG } });
    expect(await prisma.contact.count({ where: { organizationId: ORG } })).toBe(0);
    await prisma.$disconnect();
  });
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance", "setImmediate", "nextTick", "queueMicrotask"] } as any));
  afterEach(() => jest.useRealTimers());

  it("1. anonymous handover, then the agent adds details, then a merge (R20.1, R20.3, R3)", async () => {
    const s = crmStack(models);
    // Raj is already in the CRM from an earlier, summarised visit.
    const pre = await s.resolver.resolve(ORG, { details: cleanDetails({ name: "Raj Kumar", email: "raj@example.com" }) });
    expect(pre.kind).toBe("linked");
    raj = (pre as any).contactId;
    await prisma.contact.update({
      where: { id: raj },
      data: { profile: { v: 1, facts: { interests: ["maintenance"] }, adminOverrides: {}, entries: [{ conversationId: "old-1", at: "2026-09-01T10:00:00+05:30", summary: "Asked about service visits" }] } },
    });

    // The visitor asks for a specialist without giving any details.
    const h = harness({ features: FEATURES, models, orgId: ORG, botId: BOT, visitorId: VISITOR, crmBridge: s.bridge });
    conv1 = h.conversationId;
    await h.say("start");
    h.state().attributes = { contact_topic: "The lift door on floor 3 does not close properly" };
    await h.mh.TransferToAgent("", h.nodes.kone_agent, VISITOR);
    await h.flush();

    const inc = models.Incident.docs[0];
    ticketRef = inc.ticketRef;
    anon = inc.crmContactId;
    expect(anon).toBeTruthy();
    const anonRow = await prisma.contact.findUnique({ where: { id: anon } });
    expect(anonRow).toMatchObject({ organizationId: ORG, isAnonymous: true, firstName: "Anonymous visitor", source: "CHAT" });
    expect(anonRow!.lastName).toHaveLength(6);
    expect(models.Ticket.docs[0].crmContactId).toBe(anon);
    expect(models.Conversation.docs.find((c: any) => c._id === conv1).crmContactId).toBe(anon);
    expect(models.Visitor.docs[0].crmContactId).toBe(anon);
    expect(await prisma.activity.count({ where: { organizationId: ORG, contactId: anon, meta: { path: ["kind"], equals: "chat_linked" } } })).toBe(1);

    // While anonymous, a later visit was summarised onto the placeholder.
    await prisma.contact.update({
      where: { id: anon },
      data: { profile: { v: 1, facts: {}, adminOverrides: {}, entries: [{ conversationId: "anon-1", at: "2026-10-01T09:00:00+05:30", summary: "Asked about tender status" }] } },
    });

    // The agent types Raj's email in the Agent_View ("Add details").
    const res: any = await s.links.addDetails(ORG, conv1, { name: "Raj Kumar", email: "  RAJ@example.com " });
    expect(res).toMatchObject({ linked: true, contact: { id: raj, isAnonymous: false } });

    const [anonAfter, rajAfter] = await Promise.all([
      prisma.contact.findUnique({ where: { id: anon } }),
      prisma.contact.findUnique({ where: { id: raj } }),
    ]);
    expect(anonAfter!.archivedAt).toBeTruthy();
    expect(rajAfter!.visitorIds).toContain(VISITOR);
    // Every Mongo row now points at Raj (R20.3).
    // (Service Requests live in Postgres since crm-plugins-service-desk; their
    // repoint is covered by kone-crm-service-desk.int.spec.ts.)
    for (const name of ["Incident", "Visitor"]) expect(models[name].docs.every((x: any) => x.crmContactId === raj)).toBe(true);
    expect(models.Conversation.docs.find((c: any) => c._id === conv1).crmContactId).toBe(raj);
    // One chat_linked Activity for this conversation, now on Raj (R3.2).
    const linked = await prisma.activity.findMany({ where: { organizationId: ORG, meta: { path: ["kind"], equals: "chat_linked" } } });
    expect(linked.filter((a: any) => a.meta?.conversationId === conv1).map((a) => a.contactId)).toEqual([raj]);
    // Profile entries of both, newest first; Raj's facts kept.
    const p = parseProfile(rajAfter!.profile)!;
    expect(p.entries.map((e) => e.conversationId)).toEqual(["anon-1", "old-1"]);
    expect(p.facts.interests).toEqual(["maintenance"]);
    // One contact per person in the org (Property 1).
    expect(await prisma.contact.count({ where: { organizationId: ORG, archivedAt: null } })).toBe(1);
  });

  it("2. the conversation ends, the profile is merged, and the returning visitor's AI answer uses it (R18)", async () => {
    const s = crmStack(models);
    const ai = mergeAi();
    const profiles = new ProfileService(s.crm, ai as any, s.tenantScope as any, s.mongo);
    profiles.sleep = async () => undefined;
    const lifecycle = new SessionLifecycleService(profiles, { get: () => "dry_run" } as any, s.mongo);
    for (const x of [profiles, lifecycle] as any[]) x.logger = { warn: () => undefined, error: () => undefined, log: () => undefined };

    // The agent resolved it; the visitor closed the chat.
    const inc = models.Incident.docs[0];
    Object.assign(inc, { status: "resolved", outcome: "resolved_by_agent", resolutionNote: "Reset the door operator remotely." });
    Object.assign(models.Conversation.docs.find((c: any) => c._id === conv1), { status: "completed", endedAt: new Date("2026-10-09T10:05:00Z"), endCause: "closure_resolved" });
    models.Chat.docs.push({ _id: oid(), conversationId: conv1, sender: VISITOR, message: "door broken, mail raj@example.com", time: new Date() });

    expect(await lifecycle.process(conv1)).toBe("would_purge");
    // Dry run: merged, but the chat is still there (rollout §2).
    expect(models.Chat.docs).toHaveLength(1);
    const sent = JSON.stringify(ai.profileMerge.mock.calls[0][0]);
    expect(sent).not.toContain("raj@example.com");
    const rajRow = await prisma.contact.findUnique({ where: { id: raj } });
    const p = parseProfile(rajRow!.profile)!;
    expect(p.entries[0]).toMatchObject({ conversationId: conv1, ticketRef, outcome: "resolved_by_agent" });
    // The AI dates the entry in the org zone (its own tests cover that); the backend sends both.
    expect(ai.profileMerge.mock.calls[0][0]).toMatchObject({ org_tz: "Asia/Kolkata", ended_at: "2026-10-09T10:05:00.000Z", bot: "myKONE Assistant" });
    expect(rajRow!.profileVersion).toBeGreaterThanOrEqual(1);
    expect(await prisma.activity.count({ where: { organizationId: ORG, contactId: raj, meta: { path: ["kind"], equals: "session_summary" } } })).toBe(1);
    // Running it again changes nothing.
    expect(await lifecycle.process(conv1)).toBe("skipped");

    // Days later the same browser starts a new chat (same visitor id).
    const conv2 = oid();
    const h2 = harness({ features: FEATURES, models, orgId: ORG, botId: BOT, visitorId: VISITOR, conversationId: conv2, crmBridge: s.bridge, profileService: profiles });
    await s.bridge.linkReturning({ conversationId: conv2, visitorId: VISITOR, botId: BOT, botSettings: { features: FEATURES } as any });
    expect(models.Conversation.docs.find((c: any) => c._id === conv2).crmContactId).toBe(raj);

    await h2.say("start");
    await h2.say("what is the warranty on doors?");
    const askBody = h2.http.post.mock.calls.map((c: any[]) => c[1]).find((b: any) => b?.question === "what is the warranty on doors?");
    expect(askBody?.visitor_profile).toBeTruthy();
    expect(JSON.stringify(askBody.visitor_profile)).toContain(ticketRef);
    expect(askBody.visitor_profile.facts.products).toContain("Lift 2, Building A");
    expect(JSON.stringify(askBody.visitor_profile)).not.toMatch(/raj@example\.com/);
  });

  it("3. two conversations of the same contact merging at once keep both entries (R18.11)", async () => {
    const s = crmStack(models);
    const ai = mergeAi();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const slow = { profileMerge: jest.fn(async (req: any) => { await gate; return ai.profileMerge(req); }) };
    const profiles = new ProfileService(s.crm, slow as any, s.tenantScope as any, s.mongo);
    (profiles as any).logger = { warn: () => undefined, error: () => undefined, log: () => undefined };
    const ids = [oid(), oid()];
    for (const [i, id] of ids.entries()) {
      models.Conversation.docs.push({ _id: id, bot: BOT, visitor: VISITOR, platform: "widget", crmContactId: raj, status: "completed", endedAt: new Date(2026, 9, 10, 10 + i) });
    }
    const before = parseProfile((await prisma.contact.findUnique({ where: { id: raj } }))!.profile)!;
    const running = ids.map((id) => profiles.merge(id));
    await new Promise((r) => setImmediate(r));
    release();
    const results = await Promise.all(running);
    expect(results.map((r) => r.status)).toEqual(["merged", "merged"]);
    const after = parseProfile((await prisma.contact.findUnique({ where: { id: raj } }))!.profile)!;
    for (const id of ids) expect(after.entries.some((e) => e.conversationId === id)).toBe(true);
    expect(after.entries.length).toBe(before.entries.length + 2);
    for (const r of profileRefs(before).tickets) expect(profileRefs(after).tickets.has(r)).toBe(true);
  });

  it("4. preview writes nothing to the CRM (R15.1)", async () => {
    const s = crmStack(models);
    const counts = async () => [
      await prisma.contact.count({ where: { organizationId: ORG } }),
      await prisma.activity.count({ where: { organizationId: ORG } }),
    ];
    const before = await counts();
    const incidentsBefore = models.Incident.docs.length;
    const h = harness({ mode: "preview", features: FEATURES, models, orgId: ORG, botId: BOT, visitorId: oid(), crmBridge: s.bridge });
    await h.say("start");
    h.state().attributes = { contact_topic: "Preview: the door does not close", contact_email: "preview@example.com" };
    await h.mh.TransferToAgent("", h.nodes.kone_agent, h.visitorId);
    await h.flush();
    expect(await s.bridge.capture({ conversationId: h.conversationId, botId: BOT, mode: "preview" } as any, cleanDetails({ email: "preview@example.com" }))).toBeNull();
    expect(await counts()).toEqual(before);
    expect(models.Incident.docs.length).toBe(incidentsBefore);
    expect(s.outbox.enqueue).not.toHaveBeenCalled();
  });
});
