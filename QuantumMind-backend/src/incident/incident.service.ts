import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Interval } from "@nestjs/schedule";
import { Model, Types } from "mongoose";
import { Role } from "src/common/enums/role.enum";
import { assertOwnership, TenantContext } from "src/common/tenant/tenant-context";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { AlertReasonEnum } from "src/handover-alert/enums/handover-alert.enum";
import { HandoverAlertService } from "src/handover-alert/handover-alert.service";
import { TicketPriorityEnum } from "src/tickets/enums/ticket-priority";
import { TicketsService } from "src/tickets/tickets.service";
import { ModeEnum } from "src/widget/enums/mode.enum";
import {
  ConversationEndCause,
  DEFAULT_INCIDENT_SUBJECT,
  INCIDENT_CLOSED,
  INCIDENT_OPENED,
  INCIDENT_PROVIDER,
  INCIDENT_UPDATED,
  RESOLUTION_NOTE_MAX,
  RESOLUTION_NOTE_MIN,
} from "./constants";
import { IncidentDocument } from "./entities/incident.entity";
import {
  IncidentOutcomeEnum,
  IncidentStatusEnum,
  OPEN_INCIDENT_STATUSES,
  ProblemFlagEnum,
} from "./enums/incident.enum";
import { buildTicketDescription } from "./ticket-description";
import { PROBLEM_ANSWER_TTL_MS } from "./problem-gate";
import { CrmBridgeService } from "src/crm-bridge/crm-bridge.service";
import { CrmPrismaService } from "src/crm/database/crm-prisma.service";
import { deriveSenderRole } from "src/inbox/inbox.mapper";

/** Hard cap on chat rows returned by /context (R9.1 targets 1000 within 3 s). */
const CONTEXT_MAX_CHATS = 2000;
/** Earlier incidents per page (R9.4). */
const EARLIER_PAGE = 20;

export interface OpenForHandoverInput {
  conversationId: string;
  botId: string;
  visitorId?: string;
  visitorName?: string;
  threadId?: string;
  crmContactId?: string;
  problem: string;
  flags?: ProblemFlagEnum[];
  reason: AlertReasonEnum;
  handoverReason?: string;
  emergency?: boolean;
  /** Ticket subject; defaults to a product-neutral text (D10). */
  subject?: string;
  /** Extra lines for the ticket description (R1.1). */
  attributes?: Record<string, unknown>;
  attributeNames?: string[];
  mode?: string;
  /** Bot settings (contact mapping for capture; `crmCapture` is retired). */
  botSettings?: any;
}

export interface OpenForHandoverResult {
  incident: any;
  ticketRef?: string;
  /** False when an already-open incident was returned (R4.8). */
  created: boolean;
}

export interface IncidentListQuery {
  status?: string;
  bot?: string;
  skip?: number;
  limit?: number;
}

