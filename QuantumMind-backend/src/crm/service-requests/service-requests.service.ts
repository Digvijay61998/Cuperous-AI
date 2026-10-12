import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma, ServiceRequestEventType, ServiceRequestPriority, StageCategory } from "@prisma/client";
import mongoose, { Connection, Types } from "mongoose";
import { ORG_STAFF, Role } from "src/common/enums/role.enum";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { DATABASE_PROVIDER } from "src/constants";
import { lockKey } from "src/crm-bridge/identity";
import { OnEvent } from "@nestjs/event-emitter";
import { INCIDENT_UPDATED, TICKET_RESOLVED } from "src/incident/constants";
import { IncidentStatusEnum } from "src/incident/enums/incident.enum";
import { generateId } from "src/util";
import { isUniqueViolation } from "../common/prisma-errors";
import { CrmPrismaService } from "../database/crm-prisma.service";
import { needsRenumber, positionBetween, renumber } from "./board-order";
import { buildWhere, SORTS, SrFilters } from "./list-filters";
import {
  SR_CHANGED,
  SR_COMMENT_MAX,
  SR_DESCRIPTION_MAX,
  SR_PRIORITIES,
  SR_SUBJECT_MAX,
  SR_TAG_MAX,
  SR_TAGS_MAX,
  SrActor,
  SrChangedEvent,
  SrChangeKind,
  SrPriority,
  SR_NEEDS_CONTACT,
  SrNeedsContactEvent,
  SYSTEM_ACTOR,
} from "./constants";
import { ServiceRequestStagesService, Stage } from "./service-request-stages.service";
import { firstOfCategory, StageCategoryKey } from "./stage-rules";

const REF_ATTEMPTS = 5;

export const SR_SELECT = {
  id: true,
  ref: true,
  subject: true,
  description: true,
  stageId: true,
  boardPosition: true,
  priority: true,
  emergency: true,
  tags: true,
  contactId: true,
  assigneeId: true,
  assigneeName: true,
  createdById: true,
  source: true,
  channel: true,
  botId: true,
  botName: true,
  conversationId: true,
  visitorId: true,
  incidentId: true,
  summary: true,
  summaryError: true,
  transcriptAt: true,
  stageChangedAt: true,
  firstResponseAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  stage: { select: { id: true, name: true, color: true, category: true, position: true } },
  contact: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, isAnonymous: true, archivedAt: true },
  },
} satisfies Prisma.ServiceRequestSelect;

export type ServiceRequestRow = Prisma.ServiceRequestGetPayload<{ select: typeof SR_SELECT }>;

/** What a board card and a list row need (no summary / transcript). */
export const SR_CARD_SELECT = {
  id: true,
  ref: true,
  subject: true,
  stageId: true,
  boardPosition: true,
  priority: true,
  emergency: true,
  tags: true,
  contactId: true,
  assigneeId: true,
  assigneeName: true,
  source: true,
  channel: true,
  botId: true,
  botName: true,
  conversationId: true,
  visitorId: true,
  incidentId: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  stage: { select: { id: true, name: true, color: true, category: true } },
  contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, isAnonymous: true } },
} satisfies Prisma.ServiceRequestSelect;

const BOARD_PAGE = 50;
const BOARD_PAGE_MAX = 100;
const LIST_PAGE_MAX = 100;

export interface CreateFromChatInput {
  orgId?: string;
  botId: string;
  botName?: string;
  channel?: string;
  conversationId?: string;
  visitorId?: string;
  incidentId?: string;
  contactId?: string;
  subject: string;
  description?: string;
  emergency?: boolean;
  priority?: SrPriority;
  tags?: string[];
}

export interface CreateInput {
  subject: string;
  description?: string;
  priority?: string;
  tags?: string[];
  contactId?: string | null;
  botId?: string | null;
  conversationId?: string | null;
  visitorId?: string | null;
  assigneeId?: string | null;
  emergency?: boolean;
  source?: "dashboard" | "api";
}

export interface UpdateInput {
  subject?: string;
  description?: string | null;
  priority?: string;
  tags?: string[];
  contactId?: string | null;
  emergency?: boolean;
}

export interface MoveInput {
  stageId: string;
  /** Card the moved card goes right below. */
  aboveId?: string | null;
  /** Card the moved card goes right above. */
  belowId?: string | null;
}

/**
 * Service Requests in the CRM Postgres database (crm-plugins-service-desk R9–R14).
 *
 * Every mutation writes its history event in the same transaction (R14.4)
 * and emits {@link SR_CHANGED} after commit (realtime, summary, snapshot).
 * Every query filters by organizationId; another org's id is a 404.
 */
