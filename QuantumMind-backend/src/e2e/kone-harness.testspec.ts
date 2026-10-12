/**
 * Shared harness for the Phase 9 end-to-end specs (crm-incident-handover 9.1,
 * 9.2). Builds a real MessageHandlerService and IncidentService on the real
 * KONE flow JSON, over in-memory Mongo models. CRM pieces (Postgres) are
 * passed in by the caller. Name ends in `testspec.ts`: not a test, not built.
 */
import * as path from "path";
import { Types } from "mongoose";
import { of } from "rxjs";
import { IncidentService } from "src/incident/incident.service";
import { MessageHandlerService } from "src/message-handler/message-handler.service";
import { fakeModel } from "src/profile/fakes.testspec";

export const flow = require(path.resolve(__dirname, "../../../docs/koneTrainingData/bot/kone-mykone-assistant-flow.json"));

export const oid = () => new Types.ObjectId().toString();

export interface HarnessOptions {
  features?: Record<string, boolean>;
  mode?: "live" | "preview";
  platform?: string;
  orgId?: string;
  botId?: string;
  visitorId?: string;
  conversationId?: string;
  /** Shared Mongo models (a second conversation of the same visitor reuses them). */
  models?: Record<string, any>;
  crmBridge?: any;
  identityPrompt?: any;
  profileService?: any;
  aiAnswer?: string;
  /** A real ConversationService (closure + reload journey); default is a stub. */
  conversationService?: any;
  /** Extra bot settings. */
  settings?: Record<string, unknown>;
}

/** The unique open-incident index (Property 3) on top of the generic fake. */
export function incidentModel(models: Record<string, any>) {
  const m: any = fakeModel();
  const open = (d: any) => ["waiting", "agent_active", "follow_up"].includes(d.status);
  const create = m.create;
  m.create = async (doc: any) => {
    if (open(doc) && m.docs.some((d: any) => open(d) && d.conversationId === doc.conversationId)) {
      throw Object.assign(new Error("dup"), { code: 11000 });
    }
    return create({ ownershipLog: [], ...doc });
  };
  m.deleteOne = async (q: any) => {
    const i = m.docs.findIndex((d: any) => String(d._id) === String(q._id));
    if (i >= 0) m.docs.splice(i, 1);
  };
  m.db = { models };
  return m;
}