/** Cap on the CRM contact lookup inside openForHandover (visitor is waiting). */
const CONTACT_LOOKUP_TIMEOUT_MS = 3000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    p,
    new Promise<null>((r) => {
      timer = setTimeout(() => r(null), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

const isDuplicateKey = (e: any) => e?.code === 11000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const idOf = (u: any) => String(u?._id ?? u?.userId ?? "");

/**
 * How long a duplicate trigger waits for the winner's ticket ref (~3 s).
 * Past this the caller still gets `created: false` (the request is recorded)
 * and phrases the message without a ref; it never treats it as a failure.
 */
const WINNER_TICKET_WAIT_MS = [100, 200, 400, 800, 1500];

/**
 * Incident lifecycle (crm-incident-handover, design §1, R1, R4, R10, R19).
 *
 * Every state change is a conditional single-document update, so concurrent
 * triggers resolve to one winner: one open incident per conversation (unique
 * partial index, Property 3) and exactly one terminal transition (Property 4).
 * `incident.closed` is emitted only by the winning transition.
 */
@Injectable()
export class IncidentService {
  private readonly logger = new Logger(IncidentService.name);
  /** Overridable for tests: how long a duplicate trigger polls for the ref. */
  winnerTicketWaitMs: readonly number[] = WINNER_TICKET_WAIT_MS;

  constructor(
    @Inject(INCIDENT_PROVIDER)
    private readonly model: Model<IncidentDocument>,
    private readonly ticketsService: TicketsService,
    private readonly tenantScope: TenantScopeService,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly handoverAlertService?: HandoverAlertService,
    @Optional() private readonly crmBridge?: CrmBridgeService,
    @Optional() private readonly crm?: CrmPrismaService,
  ) {}

  // ------------------------------------------------------------------ open

  /**
   * Open the incident and its Service_Request in one operation (R19.1).
   *
   * Order: claim the incident row first (the unique index decides the winner
   * of concurrent triggers), then create the ticket already pointing at it,
   * then link the ticket ref back. Claiming first means a losing trigger never
   * creates a stray ticket. If the ticket cannot be created the claim is
   * removed and the error is rethrown, so the caller takes its failure path
   * (R1.9, R19.5) and no ticketless incident is left open.
   *
   * Preview mode persists nothing and returns null.
   */
  async openForHandover(input: OpenForHandoverInput): Promise<OpenForHandoverResult | null> {
    if (input.mode === ModeEnum.preview) return null;
    if (!input.conversationId || !input.botId) {
      throw new BadRequestException("conversationId and botId are required");
    }
    const conversationId = String(input.conversationId);

    const existing = await this.findOpenByConversation(conversationId);
    if (existing) {
      // An emergency on an open normal incident escalates it (alert + ticket
      // priority) instead of being swallowed as "already recorded".
      if (input.emergency && !existing.emergency) await this.escalate(existing, input);
      return this.asExisting(existing);
    }

    const organizationId = await this.tenantScope.orgIdForBot(input.botId).catch(() => null);
    const flags = [...new Set(input.flags ?? [])];

    // R20.1: every incident points at a contact; an anonymous one when the
    // visitor gave no details. Best effort and bounded: a CRM outage queues
    // the contact and the incident opens without it (linked later, R4.2).
    if (!input.crmContactId && this.crmBridge) {
      input.crmContactId =
        (await withTimeout(
          this.crmBridge.ensureAnonymous({
            conversationId,
            visitorId: input.visitorId,
            botId: String(input.botId),
            mode: input.mode,
            // Unknown settings = flag off (fail closed).
            botSettings: input.botSettings ?? { features: {} },
          }),
          CONTACT_LOOKUP_TIMEOUT_MS,
        ).catch(() => null)) ?? undefined;
    }

    let incident: any;
    try {
      incident = (
        await this.model.create({
          organizationId: organizationId ?? undefined,
          botId: String(input.botId),
          conversationId,
          threadId: input.threadId,
          visitorId: input.visitorId ? String(input.visitorId) : undefined,
          crmContactId: input.crmContactId,
          problem: input.problem,
          problemFlags: flags,
          status: IncidentStatusEnum.WAITING,
          reason: input.reason,
          emergency: input.emergency === true,
        })
      ).toObject();
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      // Lost the race to a concurrent trigger for this conversation.
      const winner = await this.findOpenByConversation(conversationId);
      if (winner) return this.asExisting(winner);
      throw error;
    }

    let ticket: any;
    try {
      ticket = await this.ticketsService.create({
        subject: input.subject?.trim() || DEFAULT_INCIDENT_SUBJECT,
        description: buildTicketDescription(input.problem, input.attributes, input.attributeNames),
        priority: input.emergency ? TicketPriorityEnum.CRITICAL : TicketPriorityEnum.MEDIUM,
        bot: String(input.botId),
        visitor: input.visitorId ? String(input.visitorId) : undefined,
        conversationId,
        tags: [],
        incident: String(incident._id),
        crmContactId: input.crmContactId,
        source: "chat",
      } as any);
    } catch (error) {
      await this.model.deleteOne({ _id: incident._id }).catch(() => undefined);
      throw error;
    }

    const ticketRef: string = ticket?.ticketId;
    const linked = await this.model
      .findOneAndUpdate(
        { _id: incident._id },
        { $set: { ticketId: ticket._id, ticketRef } },
        { new: true },
      )
      .lean()
      .catch((error) => {
        // The ticket already points at the incident, so lookups still work.
        this.logger.error(`Incident ${incident._id} ticket link failed: ${error?.message}`);
        return null;
      });
    incident = linked ?? { ...incident, ticketId: ticket._id, ticketRef };

    await this.setConversationIncidentOpen(conversationId, true);

    const alert = await this.handoverAlertService
      ?.raise({
        conversationId,
        botId: String(input.botId),
        visitorId: input.visitorId ? String(input.visitorId) : undefined,
        visitorName: input.visitorName,
        threadId: input.threadId,
        reason: input.reason,
        handoverReason: input.handoverReason,
        mode: input.mode,
      })
      .catch(() => null);
    if (alert?.id) {
      await this.model
        .updateOne({ _id: incident._id }, { $set: { handoverAlertId: String(alert.id) } })
        .catch(() => undefined);
      incident.handoverAlertId = String(alert.id);
    }

    this.eventEmitter.emit(INCIDENT_OPENED, this.toEvent(incident));
    return { incident, ticketRef, created: true };
  }

  /**
   * Link a TICKET-node Service_Request to the open incident if it has none
   * yet (R1.2). Returns the ref now linked to the incident: the given one, or
   * the one a concurrent writer linked first.
   */
  async linkTicketIfMissing(
    incidentId: string,
    ticket: { _id: any; ticketId: string },
  ): Promise<string> {
    const updated = await this.model
      .findOneAndUpdate(
        {
          _id: incidentId,
          status: { $in: [...OPEN_INCIDENT_STATUSES] },
          $or: [{ ticketId: null }, { ticketId: { $exists: false } }],
        },
        { $set: { ticketId: ticket._id, ticketRef: ticket.ticketId } },
        { new: true },
      )
      .lean();
    if (updated) return ticket.ticketId;
    const current: any = await this.model.findById(incidentId).select("ticketRef").lean();
    return current?.ticketRef ?? ticket.ticketId;
  }

  /**
   * Incident first: the incident is opened before the visitor described the
   * problem. Their answer fills it in afterwards, on the incident and on its
   * service request. Only replaces the "no problem" placeholder, never a real
   * description. Returns true when something was written. Never throws.
   */
  async recordProblem(
    incidentId: string,
    input: { problem: string; flags?: string[]; description?: string },
  ): Promise<boolean> {
    try {
      const updated: any = await this.model
        .findOneAndUpdate(
          { _id: incidentId, problemFlags: ProblemFlagEnum.NONE },
          { $set: { problem: input.problem, problemFlags: input.flags ?? [] } },
          { new: true },
        )
        .lean();
      if (!updated) return false;
      if (updated.ticketId && input.description) {
        await this.ticketsService
          .update(String(updated.ticketId), { description: input.description } as any)
          .catch((e: any) => this.logger.warn(`Request description for incident ${incidentId} failed: ${e?.message}`));
      }
      return true;
    } catch (error) {
      this.logger.warn(`Recording the problem of incident ${incidentId} failed: ${error?.message}`);
      return false;
    }
  }

  /** Mark the open incident as having no problem description (R1.6). */
  async flagNoProblem(incidentId: string): Promise<void> {
    await this.model
      .updateOne({ _id: incidentId }, { $addToSet: { problemFlags: ProblemFlagEnum.NONE } })
      .catch(() => undefined);
  }

  async findOpenByConversation(conversationId: string): Promise<any | null> {
    if (!conversationId) return null;
    return this.model
      .findOne({
        conversationId: String(conversationId),
        status: { $in: [...OPEN_INCIDENT_STATUSES] },
      })
      .lean();
  }

  // ------------------------------------------------------------- lifecycle

  /** An agent picks up the incident (waiting/follow_up -> agent_active). Idempotent. */
  async accept(incidentId: string, agentId: string): Promise<any> {
    const agent = String(agentId);
    const now = new Date();
    const updated = await this.model
      .findOneAndUpdate(
        {
          _id: incidentId,
          status: { $in: [IncidentStatusEnum.WAITING, IncidentStatusEnum.FOLLOW_UP] },
          $or: [{ agentId: null }, { agentId: { $exists: false } }, { agentId: agent }],
        },
        {
          $set: { status: IncidentStatusEnum.AGENT_ACTIVE, agentId: agent, acceptedAt: now },
          $push: { ownershipLog: { at: now, actor: agent, to: agent, kind: "takeover" } },
        },
        { new: true },
      )
      .lean();
    if (updated) {
      this.eventEmitter.emit(INCIDENT_UPDATED, this.toEvent(updated));
      return updated;
    }
    const current: any = await this.model.findById(incidentId).lean();
    if (!current) throw new NotFoundException("Incident not found");
    if (current.status === IncidentStatusEnum.AGENT_ACTIVE && current.agentId === agent) {
      return current;
    }
    throw new ConflictException(
      current.status === IncidentStatusEnum.AGENT_ACTIVE
        ? "Another agent is already handling this incident."
        : `Incident is ${current.status}.`,
    );
  }

  /**
   * Admin override (R7.3): the new owner handles the incident; the change is
   * logged with previous owner, actor and time. Never changes a closed one.
   */
  async recordOverride(
    conversationId: string,
    p: { from: string | null; to: string; actor: string; at?: Date },
  ): Promise<void> {
    const at = p.at ?? new Date();
    await this.model.updateOne(
      { conversationId: String(conversationId), status: { $in: [...OPEN_INCIDENT_STATUSES] } },
      {
        $set: { agentId: String(p.to), status: IncidentStatusEnum.AGENT_ACTIVE, acceptedAt: at },
        $push: {
          ownershipLog: { at, actor: String(p.actor), from: p.from ?? undefined, to: String(p.to), kind: "override" },
        },
      },
    );
  }

  /** Agent hands the chat back to the bot without resolving (R10.2). */
  async recordRelease(conversationId: string, by?: string): Promise<void> {
    const now = new Date();
    await this.model
      .updateOne(
        { conversationId: String(conversationId), status: { $in: [...OPEN_INCIDENT_STATUSES] } },
        {
          $set: { lastRelease: { by, at: now } },
          $push: { ownershipLog: { at: now, actor: by, from: by, kind: "release" } },
        },
      )
      .catch((error) => this.logger.warn(`Incident release record failed: ${error?.message}`));
  }

  /**
   * Owner_Agent resolves with a note (R10.1, R10.6). Rejections leave the
   * record unchanged; an already-terminal incident is never changed (R10.7).
   */
  async resolve(incidentId: string, user: TenantContext, note: unknown): Promise<any> {
    const text = typeof note === "string" ? note.trim() : "";
    if (text.length < RESOLUTION_NOTE_MIN || text.length > RESOLUTION_NOTE_MAX) {
      throw new BadRequestException(
        `Resolution note must be ${RESOLUTION_NOTE_MIN} to ${RESOLUTION_NOTE_MAX} characters.`,
      );
    }
    const current = await this.findOneScoped(incidentId, user);
    const agent = idOf(user);
    if (!current.agentId || current.agentId !== agent) {
      throw new ForbiddenException("Only the agent handling this incident can resolve it.");
    }
    if (
      current.status !== IncidentStatusEnum.AGENT_ACTIVE &&
      current.status !== IncidentStatusEnum.FOLLOW_UP
    ) {
      throw new ConflictException(`Incident is already ${current.status}.`);
    }
    const now = new Date();
    const updated = await this.model
      .findOneAndUpdate(
        {
          _id: current._id,
          agentId: agent,
          status: { $in: [IncidentStatusEnum.AGENT_ACTIVE, IncidentStatusEnum.FOLLOW_UP] },
        },
        {
          $set: {
            status: IncidentStatusEnum.RESOLVED,
            outcome: IncidentOutcomeEnum.RESOLVED_BY_AGENT,
            resolutionNote: text,
            resolvedAt: now,
            resolvedBy: agent,
          },
        },
        { new: true },
      )
      .lean();
    if (!updated) throw new ConflictException("Incident changed while resolving; reload it.");
    await this.afterTerminal(updated);
    return updated;
  }

  /**
   * Close the conversation's waiting/agent_active incident when the
   * conversation ends (R10.4). follow_up incidents stay open; an agent release
   * only records the release.
   */
  async closeOnConversationEnd(conversationId: string, cause: ConversationEndCause = "ended") {
    if (!conversationId) return null;
    if (cause === "agent_release") {
      await this.recordRelease(conversationId);
      return null;
    }
    // Closure flow (R14): "Yes, resolved" already resolved it (R10.3); an
    // unanswered prompt is not one of the R10.4 end causes, so a recorded
    // request stays open for the agent to follow up.
    if (cause === "closure_resolved" || cause === "idle") return null;
    const open: any = await this.model
      .findOne({
        conversationId: String(conversationId),
        status: { $in: [IncidentStatusEnum.WAITING, IncidentStatusEnum.AGENT_ACTIVE] },
      })
      .lean();
    if (!open) return null;
    const updated = await this.model
      .findOneAndUpdate(
        { _id: open._id, status: { $in: [IncidentStatusEnum.WAITING, IncidentStatusEnum.AGENT_ACTIVE] } },
        {
          $set: {
            status: IncidentStatusEnum.CLOSED,
            outcome: open.agentId
              ? IncidentOutcomeEnum.CLOSED_UNRESOLVED
              : IncidentOutcomeEnum.ABANDONED,
            closedAt: new Date(),
            endCause: cause,
          },
        },
        { new: true },
      )
      .lean();
    if (updated) await this.afterTerminal(updated);
    return updated;
  }

  /**
   * The visitor chose "Yes, resolved" in the Closure_Prompt (R10.3): the open
   * incident becomes `resolved`, by the agent who handled it, else by the bot.
   * Conditional on the status, so it never touches a terminal incident (R10.7)
   * and races with an agent resolve end with one winner (Property 4).
   */
  async resolveByVisitor(conversationId: string): Promise<any | null> {
    if (!conversationId) return null;
    const open: any = await this.findOpenByConversation(String(conversationId));
    if (!open) return null;
    const byAgent = !!open.agentId;
    const updated = await this.model
      .findOneAndUpdate(
        { _id: open._id, status: { $in: [...OPEN_INCIDENT_STATUSES] } },
        {
          $set: {
            status: IncidentStatusEnum.RESOLVED,
            outcome: byAgent ? IncidentOutcomeEnum.RESOLVED_BY_AGENT : IncidentOutcomeEnum.RESOLVED_BY_BOT,
            resolvedAt: new Date(),
            resolvedBy: byAgent ? String(open.agentId) : "visitor",
            endCause: "closure_resolved",
          },
        },
        { new: true },
      )
      .lean();
    if (updated) await this.afterTerminal(updated);
    return updated;
  }

  // ------------------------------------------------------- auto-learn (R21)

  /**
   * Claim the incident for knowledge generation. Exactly one caller wins, so
   * an incident yields at most one learned entry (R12.1) even when the event
   * is delivered twice. A stale `generating` claim (crash) can be re-taken.
   */
  async claimKnowledge(incidentId: string, staleMs = 30 * 60_000): Promise<any | null> {
    if (!Types.ObjectId.isValid(incidentId)) return null;
    const now = new Date();
    return this.model
      .findOneAndUpdate(
        {
          _id: incidentId,
          status: IncidentStatusEnum.RESOLVED,
          outcome: IncidentOutcomeEnum.RESOLVED_BY_AGENT,
          $or: [
            { knowledge: { $exists: false } },
            { knowledge: null },
            { "knowledge.status": "generating", "knowledge.at": { $lt: new Date(now.getTime() - staleMs) } },
          ],
        },
        { $set: { knowledge: { status: "generating", at: now } } },
        { new: true },
      )
      .lean();
  }

  async recordKnowledge(
    incidentId: string,
    state: { status: "learned" | "merged" | "failed" | "skipped"; questionId?: string; error?: string },
  ): Promise<void> {
    await this.model
      .updateOne(
        { _id: incidentId },
        {
          $set: {
            knowledge: {
              status: state.status,
              at: new Date(),
              ...(state.questionId ? { questionId: state.questionId } : {}),
              ...(state.error ? { error: state.error.slice(0, 300) } : {}),
            },
          },
        },
      )
      .catch((e) => this.logger.warn(`Incident knowledge state failed: ${e?.message}`));
  }

  /** The linked Service_Request was resolved on the dashboard (R1.7). */
  async onTicketResolved(ticket: { ticketId: string; incident?: string }, byUserId?: string) {
    const or: Record<string, any>[] = [];
    if (ticket?.ticketId) {
      // The Service Request id is a CRM cuid now (crm-plugins-service-desk R19.3);
      // incidents written before that hold a Mongo ObjectId.
      or.push({ ticketId: String(ticket.ticketId) });
      if (Types.ObjectId.isValid(ticket.ticketId)) or.push({ ticketId: new Types.ObjectId(String(ticket.ticketId)) });
    }
    if (ticket?.incident && Types.ObjectId.isValid(ticket.incident)) {
      or.push({ _id: new Types.ObjectId(String(ticket.incident)) });
    }
    if (!or.length) return null;
    const updated = await this.model
      .findOneAndUpdate(
        { $or: or, status: { $in: [...OPEN_INCIDENT_STATUSES] } },
        {
          $set: {
            status: IncidentStatusEnum.RESOLVED,
            // A person closed it from the Service Request page.
            outcome: IncidentOutcomeEnum.RESOLVED_BY_AGENT,
            resolvedAt: new Date(),
            resolvedBy: byUserId ? `ticket:${byUserId}` : "ticket",
          },
        },
        { new: true },
      )
      .lean();
    if (updated) await this.afterTerminal(updated);
    return updated;
  }

  /**
   * Drop problem questions nobody answered within 10 minutes (R4.7). The
   * live path also checks expiry on the next message; this clears the
   * persisted marker for visitors who never came back.
   */
  @Interval("incident-problem-expiry", 60_000)
  async expireProblemQuestions(now: Date = new Date()): Promise<number> {
    try {
      const at = now instanceof Date ? now : new Date();
      const Conversation = this.model.db.models["Conversation"];
      if (!Conversation) return 0;
      const res = await Conversation.updateMany(
        { "awaitingProblem.askedAt": { $lte: new Date(at.getTime() - PROBLEM_ANSWER_TTL_MS) } },
        { $unset: { awaitingProblem: "" } },
      );
      return (res as any)?.modifiedCount ?? 0;
    } catch (error) {
      this.logger.warn(`Problem question expiry failed: ${error?.message}`);
      return 0;
    }
  }

  // ------------------------------------------------------------------ read

  async list(user: TenantContext, q: IncidentListQuery = {}) {
    const filter: Record<string, any> = {};
    if (user?.role !== Role.SUPER_ADMIN) {
      if (!user?.organizationId) return { data: [], count: 0 };
      filter.organizationId = String(user.organizationId);
    }
    if (q.status) {
      if (!Object.values(IncidentStatusEnum).includes(q.status as IncidentStatusEnum)) {
        throw new BadRequestException(`Unknown status ${q.status}`);
      }
      filter.status = q.status;
    }
    if (q.bot) filter.botId = String(q.bot);
    const skip = Math.max(0, Number(q.skip) || 0);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const [data, count] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, count };
  }

  /**
   * Everything an agent needs when opening an incident (R9.1, R9.4, R9.6, R9.7):
   * - every chat row of its conversation, read from the server, oldest first
   *   (by `time`, then insertion order), each with a sender role;
   * - the linked contact's Visitor_Profile (null when none / unavailable);
   * - up to 20 earlier incidents of the same contact, newest first, with a
   *   cursor for the next 20. Each earlier item carries its outcome and the
   *   resolution summary, never its transcript (raw chats are not kept, D9).
   * Org-scoped: another org's incident is a 404 (via findOneScoped), and
   * earlier incidents are filtered to the caller's organization.
   */
  /**
   * Context for a conversation the agent opened. Uses its open incident, else
   * its most recent incident, else a history-only view (no incident). The
   * conversation's bot must belong to the caller's org (404 otherwise, R9.7).
   */
  async contextForConversation(
    conversationId: string,
    user: TenantContext,
    opts: { earlierBefore?: string; earlierLimit?: number } = {},
  ) {
    if (!Types.ObjectId.isValid(conversationId)) throw new NotFoundException("Conversation not found");
    const Conversation = this.model.db.models["Conversation"];
    const conv: any = Conversation
      ? await Conversation.findById(conversationId).select("bot visitor crmContactId").lean()
      : null;
    if (!conv) throw new NotFoundException("Conversation not found");
    const botIds = await this.tenantScope.orgBotIds(user);
    if (botIds !== null && !botIds.some((b) => String(b) === String(conv.bot))) {
      throw new NotFoundException("Conversation not found");
    }
    const incident: any =
      (await this.findOpenByConversation(conversationId)) ??
      (await this.model.findOne({ conversationId: String(conversationId) }).sort({ createdAt: -1 }).lean());
    if (incident) return this.context(String(incident._id), user, opts);
    return this.buildContext(
      {
        _id: null,
        conversationId: String(conversationId),
        botId: String(conv.bot),
        visitorId: conv.visitor ? String(conv.visitor) : undefined,
        crmContactId: conv.crmContactId,
        organizationId: await this.tenantScope.orgIdForBot(conv.bot).catch(() => null),
      },
      opts,
    );
  }

  async context(
    id: string,
    user: TenantContext,
    opts: { earlierBefore?: string; earlierLimit?: number } = {},
  ) {
    const incident = await this.findOneScoped(id, user);
    return this.buildContext(incident, opts);
  }

  private async buildContext(incident: any, opts: { earlierBefore?: string; earlierLimit?: number }) {
    const db = this.model.db;
    const Chat = db.models["Chat"];
    const Conversation = db.models["Conversation"];

    const conv: any =
      Conversation && Types.ObjectId.isValid(incident.conversationId)
        ? await Conversation.findById(incident.conversationId).select("bot visitor platform createdAt").lean()
        : null;
    const botId = conv?.bot ? String(conv.bot) : incident.botId;
    const visitorId = conv?.visitor ? String(conv.visitor) : incident.visitorId;

    const rows: any[] = Chat && Types.ObjectId.isValid(incident.conversationId)
      ? await Chat.find({ conversationId: incident.conversationId })
          .sort({ time: 1, createdAt: 1, _id: 1 })
          .limit(CONTEXT_MAX_CHATS)
          .select("message sender type time createdAt direction secured mediaUrl fileName chatId")
          .lean()
      : [];
    const chats = rows.map((c) => ({
      id: String(c._id),
      chatId: c.chatId,
      message: c.secured ? "••••••" : c.message,
      type: c.type,
      time: c.time ?? c.createdAt,
      senderRole: deriveSenderRole(c, { botId, visitorId }) ?? "system",
      mediaUrl: c.mediaUrl,
      fileName: c.fileName,
    }));

    const limit = Math.min(EARLIER_PAGE, Math.max(1, Number(opts.earlierLimit) || EARLIER_PAGE));
    let earlier: any[] = [];
    let earlierHasMore = false;
    if (incident.crmContactId && incident.organizationId) {
      const filter: Record<string, any> = {
        organizationId: incident.organizationId,
        crmContactId: incident.crmContactId,
      };
      if (incident._id) filter._id = { $ne: incident._id };
      if (opts.earlierBefore) {
        const d = new Date(opts.earlierBefore);
        if (!Number.isNaN(d.getTime())) filter.createdAt = { $lt: d };
      }
      const found: any[] = await this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .select("createdAt problem outcome status ticketRef resolutionNote conversationId")
        .lean();
      earlierHasMore = found.length > limit;
      earlier = found.slice(0, limit).map((i) => ({
        id: String(i._id),
        openedAt: i.createdAt,
        problem: i.problem ?? null,
        status: i.status,
        outcome: i.outcome ?? null,
        summary: i.resolutionNote ?? null,
        ticketRef: i.ticketRef ?? null,
        conversationId: i.conversationId,
      }));
    }

    let profile: any = null;
    if (incident.crmContactId && incident.organizationId && this.crm) {
      const c = await this.crm
        .forOrg(String(incident.organizationId))
        .contact.findFirst({
          where: { id: incident.crmContactId, organizationId: String(incident.organizationId), archivedAt: null },
          select: { profile: true },
        })
        .catch(() => null);
      profile = c?.profile ?? null;
    }

    return {
      incident: !incident._id ? null : {
        id: String(incident._id),
        status: incident.status,
        outcome: incident.outcome ?? null,
        problem: incident.problem,
        ticketRef: incident.ticketRef ?? null,
        conversationId: incident.conversationId,
        crmContactId: incident.crmContactId ?? null,
        agentId: incident.agentId ?? null,
      },
      chats,
      chatsTruncated: rows.length >= CONTEXT_MAX_CHATS,
      profile,
      earlier,
      earlierHasMore,
      earlierCursor: earlierHasMore && earlier.length ? new Date(earlier[earlier.length - 1].openedAt).toISOString() : null,
    };
  }

  /** One incident, 404 when missing or in another org. */
  async findOneScoped(id: string, user: TenantContext): Promise<any> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Incident not found");
    const incident: any = await this.model.findById(id).lean();
    if (!incident) throw new NotFoundException("Incident not found");
    assertOwnership(user, incident);
    return incident;
  }

  // ------------------------------------------------------------- internals

  /** Raise an open incident to emergency: flag, CRITICAL ticket, high alert. */
  private async escalate(incident: any, input: OpenForHandoverInput): Promise<void> {
    try {
      const updated = await this.model
        .findOneAndUpdate(
          { _id: incident._id, emergency: { $ne: true } },
          { $set: { emergency: true, reason: AlertReasonEnum.EMERGENCY } },
          { new: true },
        )
        .lean();
      if (!updated) return; // a concurrent trigger escalated it already
      if (incident.ticketId) {
        await this.ticketsService
          .update(String(incident.ticketId), { priority: TicketPriorityEnum.CRITICAL } as any)
          .catch(() => undefined);
      }
      await this.handoverAlertService
        ?.raise({
          conversationId: String(incident.conversationId),
          botId: String(incident.botId),
          visitorId: input.visitorId,
          visitorName: input.visitorName,
          reason: AlertReasonEnum.EMERGENCY,
          mode: input.mode,
        })
        .catch(() => null);
      this.eventEmitter.emit(INCIDENT_UPDATED, this.toEvent(updated));
    } catch (error) {
      this.logger.warn(`Incident escalation failed: ${error?.message}`);
    }
  }

  private async asExisting(incident: any): Promise<OpenForHandoverResult> {
    let current = incident;
    // A concurrent winner may still be creating its ticket; wait briefly so
    // the caller can quote the same ref instead of none.
    for (const ms of this.winnerTicketWaitMs) {
      if (current?.ticketRef) break;
      await sleep(ms);
      current = (await this.model.findById(incident._id).lean()) ?? current;
    }
    return { incident: current, ticketRef: current?.ticketRef, created: false };
  }

  private async afterTerminal(incident: any): Promise<void> {
    await this.setConversationIncidentOpen(incident.conversationId, false);
    const event = this.toEvent(incident);
    this.eventEmitter.emit(INCIDENT_UPDATED, event);
    this.eventEmitter.emit(INCIDENT_CLOSED, event);
  }

  /** Best effort: the incident row is the source of truth, this is a cache. */
  private async setConversationIncidentOpen(conversationId: string, open: boolean) {
    try {
      if (!Types.ObjectId.isValid(conversationId)) return;
      const Conversation = this.model.db.models["Conversation"];
      if (!Conversation) return;
      await Conversation.updateOne({ _id: conversationId }, { $set: { incidentOpen: open } });
    } catch (error) {
      this.logger.warn(`Conversation incidentOpen update failed: ${error?.message}`);
    }
  }

  private toEvent(i: any) {
    return {
      incidentId: String(i._id),
      organizationId: i.organizationId ? String(i.organizationId) : undefined,
      botId: i.botId,
      conversationId: i.conversationId,
      visitorId: i.visitorId,
      crmContactId: i.crmContactId,
      status: i.status,
      outcome: i.outcome,
      agentId: i.agentId,
      ticketId: i.ticketId ? String(i.ticketId) : undefined,
      ticketRef: i.ticketRef,
      endCause: i.endCause,
      resolutionNote: i.resolutionNote,
      at: new Date(),
    };
  }
}
