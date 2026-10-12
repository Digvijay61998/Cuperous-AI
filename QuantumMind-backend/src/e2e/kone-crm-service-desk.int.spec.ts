/**
 * crm-plugins-service-desk Phase 3 against the REAL CRM Postgres: stages,
 * create from chat (one per incident), moves under concurrency, assignment,
 * filters and tenancy, history, comments, the /tickets facade and its raw-SQL
 * reports, and the transcript snapshot. Mongo is in-memory.
 *
 * Opt-in: `npm run test:crm-int`. Uses fresh organization ids and deletes
 * every row it wrote.
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
import { Types } from "mongoose";
import { ServiceRequestStagesService } from "src/crm/service-requests/service-request-stages.service";
import { ServiceRequestTranscriptService } from "src/crm/service-requests/service-request-transcript.service";
import { ServiceRequestsService } from "src/crm/service-requests/service-requests.service";
import { TICKET_RESOLVED } from "src/incident/constants";
import { fakeModel, fakeMongo } from "src/profile/fakes.testspec";
import { TicketsService } from "src/tickets/tickets.service";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const RUN = process.env.CRM_IT === "1";
const d = RUN ? describe : describe.skip;

const oid = () => new Types.ObjectId().toString();
const ORG = oid();
const OTHER = oid();
const BOT = oid();
const BOT2 = oid();
const AGENT = oid();
const AGENT2 = oid();
const OUTSIDER = oid();
const VISITOR = oid();
const CONV = oid();

let prisma: PrismaClient;

function stack() {
  const crm = { forOrg: () => prisma, client: prisma } as any;
  const models = {
    Agent: fakeModel([
      { _id: AGENT, name: "Asha", email: "asha@x.com", role: "agent", organizationId: ORG, active: true },
      { _id: AGENT2, name: "Ben", email: "ben@x.com", role: "org_admin", organizationId: ORG, active: true },
      { _id: OUTSIDER, name: "Eve", email: "eve@y.com", role: "agent", organizationId: OTHER, active: true },
    ]),
    Bot: fakeModel([{ _id: BOT, name: "Lift bot" }, { _id: BOT2, name: "Other bot" }]),
    Visitor: fakeModel([{ _id: VISITOR, name: "Raj", email: "raj@x.com", phone: "+919876543210" }]),
    Conversation: fakeModel([{ _id: CONV, platform: "whatsapp_web" }]),
    Chat: fakeModel([
      { conversationId: CONV, message: "The lift is stuck", sender: VISITOR, time: new Date(1000) },
      { conversationId: CONV, message: "I have recorded it", sender: BOT, time: new Date(2000) },
      { conversationId: CONV, message: "4321", sender: VISITOR, time: new Date(3000), secured: true },
    ]),
  };
  const mongo = fakeMongo(models);
  const events: { n: string; p: any }[] = [];
  const emitter = { emit: (n: string, p: any) => events.push({ n, p }) } as any;
  const tenantScope = { orgIdForBot: async (b: string) => (b === BOT ? ORG : b === BOT2 ? OTHER : null) } as any;
  const stages = new ServiceRequestStagesService(crm);
  const requests = new ServiceRequestsService(crm, stages, tenantScope, emitter, mongo);
  const transcripts = new ServiceRequestTranscriptService(crm, mongo);
  const tickets = new TicketsService(requests, crm, mongo);
  for (const s of [requests, stages, transcripts, tickets] as any[]) s.logger = { warn: () => undefined, error: () => undefined, log: () => undefined };
  return { requests, stages, transcripts, tickets, events, models };
}

const agent = { id: AGENT, name: "Asha", role: "agent" };
const admin = { id: AGENT2, name: "Ben", role: "org_admin" };

d("service desk on real Postgres", () => {
  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: process.env.CRM_DATABASE_URL } } });
    await prisma.$queryRaw`SELECT 1`;
  });
  afterAll(async () => {
    if (!prisma) return;
    for (const org of [ORG, OTHER]) {
      await prisma.serviceRequest.deleteMany({ where: { organizationId: org } });
      await prisma.serviceRequestStage.deleteMany({ where: { organizationId: org } });
    }
    expect(await prisma.serviceRequestEvent.count({ where: { organizationId: { in: [ORG, OTHER] } } })).toBe(0);
    await prisma.$disconnect();
  });

  it("creates the default stages once, even when asked concurrently (R10.1)", async () => {
    const { stages } = stack();
    const lists = await Promise.all([stages.list(ORG), stages.list(ORG), stages.list(ORG)]);
    expect(lists[0].map((s) => s.name)).toEqual(["Open", "In Progress", "Waiting on Customer", "Deferred", "Resolved", "Closed"]);
    expect(await prisma.serviceRequestStage.count({ where: { organizationId: ORG } })).toBe(6);
  });

  it("chat requests: default stage, MEDIUM / CRITICAL, SR ref, channel from the conversation, one per incident (R9, Property 6)", async () => {
    const { requests, events } = stack();
    const incident = oid();
    const made = await Promise.all(
      Array.from({ length: 5 }, () =>
        requests.createFromChat({ botId: BOT, conversationId: CONV, visitorId: VISITOR, incidentId: incident, subject: "Lift stuck" }),
      ),
    );
    expect(new Set(made.map((m) => m.id)).size).toBe(1);
    expect(await prisma.serviceRequest.count({ where: { organizationId: ORG, incidentId: incident } })).toBe(1);
    const sr = made[0];
    expect(sr.ref).toMatch(/^SR_[A-Za-z0-9_-]{6}$/);
    expect(sr).toMatchObject({ priority: "MEDIUM", source: "chat", channel: "whatsapp_web", botName: "Lift bot" });
    expect(sr.stage.name).toBe("Open");
    const urgent = await requests.createFromChat({ botId: BOT, subject: "Trapped", emergency: true });
    expect(urgent).toMatchObject({ priority: "CRITICAL", emergency: true });
    expect(events.filter((e) => e.n === "crm.service-request.changed" && e.p.kind === "created").length).toBeGreaterThanOrEqual(2);
    await expect(requests.createFromChat({ botId: oid(), subject: "x" })).rejects.toThrow(/organization/);
  });

  it("moves: into Done closes and resolves the incident, out of Done reopens; history replays (R10.6, R10.7, Property 8)", async () => {
    const { requests, stages, events } = stack();
    const incident = oid();
    const sr = await requests.createFromChat({ botId: BOT, incidentId: incident, subject: "Door fault" });
    const all = await stages.list(ORG);
    const resolved = all.find((s) => s.name === "Resolved")!;
    const inProgress = all.find((s) => s.name === "In Progress")!;
    const done = await requests.move(ORG, agent, sr.id, { stageId: resolved.id });
    expect(done.closedAt).toBeInstanceOf(Date);
    expect(events).toContainEqual({ n: TICKET_RESOLVED, p: { ticketId: sr.id, incident, userId: AGENT } });
    const back = await requests.move(ORG, agent, sr.id, { stageId: inProgress.id });
    expect(back.closedAt).toBeNull();
    await requests.update(ORG, admin, sr.id, { priority: "HIGH", subject: "Door fault, floor 3", tags: ["Lift"] });
    await requests.assign(ORG, admin, sr.id, AGENT);
    const h = await requests.listEvents(ORG, sr.id);
    expect(h.data.map((e) => e.type).reverse()).toEqual([
      "CREATED", "STAGE_CHANGED", "STAGE_CHANGED", "REOPENED", "EDITED", "PRIORITY_CHANGED", "ASSIGNED",
    ]);
    // Replaying the history gives the current state.
    const cur = await requests.byId(ORG, sr.id);
    const lastStage = h.data.find((e) => e.type === "STAGE_CHANGED")!.to as any;
    const lastPrio = h.data.find((e) => e.type === "PRIORITY_CHANGED")!.to as any;
    const lastAssign = h.data.find((e) => e.type === "ASSIGNED")!.to as any;
    expect([lastStage.stageId, lastPrio.priority, lastAssign.assigneeId]).toEqual([cur.stageId, cur.priority, cur.assigneeId]);
    expect(cur.firstResponseAt).toBeInstanceOf(Date);
  });

  it("concurrent drops into one column keep distinct positions (Property 5)", async () => {
    const { requests, stages } = stack();
    const target = (await stages.list(ORG)).find((s) => s.name === "Waiting on Customer")!;
    const cards = await Promise.all(Array.from({ length: 6 }, (_, i) => requests.createFromChat({ botId: BOT, subject: `card ${i}` })));
    await Promise.all(cards.map((c) => requests.move(ORG, agent, c.id, { stageId: target.id })));
    // Drop the last card between the first two, many times, to force a renumber.
    const col = async () =>
      prisma.serviceRequest.findMany({ where: { organizationId: ORG, stageId: target.id }, orderBy: { boardPosition: "asc" } });
    for (let i = 0; i < 60; i++) {
      const c = await col();
      await requests.move(ORG, agent, c[c.length - 1].id, { stageId: target.id, aboveId: c[0].id, belowId: c[1].id });
    }
    const final = await col();
    expect(new Set(final.map((c) => c.boardPosition)).size).toBe(final.length);
  });

  it("assignment: only people of the org (R13.3); the board filters and stays inside the org (R12, Property 7)", async () => {
    const { requests } = stack();
    const mine = await requests.createFromChat({ botId: BOT, subject: "Mine" });
    await requests.assign(ORG, agent, mine.id, AGENT);
    await expect(requests.assign(ORG, agent, mine.id, OUTSIDER)).rejects.toThrow(/organization/);
    const theirs = await requests.createFromChat({ botId: BOT2, subject: "Other org request" });

    const board: any = await requests.list(ORG, AGENT, { assignee: ["me"] }, { view: "board" });
    const ids = board.columns.flatMap((c: any) => c.data.map((r: any) => r.id));
    expect(ids).toContain(mine.id);
    expect(ids).not.toContain(theirs.id);
    expect(board.columns.every((c: any) => c.data.every((r: any) => r.assigneeId === AGENT))).toBe(true);

    const search: any = await requests.list(ORG, AGENT, { q: "other org" }, { view: "list" });
    expect(search.count).toBe(0);
    await expect(requests.byId(ORG, theirs.id)).rejects.toThrow(/No such/);
    const other: any = await requests.list(OTHER, OUTSIDER, {}, { view: "list" });
    expect(other.data.map((r: any) => r.id)).toEqual([theirs.id]);
  });

  it("comments: author edits, author or admin deletes (R14.3)", async () => {
    const { requests } = stack();
    const sr = await requests.createFromChat({ botId: BOT, subject: "Notes" });
    const c = await requests.addComment(ORG, agent, sr.id, "Called the customer");
    await expect(requests.editComment(ORG, admin, sr.id, c.id, "x")).rejects.toThrow(/author/);
    await requests.editComment(ORG, agent, sr.id, c.id, "Called the customer twice");
    await expect(requests.deleteComment(ORG, { id: oid(), role: "agent" }, sr.id, c.id)).rejects.toThrow(/author or an admin/);
    await requests.deleteComment(ORG, admin, sr.id, c.id);
    expect(await requests.listComments(ORG, sr.id)).toEqual([]);
  });

  it("stages: deleting one with requests needs a target and moves them; invariants hold (R10.2–R10.5, Property 4)", async () => {
    const { requests, stages } = stack();
    const all = await stages.list(ORG);
    const deferred = all.find((s) => s.name === "Deferred")!;
    const sr = await requests.createFromChat({ botId: BOT, subject: "Parked" });
    await requests.move(ORG, agent, sr.id, { stageId: deferred.id });
    await expect(stages.remove(ORG, deferred.id, undefined, admin)).rejects.toThrow(/Choose a stage/);
    const waiting = all.find((s) => s.name === "Waiting on Customer")!;
    await stages.remove(ORG, deferred.id, waiting.id, admin);
    expect((await requests.byId(ORG, sr.id)).stageId).toBe(waiting.id);
    // The only Open stage (also the default) cannot become Done.
    await expect(stages.update(ORG, all.find((s) => s.name === "Open")!.id, { category: "DONE" })).rejects.toThrow(/category Open/);
    await expect(stages.create(ORG, { name: "open", category: "OPEN" })).rejects.toThrow(/already/);
    const renamed = await stages.update(ORG, waiting.id, { name: "Waiting on parts" });
    expect(renamed.map((s) => s.name)).toContain("Waiting on parts");
  });

  it("the /tickets facade keeps the old shapes, statuses and reports (R19)", async () => {
    const { tickets } = stack();
    const t = await tickets.create({ subject: "From TICKET node", bot: BOT, visitor: VISITOR, conversationId: CONV } as any);
    expect(t).toMatchObject({ ticketId: expect.stringMatching(/^SR_/), status: "OPEN", priority: "MEDIUM", visitor: { name: "Raj" } });
    const user: any = { _id: AGENT, role: "agent", organizationId: ORG, email: "asha@x.com" };
    expect((await tickets.markAsDeferred(t._id, user)).status).toBe("DEFERRED");
    expect((await tickets.assignTicketToMe(t.ticketId, user)).agents).toEqual([{ _id: AGENT, name: "Asha" }]);
    expect((await tickets.markAsResolved(t._id, user)).status).toBe("CLOSED");
    const one = await tickets.findOne(t._id, user);
    expect(one.activities!.map((a) => a.status)).toEqual(expect.arrayContaining(["CREATED", "ASSIGNED", "RESOLVED"]));
    // Another org's user cannot see it.
    await expect(tickets.findOne(t._id, { _id: OUTSIDER, role: "agent", organizationId: OTHER } as any)).rejects.toThrow();

    const list = await tickets.findAll({ status: "CLOSED" } as any, user);
    expect(list.data.map((x) => x._id)).toContain(t._id);
    const report = await tickets.getTotalTicketsReport(user);
    expect(report.total).toBe(report.open + report.closed);
    const byDate = await tickets.dateWisePerformance({ startDate: new Date(Date.now() - 86_400_000).toISOString() } as any, user);
    const today = new Date().toISOString().slice(0, 10);
    expect(byDate.find((r) => r.date === today)?.total).toBeGreaterThan(0);
    const byDay = await tickets.dayWisePerformance({} as any, user);
    expect(byDay.every((r) => ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].includes(r.day))).toBe(true);
    const cards = await tickets.ticketStats(7, user);
    expect(cards.map((c) => c.title)).toEqual(["Total", "Closed", "Open", "Critical"]);
    expect(cards[0].stats).toBe(cards[1].stats + cards[2].stats);
    expect((await tickets.listFor({ visitorId: VISITOR }, ORG)).map((x) => x._id)).toContain(t._id);
    expect(await tickets.countForAssignee(AGENT, ORG)).toBeGreaterThan(0);
  });

  it("transcript: snapshot keeps the chat (secured masked) and is used once chats are gone (R16)", async () => {
    const { requests, transcripts, models } = stack();
    const sr = await requests.createFromChat({ botId: BOT, conversationId: CONV, visitorId: VISITOR, subject: "Chat kept" });
    expect(await transcripts.snapshotForConversation(CONV)).toBeGreaterThanOrEqual(1);
    const live = await transcripts.forRequest(ORG, sr.id);
    expect(live.source).toBe("live");
    expect(live.lines.map((l) => [l.from, l.text])).toEqual([
      ["visitor", "The lift is stuck"],
      ["bot", "I have recorded it"],
      ["visitor", "[secure]"],
    ]);
    models.Chat.docs.length = 0;
    // Chats gone: an empty read never overwrites the snapshot.
    await transcripts.snapshot(ORG, sr.id);
    const kept = await transcripts.forRequest(ORG, sr.id);
    expect(kept.source).toBe("snapshot");
    expect(kept.lines).toHaveLength(3);
  });

  it("contact links follow the conversation, never steal a real contact (R9.6)", async () => {
    const { requests } = stack();
    const conv = oid();
    const c1 = await prisma.contact.create({ data: { organizationId: ORG, firstName: "Raj" }, select: { id: true } });
    const c2 = await prisma.contact.create({ data: { organizationId: ORG, firstName: "Other" }, select: { id: true } });
    try {
      const a = await requests.createFromChat({ botId: BOT, conversationId: conv, subject: "No contact yet" });
      const b = await requests.createFromChat({ botId: BOT, conversationId: conv, subject: "Already someone", contactId: c2.id });
      expect(await requests.linkContactForConversation(ORG, conv, c1.id)).toBe(1);
      expect((await requests.byId(ORG, a.id)).contactId).toBe(c1.id);
      expect((await requests.byId(ORG, b.id)).contactId).toBe(c2.id);
    } finally {
      await prisma.serviceRequest.deleteMany({ where: { organizationId: ORG, conversationId: conv } });
      await prisma.contact.deleteMany({ where: { id: { in: [c1.id, c2.id] } } });
    }
  });
});
