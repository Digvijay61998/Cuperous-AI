import { ForbiddenException, HttpException, Inject, Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
import { Prisma, StageCategory } from "@prisma/client";
import mongoose, { Connection, Types } from "mongoose";
import moment from "moment";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";
import { Role } from "src/common/enums/role.enum";
import { TenantContext } from "src/common/tenant/tenant-context";
import { DATABASE_PROVIDER } from "src/constants";
import { CrmPrismaService } from "src/crm/database/crm-prisma.service";
import { SrActor, SYSTEM_ACTOR } from "src/crm/service-requests/constants";
import { ServiceRequestsService } from "src/crm/service-requests/service-requests.service";
import { CATEGORY_FOR_STATUS } from "src/crm/service-requests/stage-rules";
import { getDaySubtitle } from "src/util/get-subtitle";
import { ReportParamsDto } from "src/util/report-params.dto";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { SearchParamDto } from "./dto/search-param.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { TicketPriorityEnum } from "./enums/ticket-priority";
import { TicketStatusEnum } from "./enums/ticket-status.enum";
import { toActivities, toTicketView, TicketView, VisitorLite } from "./ticket-view";

const DAY_NAMES = ["", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/**
 * The old `/tickets` API on top of the CRM service desk
 * (crm-plugins-service-desk R19). Service Requests live in Postgres; this
 * keeps every route, caller and response shape (`_id`, `ticketId`,
 * `status`, `agents`, `bot`, `visitor`, `activities`) so the existing
 * screens, incident code and reports work unchanged. Nothing is written to
 * the Mongo Ticket collection any more (D1).
 *
 * Status <-> stage category: OPEN <-> OPEN, PENDING <-> IN_PROGRESS,
 * DEFERRED <-> ON_HOLD, CLOSED <-> DONE. Reports count "closed" as DONE and
 * "open" / "pending" as everything not DONE.
 */
@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly requests: ServiceRequestsService,
    private readonly crm: CrmPrismaService,
    @Optional() @Inject(DATABASE_PROVIDER) private readonly mongo?: typeof mongoose | Connection,
  ) {}

  // ------------------------------------------------------------ writes

  /**
   * With a `user` (HTTP) the bot must be the caller's; incident / CRM links
   * are server-owned and dropped. Without a user (TICKET node, handover) it
   * is a chat request: default stage, one per incident (R9.2, R9.5, R9.7).
   */
  async create(dto: CreateTicketDto, user?: TenantContext): Promise<TicketView> {
    try {
      const d: any = dto || {};
      if (user) {
        const orgId = this.orgOfUser(user);
        const row = await this.requests.create(orgId, await this.actor(orgId, user), {
          subject: d.subject,
          description: d.description,
          priority: d.priority,
          tags: d.tags,
          botId: d.bot ? String(d.bot) : null,
          conversationId: d.conversationId ? String(d.conversationId) : null,
          visitorId: d.visitor ? String(d.visitor) : null,
        });
        return this.view(row);
      }
      const row = await this.requests.createFromChat({
        botId: String(d.bot),
        conversationId: d.conversationId ? String(d.conversationId) : undefined,
        visitorId: d.visitor ? String(d.visitor) : undefined,
        incidentId: d.incident ? String(d.incident) : undefined,
        contactId: d.crmContactId ? String(d.crmContactId) : undefined,
        subject: d.subject,
        description: d.description,
        priority: d.priority,
        emergency: d.priority === TicketPriorityEnum.CRITICAL,
        tags: d.tags,
        channel: d.channel,
      });
      return this.view(row);
    } catch (error) {
      this.logger.error(`Error while creating ticket : ${error.message}`);
      throw toHttp(error);
    }
  }

  async assignTicketToMe(ticketId: string, user: JwtPayload) {
    try {
      const { orgId, id } = await this.locate(ticketId, user as any);
      const row = await this.requests.assign(orgId, await this.actor(orgId, user as any), id, String(user._id));
      return this.view(row);
    } catch (error) {
      this.logger.error(`Error while assigning ticket : ${error.message}`);
      throw toHttp(error);
    }
  }

  /** Into the first DONE stage; resolves the linked incident (R10.6). Idempotent. */
  async markAsResolved(ticketId: string, user: JwtPayload) {
    return this.toCategory(ticketId, user as any, "DONE");
  }

  /** The route the old "Defer" button always called (R19.2). */
  async markAsDeferred(ticketId: string, user: JwtPayload) {
    return this.toCategory(ticketId, user as any, "ON_HOLD");
  }

  /**
   * Edit. `status` moves to the first stage of the matching category. The
   * server-owned links and the bot cannot be rewritten here. Internal
   * callers (incident escalation) pass no user.
   */
  async update(id: string, dto: UpdateTicketDto, user?: TenantContext) {
    try {
      const { orgId, id: srId } = await this.locate(id, user);
      const actor = user ? await this.actor(orgId, user) : SYSTEM_ACTOR;
      const d: any = dto || {};
      let row = await this.requests.update(orgId, actor, srId, {
        subject: d.subject,
        description: d.description,
        priority: d.priority,
        tags: d.tags,
        // Raising to CRITICAL from the incident is an emergency (R19.3).
        ...(d.priority === TicketPriorityEnum.CRITICAL && !user ? { emergency: true } : {}),
      });
      if (d.status) {
        const category = CATEGORY_FOR_STATUS[String(d.status).toUpperCase()];
        if (!category) throw new HttpException(`Unknown status ${d.status}`, 400);
        row = await this.requests.moveToCategory(orgId, actor, srId, category);
      }
      return this.view(row);
    } catch (error) {
      this.logger.error(`Error while updating ticket with id ${id} : ${error.message}`);
      throw toHttp(error);
    }
  }

  /** Old activity API: becomes a note on the request. */
  async addActivity(id: string, activity: CreateActivityDto, user?: TenantContext) {
    try {
      const { orgId, id: srId } = await this.locate(id, user);
      const actor = user ? await this.actor(orgId, user) : SYSTEM_ACTOR;
      const message = String((activity as any)?.message ?? "").trim();
      if (!message) throw new HttpException("An activity needs a message", 400);
      if (!actor.id) return { message, date: new Date() };
      return await this.requests.addComment(orgId, actor, srId, message);
    } catch (error) {
      throw toHttp(error);
    }
  }

  // ------------------------------------------------------------ reads

  async findAll(query: SearchParamDto, user?: TenantContext) {
    try {
      const orgId = this.orgOfUser(user, { optional: true });
      if (!orgId) return { data: [], count: 0 };
      const status = query?.status ? CATEGORY_FOR_STATUS[String(query.status).toUpperCase()] : undefined;
      const tags = query?.tags ? ([] as string[]).concat(query.tags as any).filter(Boolean) : undefined;
      const res: any = await this.requests.list(
        orgId,
        user?._id ? String(user._id) : undefined,
        {
          category: status ? [status] : undefined,
          priority: query?.priority ? [String(query.priority)] : undefined,
          tags,
          botId: query?.bot ? [String(query.bot)] : undefined,
          createdFrom: query?.startDate ? String(query.startDate) : undefined,
          createdTo: query?.startDate ? String(query.endDate || new Date().toISOString()) : undefined,
        },
        { view: "list", skip: Number(query?.skip) || 0, take: Number(query?.limit) || 100, sort: "created", dir: "desc" },
      );
      const visitors = await this.visitors(res.data.map((r: any) => r.visitorId));
      return { data: res.data.map((r: any) => toTicketView(r, visitors.get(r.visitorId))), count: res.count };
    } catch (error) {
      this.logger.error(`Error while getting all tickets : ${error.message}`);
      throw toHttp(error);
    }
  }

  /** By id or SR_ reference, with the history as `activities`. */
  async findOne(id: string, user?: TenantContext) {
    try {
      const { orgId } = await this.locate(id, user);
      const row = await this.requests.byIdOrRef(orgId, id);
      const events = await this.requests.listEvents(orgId, row.id, 0, 100);
      return { ...(await this.view(row)), activities: toActivities(events.data) };
    } catch (error) {
      this.logger.error(`Error while getting ticket with id ${id} : ${error.message}`);
      throw toHttp(error);
    }
  }

  /**
   * Old-shape requests for the agent and visitor pages (R19.1), newest
   * first. `orgId` null = any org (the agent / visitor id already scopes it).
   */
  async listFor(by: { assigneeId?: string; visitorId?: string }, orgId?: string | null, take = 100): Promise<TicketView[]> {
    if (!by.assigneeId && !by.visitorId) return [];
    const where: Prisma.ServiceRequestWhereInput = {
      ...(orgId ? { organizationId: orgId } : {}),
      ...(by.assigneeId ? { assigneeId: String(by.assigneeId) } : {}),
      ...(by.visitorId ? { visitorId: String(by.visitorId) } : {}),
    };
    const db = orgId ? this.crm.forOrg(orgId) : this.crm.client;
    const rows = await db.serviceRequest
      .findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(500, Math.max(1, take)),
        include: { stage: { select: { id: true, name: true, color: true, category: true } } },
      })
      .catch((e) => {
        this.logger.warn(`Service requests for ${JSON.stringify(by)} failed: ${e?.message}`);
        return [] as any[];
      });
    return rows.map((r) => toTicketView(r));
  }

  /** How many requests an agent owns (the agent page's "requests handled"). */
  countForAssignee(assigneeId: string, orgId?: string | null): Promise<number> {
    const db = orgId ? this.crm.forOrg(orgId) : this.crm.client;
    return db.serviceRequest
      .count({ where: { assigneeId: String(assigneeId), ...(orgId ? { organizationId: orgId } : {}) } })
      .catch(() => 0);
  }

  // ------------------------------------------------------------ stats

  /** Dashboard cards. `user` null/undefined = every org (internal / SUPER_ADMIN). */
  async getTotalCount(days = 7, user?: TenantContext | null) {
    const total = await this.count(user);
    const recent = total ? await this.count(user, { createdAt: { gte: daysAgo(60) } }) : 0;
    return card("Total", total, total ? Math.round((recent / total) * 100) : 0, days);
  }

  async closedTickets(days = 7, user?: TenantContext | null) {
    const done = { stage: { category: StageCategory.DONE } };
    const total = await this.count(user, done);
    const recent = total ? await this.count(user, { ...done, closedAt: { gte: daysAgo(days) } }) : 0;
    return card("Closed", total, total ? Math.round((recent / total) * 100) : 0, days);
  }

  async openTickets(days = 7, user?: TenantContext | null) {
    const open = { stage: { category: { not: StageCategory.DONE } } };
    const total = await this.count(user, open);
    const recent = total ? await this.count(user, { ...open, createdAt: { gte: daysAgo(days) } }) : 0;
    return card("Open", total, total ? Math.round((recent / total) * 100) : 0, days);
  }

  async CriticalTickets(days = 7, user?: TenantContext | null) {
    const critical = { priority: "CRITICAL" as const };
    const total = await this.count(user, critical);
    const recent = total ? await this.count(user, { ...critical, createdAt: { gte: daysAgo(days) } }) : 0;
    return card("Critical", total, total ? Math.round((recent / total) * 100) : 0, days);
  }

  async ticketStats(days = 7, user?: TenantContext) {
    return Promise.all([
      this.getTotalCount(days, user),
      this.closedTickets(days, user),
      this.openTickets(days, user),
      this.CriticalTickets(days, user),
    ]);
  }

  async getTotalTicketsReport(user?: TenantContext) {
    const [total, closed] = await Promise.all([
      this.count(user),
      this.count(user, { stage: { category: StageCategory.DONE } }),
    ]);
    return { total, closed, open: total - closed };
  }

  async dayWisePerformance(query: ReportParamsDto, user?: TenantContext) {
    try {
      const rows = await this.grouped(
        Prisma.sql`EXTRACT(ISODOW FROM sr."createdAt")::int`,
        query,
        user,
      );
      return rows.map((r) => ({ day: DAY_NAMES[Number(r.k)] ?? String(r.k), total: r.total, open: r.total - r.closed, closed: r.closed }));
    } catch (error) {
      this.logger.error(`Error while getting day wise performance : ${error.message}`);
      throw toHttp(error);
    }
  }

  async dateWisePerformance(query: ReportParamsDto, user?: TenantContext) {
    try {
      const rows = await this.grouped(Prisma.sql`to_char(sr."createdAt", 'YYYY-MM-DD')`, query, user);
      return rows.map((r) => ({ date: String(r.k), total: r.total, open: r.total - r.closed, closed: r.closed }));
    } catch (error) {
      this.logger.error(`Error while getting date wise performance : ${error.message}`);
      throw toHttp(error);
    }
  }

  async homeTicketCount(filter: any, status?: string, user?: TenantContext) {
    if (!["day", "week", "month", "year"].includes(filter)) filter = "day";
    try {
      const pending = status === TicketStatusEnum.OPEN;
      const extra: Prisma.ServiceRequestWhereInput = pending ? { stage: { category: { not: StageCategory.DONE } } } : {};
      const from = new Date(moment().startOf(filter).toISOString());
      const prevFrom = new Date(moment().subtract(1, filter).startOf(filter).toISOString());
      const [total, previousTotal] = await Promise.all([
        this.count(user, { ...extra, createdAt: { gte: from } }),
        this.count(user, { ...extra, createdAt: { gte: prevFrom, lt: from } }),
      ]);
      const change = previousTotal ? Math.round(((total - previousTotal) / previousTotal) * 100) : 0;
      return {
        stats: total,
        trendNumber: Math.abs(change),
        trend: change > 0 ? "positive" : "negative",
        title: pending ? "Pending Tickets" : "Total Tickets",
        type: "service_request",
      };
    } catch (error) {
      this.logger.error(`Error while getting home count ${error}`);
      throw toHttp(error);
    }
  }

  // ------------------------------------------------------------ internals

  private async toCategory(ticketId: string, user: TenantContext, category: "DONE" | "ON_HOLD") {
    try {
      const { orgId, id } = await this.locate(ticketId, user);
      const row = await this.requests.moveToCategory(orgId, await this.actor(orgId, user), id, category);
      return this.view(row);
    } catch (error) {
      this.logger.error(`Error while moving ticket ${ticketId} to ${category}: ${error.message}`);
      throw toHttp(error);
    }
  }

  /**
   * The org and id of a request. A user's org must own it (another org's id
   * is a 404); an internal caller or SUPER_ADMIN resolves the org from it.
   */
  private async locate(idOrRef: string, user?: TenantContext): Promise<{ orgId: string; id: string }> {
    const userOrg = this.orgOfUser(user, { optional: true });
    if (userOrg) {
      const row = await this.requests.byIdOrRef(userOrg, idOrRef);
      return { orgId: userOrg, id: row.id };
    }
    if (user && user.role !== Role.SUPER_ADMIN) throw new NotFoundException("No Ticket found by this id");
    const hit = await this.crm.client.serviceRequest.findFirst({
      where: { OR: [{ id: String(idOrRef) }, { ref: String(idOrRef) }] },
      select: { id: true, organizationId: true },
    });
    if (!hit) throw new NotFoundException("No Ticket found by this id");
    return { orgId: hit.organizationId, id: hit.id };
  }

  private orgOfUser(user?: TenantContext, opts: { optional?: boolean } = {}): string | null {
    const org = user?.organizationId ? String(user.organizationId) : null;
    if (!org && !opts.optional) {
      throw new ForbiddenException("Act inside an organization to manage its service requests.");
    }
    return org;
  }

  private actor(orgId: string, user: TenantContext): Promise<SrActor> {
    return this.requests.actorFor(orgId, user?._id ? String(user._id) : undefined, user?.role);
  }

  private async view(row: any): Promise<TicketView> {
    const v = row?.visitorId ? (await this.visitors([row.visitorId])).get(row.visitorId) : undefined;
    return toTicketView(row, v);
  }

  /** Visitor name / email / phone from Mongo, for the old `visitor` field. */
  private async visitors(ids: (string | null | undefined)[]): Promise<Map<string, VisitorLite>> {
    const out = new Map<string, VisitorLite>();
    const valid = [...new Set(ids.filter((i): i is string => !!i && Types.ObjectId.isValid(i)))];
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    const Visitor = conn?.models?.["Visitor"];
    if (!valid.length || !Visitor) return out;
    const rows: any[] = await Visitor.find({ _id: { $in: valid } }).select("name email phone").lean().catch(() => []);
    for (const v of rows) out.set(String(v._id), { _id: String(v._id), name: v.name, email: v.email, phone: v.phone });
    return out;
  }

  /** Org filter for stats; none for internal callers and a SUPER_ADMIN without org. */
  private scope(user?: TenantContext | null): Prisma.ServiceRequestWhereInput {
    if (!user) return {};
    if (user.organizationId) return { organizationId: String(user.organizationId) };
    return user.role === Role.SUPER_ADMIN ? {} : { organizationId: "__none__" };
  }

  private count(user: TenantContext | null | undefined, where: Prisma.ServiceRequestWhereInput = {}) {
    const scope = this.scope(user);
    const db = scope.organizationId ? this.crm.forOrg(String(scope.organizationId)) : this.crm.client;
    return db.serviceRequest.count({ where: { ...scope, ...where } });
  }

  private async grouped(
    key: Prisma.Sql,
    query: ReportParamsDto,
    user?: TenantContext,
  ): Promise<{ k: any; total: number; closed: number }[]> {
    const scope = this.scope(user);
    const conds: Prisma.Sql[] = [Prisma.sql`TRUE`];
    if (scope.organizationId) conds.push(Prisma.sql`sr."organizationId" = ${String(scope.organizationId)}`);
    if (query?.id) conds.push(Prisma.sql`sr."botId" = ${String(query.id)}`);
    if (query?.startDate) {
      const end = query.endDate ? new Date(query.endDate) : new Date();
      conds.push(Prisma.sql`sr."createdAt" >= ${new Date(query.startDate)} AND sr."createdAt" <= ${end}`);
    }
    const db = scope.organizationId ? this.crm.forOrg(String(scope.organizationId)) : this.crm.client;
    const rows = await db.$queryRaw<{ k: any; total: number; closed: number }[]>`
      SELECT ${key} AS k,
             count(*)::int AS total,
             (count(*) FILTER (WHERE st.category = 'DONE'))::int AS closed
      FROM "serviceRequest" sr
      JOIN "serviceRequestStage" st ON st.id = sr."stageId"
      WHERE ${Prisma.join(conds, " AND ")}
      GROUP BY 1
      ORDER BY 1`;
    return rows.map((r) => ({ k: r.k, total: Number(r.total), closed: Number(r.closed) }));
  }
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

function card(title: string, total: number, change: number, days: number) {
  return {
    stats: total,
    trendNumber: change,
    trend: change >= 0 ? "positive" : "negative",
    title,
    subtitle: getDaySubtitle(days),
    type: "ticket",
  };
}

function toHttp(error: any): HttpException {
  if (error instanceof HttpException) return error;
  return new HttpException(error?.message ?? "Service request error", error?.status || 500);
}