export function harness(o: HarnessOptions = {}) {
  const nodes: Record<string, any> = {};
  for (const n of flow.nodes) nodes[n.id] = { ...n, next: [] };
  for (const e of flow.edges) nodes[e.source]?.next.push(e.target);

  const orgId = o.orgId ?? oid();
  const botId = o.botId ?? oid();
  const visitorId = o.visitorId ?? oid();
  const conversationId = o.conversationId ?? oid();

  const models: Record<string, any> = o.models ?? {
    Conversation: fakeModel(),
    Visitor: fakeModel(),
    Ticket: fakeModel(),
    Chat: fakeModel(),
    Bot: fakeModel([{ _id: botId, name: "myKONE Assistant", organizationId: orgId }]),
  };
  if (!models.Incident) models.Incident = incidentModel(models);
  if (!models.Conversation.docs.some((c: any) => String(c._id) === conversationId)) {
    models.Conversation.docs.push({ _id: conversationId, bot: botId, visitor: visitorId, platform: o.platform ?? "widget", status: "in_progress", createdAt: new Date() });
  }
  if (!models.Visitor.docs.some((v: any) => String(v._id) === visitorId)) {
    models.Visitor.docs.push({ _id: visitorId, bot: botId });
  }

  const store = new Map<string, any>();
  store.set(visitorId, {
    botId,
    conversationId,
    mode: o.mode ?? "live",
    platform: o.platform,
    botName: "myKONE Assistant",
    currentNode: nodes.kone_start,
    startNode: nodes.kone_start,
    botSettings: { fallbackMessage: "fallback", features: o.features ?? {}, ...(o.settings || {}) },
  });
  const ss: any = {
    getUserData: (id: string) => store.get(id),
    updateUserData: (id: string, p: any) => store.set(id, { ...(store.get(id) || {}), ...p }),
    getNodeState: (u: string, id: string) => store.get(u)?.BotNodeState?.[id] ?? "NEW",
    setNodeState: (u: string, id: string, s: any) => {
      const cur = store.get(u);
      store.set(u, { ...cur, BotNodeState: { ...(cur?.BotNodeState || {}), [id]: s } });
    },
    getQuestionNodeState: (u: string, id: string) => store.get(u)?.questionNodeState?.[id],
    setQuestionNodeState: (u: string, id: string, v: any) =>
      store.set(u, { ...store.get(u), questionNodeState: { ...(store.get(u)?.questionNodeState || {}), [id]: v } }),
  };

  const ticketsService = {
    create: jest.fn(async (dto: any) => {
      const t = await models.Ticket.create({ ...dto, ticketId: `SR_${Math.random().toString(36).slice(2, 8)}` });
      return t;
    }),
  };
  const alerts = { raise: jest.fn(async () => ({ id: "alert1" })), setAssigned: jest.fn(async () => undefined) };
  const events: { name: string; payload: any }[] = [];
  const emitter = { emit: (name: string, payload: any) => events.push({ name, payload }) };
  const tenantScope = {
    orgIdForBot: async () => orgId,
    orgBotIds: async () => [botId],
  };
  const incidents = new IncidentService(
    models.Incident,
    ticketsService as any,
    tenantScope as any,
    emitter as any,
    alerts as any,
    o.crmBridge,
  );
  (incidents as any).logger = { warn: () => undefined, error: () => undefined, log: () => undefined };

  const sent: { event: string; value?: string; data?: any }[] = [];
  const http = { post: jest.fn((_url: string, _body: any) => of({ status: 200, data: { answer: o.aiAnswer ?? "Here is what I found.", confident: true } })) };
  const conversationService = o.conversationService ?? {
    getConversationById: async () => ({ chats: [] }),
    setAwaitingProblem: async () => undefined,
    setFlowPosition: async () => undefined,
    setAwaitingClosure: jest.fn(async () => undefined),
    endConversation: jest.fn(async () => undefined),
    findClosureCandidates: async () => [],
    claimClosure: async () => false,
    addattributes: async () => undefined,
  };
  const mh = new MessageHandlerService(
    { getBotNode: async (id: string) => nodes[id] ?? null } as any,
    ss,
    {} as any,
    { callWebhook: async () => { throw new Error("Webhook not found"); } } as any,
    ticketsService as any,
    conversationService as any,
    { propagateEvent: (e: any) => sent.push({ event: e?.event, value: e?.data?.message?.value, data: e?.data }) } as any,
    { assignAgent: jest.fn(async () => null) } as any,
    { create: () => undefined } as any,
    { findAnswer: async () => null } as any,
    emitter as any,
    http as any,
    { get: (k: string) => ({ "delay.node": 0, "delay.message": 0, "ai.url": "http://ai", "ai.timeout": 1 } as any)[k] } as any,
    {} as any,
    { create: async () => { throw new Error("template not found"); }, findById: async () => null } as any,
    { findOne: async () => null } as any,
    tenantScope as any,
    undefined,
    alerts as any,
    incidents,
    o.identityPrompt,
    o.profileService,
  );
  for (const s of [mh] as any[]) {
    s.logger.error = () => undefined;
    s.logger.warn = () => undefined;
  }

  const flush = async () => {
    for (let i = 0; i < 8; i++) {
      jest.runOnlyPendingTimers();
      await new Promise((r) => setImmediate(r));
    }
  };
  const texts = (evs = sent) => evs.filter((e) => e.event === "chat-message-bot").map((e) => e.value as string);
  /** Visitor sends one message; returns what the bot sent back. */
  const say = async (text: string, type = "text") => {
    const from = sent.length;
    await mh.handleMessage(text, { auth: { userId: visitorId, name: "Visitor" } } as any, type);
    await flush();
    return texts(sent.slice(from));
  };
  /** The bot sent these, including button titles, for transcripts. */
  const transcriptOf = (evs = sent) =>
    evs
      .filter((e) => e.event === "chat-message-bot")
      .map((e) => {
        const m = e.data?.message || {};
        const buttons = Array.isArray(m.buttons) && m.buttons.length ? ` [${m.buttons.map((b: any) => b.title).join(" | ")}]` : "";
        return `${m.type}: ${m.value}${buttons}`;
      });

  return {
    mh, incidents, models, store, nodes, sent, events, http, ticketsService, alerts, conversationService,
    orgId, botId, visitorId, conversationId, say, flush, texts, transcriptOf,
    state: () => store.get(visitorId),
  };
}