@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    private readonly crm: CrmPrismaService,
    private readonly stages: ServiceRequestStagesService,
    private readonly tenantScope: TenantScopeService,
    private readonly events: EventEmitter2,
    @Optional() @Inject(DATABASE_PROVIDER) private readonly mongo?: typeof mongoose | Connection,
  ) {}

  // ------------------------------------------------------------- create

  /**
   * From the chat: the TICKET node or the handover (R9.2). Default stage,
   * MEDIUM (CRITICAL for an emergency, R9.7). One per incident (R9.5): a
   * second call for the same incident returns the first request. Throws
   * when the bot has no org, so the chat takes its failure path (R9.8).
   */
  async createFromChat(input: CreateFromChatInput): Promise<ServiceRequestRow> {
    const orgId = input.orgId ?? (await this.tenantScope.orgIdForBot(input.botId));
    if (!orgId) throw new BadRequestException("This bot does not belong to an organization.");
    if (input.incidentId) {
      const existing = await this.findByIncident(orgId, input.incidentId);
      if (existing) return existing;
    }
    try {
      return await this.insert(orgId, SYSTEM_ACTOR, {
        subject: cleanSubject(input.subject),
        description: cleanDescription(input.description),
        priority: (input.emergency ? "CRITICAL" : input.priority ?? "MEDIUM") as ServiceRequestPriority,
        emergency: input.emergency === true,
        tags: cleanTags(input.tags),
        contactId:
          (input.contactId ? await this.contactInOrg(orgId, input.contactId, { quiet: true }) : null) ??
          (await this.contactOfConversation(orgId, input.conversationId, input.visitorId)),
        source: "chat",
        channel: input.channel ?? (await this.channelOf(input.conversationId)) ?? "widget",
        botId: String(input.botId),
        botName: input.botName ?? (await this.botName(input.botId)),
        conversationId: input.conversationId ? String(input.conversationId) : null,
        visitorId: input.visitorId ? String(input.visitorId) : null,
        incidentId: input.incidentId ? String(input.incidentId) : null,
      });
    } catch (error) {
      // Lost a race for the same incident: the winner is the request.
      if (input.incidentId && isUniqueViolation(error)) {
        const winner = await this.findByIncident(orgId, input.incidentId);
        if (winner) return winner;
      }
      throw error;
    }
  }

  /** From the dashboard / API (R9.2). The bot, contact and assignee must be the org's. */
  async create(orgId: string, actor: SrActor, input: CreateInput): Promise<ServiceRequestRow> {
    if (input.botId) await this.assertBotInOrg(orgId, input.botId);
    // A request raised from a chat belongs to that chat's contact (the
    // agent's "Create ticket" never sent one, so cards said "Anonymous visitor").
    const contactId = input.contactId
      ? await this.contactInOrg(orgId, input.contactId)
      : await this.contactOfConversation(orgId, input.conversationId, input.visitorId);
    const assignee = input.assigneeId ? await this.assigneeInOrg(orgId, input.assigneeId) : null;
    const row = await this.insert(orgId, actor, {
      subject: cleanSubject(input.subject),
      description: cleanDescription(input.description),
      priority: cleanPriority(input.priority ?? "MEDIUM") as ServiceRequestPriority,
      emergency: input.emergency === true,
      tags: cleanTags(input.tags),
      contactId,
      source: input.source === "api" ? "api" : "dashboard",
      channel: null,
      botId: input.botId ? String(input.botId) : null,
      botName: input.botId ? await this.botName(input.botId) : null,
      conversationId: input.conversationId ? String(input.conversationId) : null,
      visitorId: input.visitorId ? String(input.visitorId) : null,
      incidentId: null,
      createdById: actor.id ?? null,
      assigneeId: assignee?.id ?? null,
      assigneeName: assignee?.name ?? null,
    });
    return row;
  }

  private async insert(
    orgId: string,
    actor: SrActor,
    data: Omit<Prisma.ServiceRequestUncheckedCreateInput, "organizationId" | "ref" | "stageId" | "boardPosition">,
  ): Promise<ServiceRequestRow> {
    const stages = await this.stages.list(orgId);
    const stage = stages.find((s) => s.isDefault) ?? firstOfCategory(stages as any, "OPEN");
    if (!stage) throw new BadRequestException("The board has no stage for new requests.");
    const db = this.crm.forOrg(orgId);
    for (let attempt = 1; ; attempt++) {
      const ref = generateId("SR", 6);
      try {
        const id = await db.$transaction(async (tx) => {
          const top = await tx.serviceRequest.aggregate({
            where: { organizationId: orgId, stageId: stage.id },
            _min: { boardPosition: true },
          });
          const created = await tx.serviceRequest.create({
            data: {
              ...data,
              organizationId: orgId,
              ref,
              stageId: stage.id,
              // New requests go to the top of the column.
              boardPosition: (top._min.boardPosition ?? 1) - 1,
            },
            select: { id: true },
          });
          await this.event(tx, orgId, created.id, ServiceRequestEventType.CREATED, actor, null, {
            stageId: stage.id,
            stage: stage.name,
            source: data.source,
          });
          if (data.assigneeId) {
            await this.event(tx, orgId, created.id, ServiceRequestEventType.ASSIGNED, actor, null, {
              assigneeId: data.assigneeId,
              name: data.assigneeName ?? null,
            });
          }
          return created.id;
        });
        const row = await this.byId(orgId, id);
        this.changed(orgId, id, "created", row.stage.category);
        if (!row.contactId && row.conversationId) {
          const e: SrNeedsContactEvent = {
            orgId,
            id,
            conversationId: row.conversationId,
            visitorId: row.visitorId,
            botId: row.botId,
          };
          this.events.emit(SR_NEEDS_CONTACT, e);
        }
        return row;
      } catch (error) {
        // A ref collision (one in 56^6) is retried; anything else is real.
        const refClash = isUniqueViolation(error) && String((error as any)?.meta?.target ?? "").includes("ref");
        if (refClash && attempt < REF_ATTEMPTS) continue;
        throw error;
      }
    }
  }

  // ------------------------------------------------------------- read

  async byId(orgId: string, id: string): Promise<ServiceRequestRow> {
    const row = await this.crm.forOrg(orgId).serviceRequest.findFirst({
      where: { id: String(id), organizationId: orgId },
      select: SR_SELECT,
    });
    if (!row) throw new NotFoundException("No such service request.");
    return row;
  }

  /** By id or by its SR_ reference, as the old routes accept either. */
  async byIdOrRef(orgId: string, idOrRef: string): Promise<ServiceRequestRow> {
    const v = String(idOrRef ?? "");
    const row = await this.crm.forOrg(orgId).serviceRequest.findFirst({
      where: { organizationId: orgId, OR: [{ id: v }, { ref: v }] },
      select: SR_SELECT,
    });
    if (!row) throw new NotFoundException("No such service request.");
    return row;
  }

  async findByIncident(orgId: string, incidentId: string): Promise<ServiceRequestRow | null> {
    return this.crm.forOrg(orgId).serviceRequest.findFirst({
      where: { organizationId: orgId, incidentId: String(incidentId) },
      select: SR_SELECT,
    });
  }

  /**
   * The board (one column per stage, first `perColumn` cards each, R11.6)
   * or a paged list (R11.5). Every filter runs in the database (R12.5).
   * `column` + `skip` loads more cards of one column.
   */
  async list(
    orgId: string,
    me: string | undefined,
    filters: SrFilters,
    opts: { view?: "board" | "list"; skip?: number; take?: number; sort?: string; dir?: "asc" | "desc"; column?: string } = {},
  ) {
    const db = this.crm.forOrg(orgId);
    const where = buildWhere(orgId, filters, me);
    const skip = Math.max(0, Number(opts.skip) || 0);
    if (opts.view === "board" || opts.column) {
      const take = Math.min(BOARD_PAGE_MAX, Math.max(1, Number(opts.take) || BOARD_PAGE));
      const stages = await this.stages.list(orgId);
      const cols = opts.column ? stages.filter((s) => s.id === opts.column) : stages;
      const columns = await Promise.all(
        cols.map(async (stage) => {
          const w = { AND: [where, { stageId: stage.id }] };
          const [data, count] = await Promise.all([
            db.serviceRequest.findMany({
              where: w,
              orderBy: [{ boardPosition: "asc" }, { createdAt: "desc" }],
              skip: opts.column ? skip : 0,
              take,
              select: SR_CARD_SELECT,
            }),
            db.serviceRequest.count({ where: w }),
          ]);
          return { stage, count, data, hasMore: (opts.column ? skip : 0) + data.length < count };
        }),
      );
      return { view: "board" as const, columns };
    }
    const take = Math.min(LIST_PAGE_MAX, Math.max(1, Number(opts.take) || 25));
    const dir = opts.dir === "asc" ? "asc" : "desc";
    const orderBy = (SORTS[opts.sort ?? "created"] ?? SORTS.created)(dir);
    const [data, count] = await Promise.all([
      db.serviceRequest.findMany({ where, orderBy, skip, take, select: SR_CARD_SELECT }),
      db.serviceRequest.count({ where }),
    ]);
    return { view: "list" as const, data, count };
  }

  /** Org of a request, for internal callers that only hold its id (incident). */
  async orgOf(id: string): Promise<string | null> {
    const row = await this.crm.client.serviceRequest.findFirst({ where: { id: String(id) }, select: { organizationId: true } });
    return row?.organizationId ?? null;
  }

  // ------------------------------------------------------------- update

  async update(orgId: string, actor: SrActor, id: string, input: UpdateInput): Promise<ServiceRequestRow> {
    const db = this.crm.forOrg(orgId);
    const contactId =
      input.contactId === undefined ? undefined : input.contactId ? await this.contactInOrg(orgId, input.contactId) : null;
    await db.$transaction(async (tx) => {
      await this.lockRow(tx, orgId, id);
      const cur = await tx.serviceRequest.findFirst({
        where: { id, organizationId: orgId },
        select: { id: true, subject: true, description: true, priority: true, tags: true, contactId: true, emergency: true },
      });
      if (!cur) throw new NotFoundException("No such service request.");
      const data: Prisma.ServiceRequestUncheckedUpdateInput = {};
      const edited: Record<string, { from: unknown; to: unknown }> = {};
      if (input.subject !== undefined) {
        const v = cleanSubject(input.subject);
        if (v !== cur.subject) (data.subject = v), (edited.subject = { from: cur.subject, to: v });
      }
      if (input.description !== undefined) {
        const v = cleanDescription(input.description);
        if (v !== cur.description) (data.description = v), (edited.description = { from: cur.description, to: v });
      }
      if (input.tags !== undefined) {
        const v = cleanTags(input.tags);
        if (v.join("\u0000") !== cur.tags.join("\u0000")) (data.tags = v), (edited.tags = { from: cur.tags, to: v });
      }
      if (input.emergency !== undefined && input.emergency !== cur.emergency) {
        data.emergency = input.emergency;
        edited.emergency = { from: cur.emergency, to: input.emergency };
      }
      if (Object.keys(edited).length) {
        await this.event(
          tx, orgId, id, ServiceRequestEventType.EDITED, actor,
          Object.fromEntries(Object.entries(edited).map(([k, v]) => [k, v.from])),
          Object.fromEntries(Object.entries(edited).map(([k, v]) => [k, v.to])),
        );
      }
      if (input.priority !== undefined) {
        const v = cleanPriority(input.priority) as ServiceRequestPriority;
        if (v !== cur.priority) {
          data.priority = v;
          await this.event(tx, orgId, id, ServiceRequestEventType.PRIORITY_CHANGED, actor, { priority: cur.priority }, { priority: v });
        }
      }
      if (contactId !== undefined && contactId !== cur.contactId) {
        data.contactId = contactId;
        await this.event(tx, orgId, id, ServiceRequestEventType.CONTACT_LINKED, actor, { contactId: cur.contactId }, { contactId });
      }
      if (Object.keys(data).length) await tx.serviceRequest.update({ where: { id }, data });
    });
    const row = await this.byId(orgId, id);
    this.changed(orgId, id, "updated", row.stage.category);
    return row;
  }

  /**
   * Move a card (R11.4, R10.6, R10.7): stage and position in one write.
   * Into DONE sets closedAt and resolves the linked incident; out of DONE
   * clears it and records a reopen.
   */
  async move(orgId: string, actor: SrActor, id: string, input: MoveInput): Promise<ServiceRequestRow> {
    const target = await this.stages.byId(orgId, input.stageId);
    const db = this.crm.forOrg(orgId);
    let closed = false;
    let incidentId: string | null = null;
    await db.$transaction(async (tx) => {
      // Column lock: two drops into one column never compute the same slot.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey(orgId, `sr-col:${target.id}`)})`;
      await this.lockRow(tx, orgId, id);
      const cur = await tx.serviceRequest.findFirst({
        where: { id, organizationId: orgId },
        select: { id: true, stageId: true, closedAt: true, incidentId: true, stage: { select: { name: true, category: true } } },
      });
      if (!cur) throw new NotFoundException("No such service request.");
      const neighbour = async (nid?: string | null) => {
        if (!nid || nid === id) return null;
        const n = await tx.serviceRequest.findFirst({
          where: { id: nid, organizationId: orgId, stageId: target.id },
          select: { boardPosition: true },
        });
        return n?.boardPosition ?? null;
      };
      let above = await neighbour(input.aboveId);
      let below = await neighbour(input.belowId);
      // The client's view may be stale (a neighbour moved away, or another
      // card landed in between): anchor on one neighbour and take the card
      // really next to it, so the new position never equals another card's
      // (Property 5).
      const others = { organizationId: orgId, stageId: target.id, id: { not: id } };
      if (above !== null) {
        const next = await tx.serviceRequest.aggregate({ where: { ...others, boardPosition: { gt: above } }, _min: { boardPosition: true } });
        below = next._min.boardPosition ?? null;
      } else if (below !== null) {
        const prev = await tx.serviceRequest.aggregate({ where: { ...others, boardPosition: { lt: below } }, _max: { boardPosition: true } });
        above = prev._max.boardPosition ?? null;
      }
      if (above === null && below === null) {
        // No neighbours given: top of the column.
        const top = await tx.serviceRequest.aggregate({
          where: { organizationId: orgId, stageId: target.id, id: { not: id } },
          _min: { boardPosition: true },
        });
        below = top._min.boardPosition ?? null;
      }
      let position = positionBetween(above, below);
      if (needsRenumber(position, above, below)) {
        const column = await tx.serviceRequest.findMany({
          where: { organizationId: orgId, stageId: target.id, id: { not: id } },
          orderBy: [{ boardPosition: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        });
        const ids = column.map((c) => c.id);
        const at = input.aboveId && ids.includes(input.aboveId) ? ids.indexOf(input.aboveId) + 1 : input.belowId && ids.includes(input.belowId) ? ids.indexOf(input.belowId) : 0;
        ids.splice(at, 0, id);
        const numbers = renumber(ids);
        for (const [cid, p] of numbers) if (cid !== id) await tx.serviceRequest.update({ where: { id: cid }, data: { boardPosition: p } });
        position = numbers.get(id)!;
      }
      const stageChanged = cur.stageId !== target.id;
      const wasDone = cur.stage.category === StageCategory.DONE;
      const nowDone = target.category === StageCategory.DONE;
      const data: Prisma.ServiceRequestUncheckedUpdateInput = { boardPosition: position };
      if (stageChanged) {
        data.stageId = target.id;
        data.stageChangedAt = new Date();
        if (nowDone && !wasDone) data.closedAt = new Date();
        if (!nowDone && wasDone) data.closedAt = null;
        await this.event(
          tx, orgId, id, ServiceRequestEventType.STAGE_CHANGED, actor,
          { stageId: cur.stageId, name: cur.stage.name, category: cur.stage.category },
          { stageId: target.id, name: target.name, category: target.category },
        );
        if (wasDone && !nowDone) await this.event(tx, orgId, id, ServiceRequestEventType.REOPENED, actor, null, null);
      }
      await tx.serviceRequest.update({ where: { id }, data });
      closed = stageChanged && nowDone && !wasDone;
      incidentId = cur.incidentId;
    });
    const row = await this.byId(orgId, id);
    if (closed) {
      // The linked incident resolves on this (crm-incident-handover R1.7).
      this.events.emit(TICKET_RESOLVED, { ticketId: id, incident: incidentId ?? undefined, userId: actor.id });
    }
    this.changed(orgId, id, "moved", row.stage.category, closed);
    return row;
  }

  /**
   * Move to the first stage of a category (old status routes, incident
   * accept). No-op when already in that category.
   */
  async moveToCategory(orgId: string, actor: SrActor, id: string, category: StageCategoryKey): Promise<ServiceRequestRow> {
    const row = await this.byId(orgId, id);
    if (row.stage.category === category) return row;
    const stages = await this.stages.list(orgId);
    const target = firstOfCategory(stages as any, category) as Stage | undefined;
    if (!target) throw new BadRequestException(`The board has no ${category.toLowerCase().replace("_", " ")} stage.`);
    return this.move(orgId, actor, id, { stageId: target.id });
  }

  /** Assign, reassign or unassign (R13.2). Anyone in the org may (R13.1). */
  async assign(orgId: string, actor: SrActor, id: string, assigneeId: string | null): Promise<ServiceRequestRow> {
    const assignee = assigneeId ? await this.assigneeInOrg(orgId, assigneeId) : null;
    const db = this.crm.forOrg(orgId);
    let changed = false;
    await db.$transaction(async (tx) => {
      await this.lockRow(tx, orgId, id);
      const cur = await tx.serviceRequest.findFirst({
        where: { id, organizationId: orgId },
        select: { assigneeId: true, assigneeName: true, firstResponseAt: true },
      });
      if (!cur) throw new NotFoundException("No such service request.");
      if ((cur.assigneeId ?? null) === (assignee?.id ?? null)) return;
      await tx.serviceRequest.update({
        where: { id },
        data: {
          assigneeId: assignee?.id ?? null,
          assigneeName: assignee?.name ?? null,
          ...(actor.id && !cur.firstResponseAt ? { firstResponseAt: new Date() } : {}),
        },
      });
      await this.event(
        tx, orgId, id, ServiceRequestEventType.ASSIGNED, actor,
        { assigneeId: cur.assigneeId, name: cur.assigneeName },
        { assigneeId: assignee?.id ?? null, name: assignee?.name ?? null },
      );
      changed = true;
    });
    const row = await this.byId(orgId, id);
    if (changed) this.changed(orgId, id, "assigned", row.stage.category);
    return row;
  }

  @OnEvent(INCIDENT_UPDATED, { async: true })
  async onIncidentUpdated(e: { incidentId?: string; status?: string; agentId?: string }) {
    if (!e?.incidentId || !e.agentId || e.status !== IncidentStatusEnum.AGENT_ACTIVE) return;
    await this.onIncidentAccepted(e.incidentId, e.agentId).catch((error) =>
      this.logger.warn(`Service request update after incident accept failed: ${error?.message}`),
    );
  }

  /**
   * An agent took the incident (R13.4): becomes the assignee when there is
   * none, and an OPEN request moves to the first IN_PROGRESS stage.
   */
  async onIncidentAccepted(incidentId: string, agentId: string): Promise<void> {
    const sr = await this.crm.client.serviceRequest.findFirst({
      where: { incidentId: String(incidentId) },
      select: { id: true, organizationId: true, assigneeId: true, stage: { select: { category: true } } },
    });
    if (!sr) return;
    const actor = await this.actorFor(sr.organizationId, agentId);
    if (!sr.assigneeId) await this.assign(sr.organizationId, actor, sr.id, agentId).catch((e) => this.logger.warn(`Accept assign failed: ${e?.message}`));
    if (sr.stage.category === StageCategory.OPEN) {
      await this.moveToCategory(sr.organizationId, actor, sr.id, "IN_PROGRESS").catch((e) => this.logger.warn(`Accept move failed: ${e?.message}`));
    }
  }

  /**
   * The conversation's contact changed (crm-bridge link or anonymous merge,
   * R9.6): its requests follow unless they hold a different real contact.
   */
  async linkContactForConversation(orgId: string, conversationId: string, contactId: string, replaceableId?: string): Promise<number> {
    const db = this.crm.forOrg(orgId);
    const rows = await db.serviceRequest.findMany({
      where: {
        organizationId: orgId,
        conversationId: String(conversationId),
        OR: [{ contactId: null }, ...(replaceableId ? [{ contactId: replaceableId }] : []), { contact: { isAnonymous: true } }],
      },
      select: { id: true, contactId: true },
    });
    // Filtered here, not with NOT{}: SQL `NOT (x = y)` drops rows where x is NULL.
    for (const r of rows.filter((x) => x.contactId !== contactId)) {
      await db.$transaction(async (tx) => {
        await tx.serviceRequest.update({ where: { id: r.id }, data: { contactId } });
        await this.event(tx, orgId, r.id, ServiceRequestEventType.CONTACT_LINKED, SYSTEM_ACTOR, { contactId: r.contactId }, { contactId });
      });
      this.changed(orgId, r.id, "updated");
    }
    return rows.filter((x) => x.contactId !== contactId).length;
  }

  /** After an anonymous merge every request of the old contact points at the survivor. */
  async repointContact(orgId: string, fromId: string, toId: string): Promise<number> {
    if (!fromId || !toId || fromId === toId) return 0;
    const db = this.crm.forOrg(orgId);
    const rows = await db.serviceRequest.findMany({
      where: { organizationId: orgId, contactId: fromId },
      select: { id: true },
    });
    // One row at a time with its history entry, and a push so open boards
    // drop the merged-away (often anonymous) name (R14.4, R18.2).
    for (const r of rows) {
      await db.$transaction(async (tx) => {
        await tx.serviceRequest.update({ where: { id: r.id }, data: { contactId: toId } });
        await this.event(tx, orgId, r.id, ServiceRequestEventType.CONTACT_LINKED, SYSTEM_ACTOR, { contactId: fromId }, { contactId: toId });
      });
      this.changed(orgId, r.id, "updated");
    }
    return rows.length;
  }

  // ------------------------------------------------------------- comments

  async listComments(orgId: string, id: string) {
    await this.assertExists(orgId, id);
    return this.crm.forOrg(orgId).serviceRequestComment.findMany({
      where: { organizationId: orgId, serviceRequestId: id, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, authorId: true, authorName: true, body: true, editedAt: true, createdAt: true },
    });
  }

  async addComment(orgId: string, actor: SrActor, id: string, body: string) {
    if (!actor.id) throw new ForbiddenException("Sign in to comment.");
    const text = cleanComment(body);
    const db = this.crm.forOrg(orgId);
    const comment = await db.$transaction(async (tx) => {
      const cur = await tx.serviceRequest.findFirst({ where: { id, organizationId: orgId }, select: { firstResponseAt: true } });
      if (!cur) throw new NotFoundException("No such service request.");
      const c = await tx.serviceRequestComment.create({
        data: { organizationId: orgId, serviceRequestId: id, authorId: actor.id!, authorName: actor.name ?? null, body: text },
        select: { id: true, authorId: true, authorName: true, body: true, editedAt: true, createdAt: true },
      });
      // Touch updatedAt so the board's "updated" filter sees the note.
      await tx.serviceRequest.update({
        where: { id },
        data: { updatedAt: new Date(), ...(!cur.firstResponseAt ? { firstResponseAt: new Date() } : {}) },
      });
      await this.event(tx, orgId, id, ServiceRequestEventType.COMMENTED, actor, null, { commentId: c.id });
      return c;
    });
    this.changed(orgId, id, "commented");
    return comment;
  }

  /** Only the author edits (R14.3). */
  async editComment(orgId: string, actor: SrActor, id: string, commentId: string, body: string) {
    const c = await this.comment(orgId, id, commentId);
    if (!actor.id || c.authorId !== actor.id) throw new ForbiddenException("Only the author can edit this note.");
    const updated = await this.crm.forOrg(orgId).serviceRequestComment.update({
      where: { id: commentId },
      data: { body: cleanComment(body), editedAt: new Date() },
      select: { id: true, authorId: true, authorName: true, body: true, editedAt: true, createdAt: true },
    });
    this.changed(orgId, id, "commented");
    return updated;
  }

  /** The author or an admin/manager deletes (R14.3). Soft delete. */
  async deleteComment(orgId: string, actor: SrActor, id: string, commentId: string) {
    const c = await this.comment(orgId, id, commentId);
    const staff = (ORG_STAFF as string[]).includes(String(actor.role)) || actor.role === Role.SUPER_ADMIN;
    if (!actor.id || (c.authorId !== actor.id && !staff)) {
      throw new ForbiddenException("Only the author or an admin can delete this note.");
    }
    await this.crm.forOrg(orgId).serviceRequestComment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
    this.changed(orgId, id, "commented");
    return { id: commentId };
  }

  // ------------------------------------------------------------- history

  async listEvents(orgId: string, id: string, skip = 0, take = 50) {
    await this.assertExists(orgId, id);
    const db = this.crm.forOrg(orgId);
    const where = { organizationId: orgId, serviceRequestId: id };
    const [data, count] = await Promise.all([
      db.serviceRequestEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: Math.max(0, skip),
        take: Math.min(100, Math.max(1, take)),
        select: { id: true, type: true, actorId: true, actorName: true, from: true, to: true, createdAt: true },
      }),
      db.serviceRequestEvent.count({ where }),
    ]);
    return { data, count };
  }

  // ------------------------------------------------------------- people

  /** Active users of the org who may own a request (R13.3). */
  async assignees(orgId: string): Promise<{ id: string; name: string; email?: string; role?: string; avatar?: string }[]> {
    const Agent = this.model("Agent");
    if (!Agent || !Types.ObjectId.isValid(orgId)) return [];
    const rows: any[] = await Agent.find({ organizationId: orgId, active: { $ne: false } })
      .select("name email role profilePic")
      .sort({ name: 1 })
      .limit(500)
      .lean();
    return rows.map((a) => ({
      id: String(a._id),
      name: a.name || a.email || "User",
      email: a.email,
      role: a.role,
      avatar: a.profilePic || undefined,
    }));
  }

  /** Actor with the display name from the user record. */
  async actorFor(orgId: string | null, userId?: string, role?: string): Promise<SrActor> {
    if (!userId) return SYSTEM_ACTOR;
    const Agent = this.model("Agent");
    const a: any =
      Agent && Types.ObjectId.isValid(userId) ? await Agent.findById(userId).select("name email role").lean().catch(() => null) : null;
    return { id: String(userId), name: a?.name || a?.email || undefined, role: role ?? a?.role };
  }

  // ------------------------------------------------------------- internals

  private async event(
    tx: Prisma.TransactionClient,
    orgId: string,
    serviceRequestId: string,
    type: ServiceRequestEventType,
    actor: SrActor,
    from: Record<string, unknown> | null,
    to: Record<string, unknown> | null,
  ) {
    await tx.serviceRequestEvent.create({
      data: {
        organizationId: orgId,
        serviceRequestId,
        type,
        actorId: actor.id ?? null,
        actorName: actor.name ?? null,
        from: (from ?? undefined) as Prisma.InputJsonValue | undefined,
        to: (to ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private lockRow(tx: Prisma.TransactionClient, orgId: string, id: string) {
    return tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey(orgId, `sr:${id}`)})`;
  }

  private changed(orgId: string, id: string, kind: SrChangeKind, category?: string, closed?: boolean) {
    const e: SrChangedEvent = { orgId, id, kind, category, closed };
    this.events.emit(SR_CHANGED, e);
  }

  private async assertExists(orgId: string, id: string) {
    const r = await this.crm.forOrg(orgId).serviceRequest.findFirst({ where: { id, organizationId: orgId }, select: { id: true } });
    if (!r) throw new NotFoundException("No such service request.");
  }

  private async comment(orgId: string, id: string, commentId: string) {
    const c = await this.crm.forOrg(orgId).serviceRequestComment.findFirst({
      where: { id: commentId, organizationId: orgId, serviceRequestId: id, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!c) throw new NotFoundException("No such note.");
    return c;
  }

  private async contactInOrg(orgId: string, contactId: string, opts: { quiet?: boolean } = {}): Promise<string | null> {
    const c = await this.crm.forOrg(orgId).contact.findFirst({
      where: { id: String(contactId), organizationId: orgId, archivedAt: null },
      select: { id: true },
    });
    if (!c) {
      if (opts.quiet) return null;
      throw new BadRequestException("That contact does not exist in your CRM.");
    }
    return c.id;
  }

  private async assigneeInOrg(orgId: string, userId: string): Promise<{ id: string; name: string }> {
    const Agent = this.model("Agent");
    const a: any =
      Agent && Types.ObjectId.isValid(userId) && Types.ObjectId.isValid(orgId)
        ? await Agent.findOne({ _id: userId, organizationId: orgId, active: { $ne: false } }).select("name email").lean()
        : null;
    if (!a) throw new BadRequestException("Choose someone from your organization.");
    return { id: String(a._id), name: a.name || a.email || "User" };
  }

  private async assertBotInOrg(orgId: string, botId: string) {
    const owner = await this.tenantScope.orgIdForBot(botId);
    if (!owner || owner !== orgId) throw new NotFoundException("Bot not found");
  }

  /** The conversation's platform (widget, whatsapp_web, telegram, …). */
  /**
   * The CRM contact a chat already points at: the conversation's link, else
   * the visitor's. Only an active contact of this org. Never throws.
   */
  async contactOfConversation(orgId: string, conversationId?: string | null, visitorId?: string | null): Promise<string | null> {
    try {
      const ids: string[] = [];
      const Conversation = this.model("Conversation");
      if (Conversation && conversationId && Types.ObjectId.isValid(String(conversationId))) {
        const c: any = await Conversation.findById(String(conversationId)).select("crmContactId").lean();
        if (c?.crmContactId) ids.push(String(c.crmContactId));
      }
      const Visitor = this.model("Visitor");
      if (Visitor && visitorId && Types.ObjectId.isValid(String(visitorId))) {
        const v: any = await Visitor.findById(String(visitorId)).select("crmContactId").lean();
        if (v?.crmContactId) ids.push(String(v.crmContactId));
      }
      for (const id of ids) {
        const found = await this.contactInOrg(orgId, id, { quiet: true });
        if (found) return found;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Contact lookup for conversation ${conversationId} failed: ${error?.message}`);
      return null;
    }
  }

  /**
   * A contact's name, email or phone changed: push its cards again so open
   * boards show the new name instead of "Anonymous visitor" (R18.2).
   */
  async touchContact(orgId: string, contactId: string): Promise<number> {
    const rows = await this.crm.forOrg(orgId).serviceRequest.findMany({
      where: { organizationId: orgId, contactId: String(contactId) },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true },
    });
    for (const r of rows) this.changed(orgId, r.id, "updated");
    return rows.length;
  }

  private async channelOf(conversationId?: string): Promise<string | null> {
    const Conversation = this.model("Conversation");
    if (!conversationId || !Conversation || !Types.ObjectId.isValid(conversationId)) return null;
    const c: any = await Conversation.findById(conversationId).select("platform").lean().catch(() => null);
    return c?.platform ?? null;
  }

  private async botName(botId: string): Promise<string | null> {
    const Bot = this.model("Bot");
    if (!Bot || !Types.ObjectId.isValid(botId)) return null;
    const b: any = await Bot.findById(botId).select("name").lean().catch(() => null);
    return b?.name ?? null;
  }

  private model(name: string): mongoose.Model<any> | undefined {
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    return conn?.models?.[name];
  }
}

// --------------------------------------------------------------- validation

export function cleanSubject(v: unknown): string {
  const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  if (!s) throw new BadRequestException("A service request needs a subject.");
  return s.slice(0, SR_SUBJECT_MAX);
}

export function cleanDescription(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, SR_DESCRIPTION_MAX) : null;
}

export function cleanTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const t of v) {
    const s = typeof t === "string" ? t.trim().slice(0, SR_TAG_MAX) : "";
    if (s && !out.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s);
    if (out.length >= SR_TAGS_MAX) break;
  }
  return out;
}

export function cleanPriority(v: unknown): SrPriority {
  const p = String(v ?? "").toUpperCase();
  if (!(SR_PRIORITIES as readonly string[]).includes(p)) {
    throw new BadRequestException(`Priority must be one of ${SR_PRIORITIES.join(", ")}.`);
  }
  return p as SrPriority;
}

export function cleanComment(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new BadRequestException("A note cannot be empty.");
  if (s.length > SR_COMMENT_MAX) throw new BadRequestException(`Notes can have at most ${SR_COMMENT_MAX} characters.`);
  return s;
}
