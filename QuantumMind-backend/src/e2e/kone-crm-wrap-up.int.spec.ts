/**
 * Owner feedback after Phase 5, against the REAL CRM Postgres (Mongo in-memory):
 *
 *   1. Bug: a service request the agent raised by hand from a chat had no
 *      contact, and its card said "Anonymous visitor" although the visitor's
 *      details were known.
 *   2. Wrap-up: before a chat is closed or released, its request card is
 *      updated (never duplicated), AI-prefilled and confirmed.
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

import * as dotenv from "dotenv";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { Types } from "mongoose";
import { ContactResolverService } from "src/crm-bridge/contact-resolver.service";
import { CrmBridgeService } from "src/crm-bridge/crm-bridge.service";
import { SR_NEEDS_CONTACT } from "src/crm/service-requests/constants";
import { ServiceRequestStagesService } from "src/crm/service-requests/service-request-stages.service";
import { ServiceRequestTranscriptService } from "src/crm/service-requests/service-request-transcript.service";
import { ServiceRequestWrapUpService } from "src/crm/service-requests/service-request-wrap-up.service";
import { ServiceRequestsService } from "src/crm/service-requests/service-requests.service";
import { fakeModel, fakeMongo } from "src/profile/fakes.testspec";
import { TicketsService } from "src/tickets/tickets.service";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const RUN = process.env.CRM_IT === "1";
const d = RUN ? describe : describe.skip;

const oid = () => new Types.ObjectId().toString();
const quiet = { warn: () => undefined, error: () => undefined, log: () => undefined };
const ORG = oid();
const OTHER = oid();
const BOT = oid();
const OTHER_BOT = oid();
const AGENT = oid();

let prisma: PrismaClient;

function stack(ai?: any) {
  const crm = { forOrg: () => prisma, client: prisma } as any;
  const models = {
    Agent: fakeModel([{ _id: AGENT, name: "Asha", email: "asha@x.com", role: "agent", organizationId: ORG, active: true }]),
    Bot: fakeModel([{ _id: BOT, name: "Lift bot" }]),
    Conversation: fakeModel(),
    Visitor: fakeModel(),
    Incident: fakeModel(),
    Chat: fakeModel(),
  };
  const mongo = fakeMongo(models);
  const events: { n: string; p: any }[] = [];
  const emitter = { emit: (n: string, p: any) => events.push({ n, p }) } as any;
  const tenantScope = { orgIdForBot: async (b: string) => (b === BOT ? ORG : b === OTHER_BOT ? OTHER : null) } as any;
  const stages = new ServiceRequestStagesService(crm);
  const requests = new ServiceRequestsService(crm, stages, tenantScope, emitter, mongo);
  const transcripts = new ServiceRequestTranscriptService(crm, mongo);
  const resolver = new ContactResolverService(crm);
  // Like the real outbox: run now, queue only on failure (a queued op = a failed capture).
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
  const bridge = new CrmBridgeService(resolver, outbox, tenantScope, { emit: () => undefined } as any, mongo, requests);
  const tickets = new TicketsService(requests, crm, mongo);
  const wrapUp = new ServiceRequestWrapUpService(crm, requests, transcripts, tenantScope, ai, mongo);
  for (const s of [stages, requests, transcripts, resolver, bridge, tickets, wrapUp] as any[]) s.logger = quiet;
  /** Deliver the needs-contact events like the event bus would. */
  const deliver = async () => {
    for (const e of events.splice(0).filter((x) => x.n === SR_NEEDS_CONTACT)) await bridge.onRequestNeedsContact(e.p);
  };
  return { models, requests, tickets, wrapUp, outbox, events, deliver };
}

const agentUser: any = { _id: AGENT, role: "agent", organizationId: ORG, email: "asha@x.com" };
const actor = { id: AGENT, name: "Asha", role: "agent" };

function chat(s: ReturnType<typeof stack>, visitor: Record<string, any> = {}, conv: Record<string, any> = {}) {
  const conversationId = oid();
  const visitorId = oid();
  s.models.Visitor.docs.push({ _id: visitorId, name: "Anonymous", email: "", phone: "0000000000", ...visitor });
  s.models.Conversation.docs.push({ _id: conversationId, bot: BOT, visitor: visitorId, platform: "widget", ...conv });
  s.models.Chat.docs.push(
    { _id: oid(), conversationId, message: "My lift 2 makes a grinding noise", sender: visitorId, time: new Date(1000) },
    { _id: oid(), conversationId, message: "I have asked an engineer to check it", sender: AGENT, time: new Date(2000) },
  );
  return { conversationId, visitorId };
}

d("chat requests and wrap-up on real Postgres", () => {
  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: process.env.CRM_DATABASE_URL } } });
    await prisma.$queryRaw`SELECT 1`;
  });
  afterAll(async () => {
    if (!prisma) return;
    const where = { organizationId: { in: [ORG, OTHER] } };
    await prisma.serviceRequest.deleteMany({ where });
    await prisma.serviceRequestStage.deleteMany({ where });
    await prisma.contactFact.deleteMany({ where });
    await prisma.activity.deleteMany({ where });
    await prisma.contact.deleteMany({ where });
    await prisma.$disconnect();
  });

  describe("bug: a request raised by the agent belongs to the chat's contact", () => {
    it("uses the contact the conversation is already linked to", async () => {
      const s = stack();
      const c = await prisma.contact.create({ data: { organizationId: ORG, firstName: "Priya", lastName: "Shah", email: "priya@x.com" } });
      const { conversationId, visitorId } = chat(s, {}, { crmContactId: c.id });
      const t = await s.tickets.create({ subject: "Noise", bot: BOT, visitor: visitorId, conversationId } as any, agentUser);
      const sr = await s.requests.byId(ORG, t._id);
      expect(sr.contactId).toBe(c.id);
      expect(sr.contact).toMatchObject({ firstName: "Priya", isAnonymous: false });
      expect(s.events.some((e) => e.n === SR_NEEDS_CONTACT)).toBe(false);
    });

    it("finds or creates the contact from the visitor's details and links the request", async () => {
      const s = stack();
      const { conversationId, visitorId } = chat(s, { name: "Raj Kumar", email: "raj.wrap@x.com" });
      const t = await s.tickets.create({ subject: "Noise", bot: BOT, visitor: visitorId, conversationId } as any, agentUser);
      expect((await s.requests.byId(ORG, t._id)).contactId).toBeNull();
      await s.deliver();
      const sr = await s.requests.byId(ORG, t._id);
      expect(sr.contact).toMatchObject({ firstName: "Raj", lastName: "Kumar", email: "raj.wrap@x.com", isAnonymous: false });
      expect(s.models.Conversation.docs.find((x: any) => x._id === conversationId).crmContactId).toBe(sr.contactId);
      const h = await s.requests.listEvents(ORG, sr.id);
      expect(h.data.map((e) => e.type)).toContain("CONTACT_LINKED");
      expect(s.outbox.enqueue).not.toHaveBeenCalled();
    });

    it("a visitor with no email or phone gets an anonymous contact named after them", async () => {
      const s = stack();
      const { conversationId, visitorId } = chat(s, { name: "Meera" });
      const t = await s.tickets.create({ subject: "Noise", bot: BOT, visitor: visitorId, conversationId } as any, agentUser);
      await s.deliver();
      const sr = await s.requests.byId(ORG, t._id);
      expect(sr.contact).toMatchObject({ firstName: "Meera", isAnonymous: true });
    });
  });

  describe("wrap-up before closing or releasing", () => {
    const ai = (over: Partial<Record<string, string>> = {}) => ({
      serviceRequestSummary: jest.fn(async (_req: any) => ({
        overview: "The lift makes a grinding noise.",
        customer_ask: "The customer wants the noise fixed.",
        actions_taken: "An engineer was asked to check it.",
        next_step: "Confirm the engineer visit.",
        ...over,
      })),
    });

    it("prefills from the chat, updates the incident's request instead of creating a second, and closes it", async () => {
      const brain = ai();
      const s = stack(brain);
      const { conversationId, visitorId } = chat(s, { name: "Sunil", email: "sunil.wrap@x.com" });
      const first = await s.requests.createFromChat({
        botId: BOT,
        conversationId,
        visitorId,
        incidentId: oid(),
        subject: "Request for a specialist from chat",
        description: "No problem description provided",
      });
      const view = await s.wrapUp.view(ORG, { conversationId });
      expect(view.request?.id).toBe(first.id);
      expect(view.ai).toBe(true);
      expect(view.draft.subject).toBe("The customer wants the noise fixed.");
      expect(view.draft.description).toMatch(/^The lift makes a grinding noise\./);
      // Masked like the summary: no ref, no visitor name/email in what the AI got.
      const sent = JSON.stringify(brain.serviceRequestSummary.mock.calls[0][0]);
      expect(sent).not.toContain(first.ref);

      await expect(
        s.wrapUp.save(ORG, actor, { conversationId, ...view.draft, outcome: "resolved", confirmed: false }),
      ).rejects.toMatchObject({ status: 400 });
      const saved = await s.wrapUp.save(ORG, actor, {
        conversationId,
        ...view.draft,
        subject: "Lift 2 grinding noise",
        outcome: "resolved",
        confirmed: true,
      });
      expect(saved.id).toBe(first.id);
      expect(saved).toMatchObject({ subject: "Lift 2 grinding noise", assigneeId: AGENT, stage: { category: "DONE" } });
      expect(saved.closedAt).toBeInstanceOf(Date);
      expect(await prisma.serviceRequest.count({ where: { organizationId: ORG, conversationId } })).toBe(1);
    });

    it("a chat without a request gets exactly one, and a second save updates it", async () => {
      const s = stack(ai());
      const { conversationId } = chat(s);
      const view = await s.wrapUp.view(ORG, { conversationId });
      expect(view.request).toBeNull();
      const a = await s.wrapUp.save(ORG, actor, { conversationId, ...view.draft, outcome: "open", confirmed: true });
      const b = await s.wrapUp.save(ORG, actor, { conversationId, ...view.draft, priority: "HIGH", outcome: "open", confirmed: true });
      expect(b.id).toBe(a.id);
      expect(b).toMatchObject({ priority: "HIGH", source: "dashboard", conversationId, stage: { category: "OPEN" } });
      expect(await prisma.serviceRequest.count({ where: { organizationId: ORG, conversationId } })).toBe(1);
    });

    it("finds the conversation from its inbox thread", async () => {
      const s = stack(ai());
      const threadId = oid();
      const { conversationId } = chat(s, {}, { channelThread: threadId });
      expect((await s.wrapUp.view(ORG, { threadId })).conversationId).toBe(conversationId);
    });

    it("an AI failure still opens the form, filled from what is stored", async () => {
      const s = stack({ serviceRequestSummary: jest.fn(async () => { throw new Error("model down"); }) });
      const { conversationId, visitorId } = chat(s);
      await s.requests.createFromChat({ botId: BOT, conversationId, visitorId, subject: "Door fault", description: "Door stuck" });
      const view = await s.wrapUp.view(ORG, { conversationId });
      expect(view).toMatchObject({ ai: false, draft: { subject: "Door fault", description: "Door stuck" } });
      expect(view.aiError).toMatch(/fill it in/);
    });

    it("another organization's chat is a 404, for reading and for saving", async () => {
      const s = stack(ai());
      const { conversationId } = chat(s, {}, { bot: OTHER_BOT });
      await expect(s.wrapUp.view(ORG, { conversationId })).rejects.toMatchObject({ status: 404 });
      await expect(
        s.wrapUp.save(ORG, actor, { conversationId, subject: "x", description: "y", outcome: "open", confirmed: true }),
      ).rejects.toMatchObject({ status: 404 });
      expect(await prisma.serviceRequest.count({ where: { conversationId } })).toBe(0);
    });
  });
});
