import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import mongoose, { Connection, Types } from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";
import { RedisPropagatorService } from "src/redis-propagate/redis-propagate.service";
import { CrmPrismaService } from "../database/crm-prisma.service";
import { SR_CHANGED, SrChangedEvent } from "./constants";
import { SR_CARD_SELECT } from "./service-requests.service";

/** Socket event the dashboard listens to. */
export const SR_SOCKET_EVENT = "crm:service-request";
/** At most one push per request in this window (a drag fires several writes). */
export const SR_THROTTLE_MS = 300;
const RECIPIENTS_TTL_MS = 30_000;

/**
 * Live board (crm-plugins-service-desk R18). Pushes the changed card to every
 * active user of the org, on every server instance, through the Redis
 * propagator (socket.io rooms are process-local here, see InboxEventsService).
 * `platform` is omitted on purpose so it takes the socket branch.
 *
 * Only the org's own users receive it (Property 7). Best effort: a failure
 * means "refresh to see it", never a failed write.
 */
@Injectable()
export class ServiceRequestEventsService {
  private readonly logger = new Logger(ServiceRequestEventsService.name);
  private readonly pending = new Map<string, { e: SrChangedEvent; timer: NodeJS.Timeout }>();
  private readonly recipients = new Map<string, { ids: string[]; at: number }>();
  throttleMs = SR_THROTTLE_MS;

  constructor(
    private readonly crm: CrmPrismaService,
    @Optional() private readonly propagator?: RedisPropagatorService,
    @Optional() @Inject(DATABASE_PROVIDER) private readonly mongo?: typeof mongoose | Connection,
  ) {}

  @OnEvent(SR_CHANGED)
  onChanged(e: SrChangedEvent) {
    if (!this.propagator || !e?.orgId || !e?.id) return;
    const key = `${e.orgId}:${e.id}`;
    const prev = this.pending.get(key);
    if (prev) {
      // Keep the strongest kind ("created" wins) and the latest flags.
      prev.e = { ...e, kind: prev.e.kind === "created" ? "created" : e.kind, closed: prev.e.closed || e.closed };
      return;
    }
    const timer = setTimeout(() => {
      const p = this.pending.get(key);
      this.pending.delete(key);
      if (p) void this.push(p.e);
    }, this.throttleMs);
    (timer as any).unref?.();
    this.pending.set(key, { e, timer });
  }

  async push(e: SrChangedEvent): Promise<void> {
    try {
      const card = await this.crm.forOrg(e.orgId).serviceRequest.findFirst({
        where: { id: e.id, organizationId: e.orgId },
        select: SR_CARD_SELECT,
      });
      const ids = await this.orgUserIds(e.orgId);
      const data = { kind: card ? e.kind : "deleted", id: e.id, stageId: card?.stageId ?? null, data: card ?? null };
      for (const userId of ids) {
        this.propagator!.propagateEvent({ userId, event: SR_SOCKET_EVENT, data });
      }
    } catch (error) {
      this.logger.warn(`Service request push ${e.id} failed: ${error?.message}`);
    }
  }

  /** Active dashboard users of the org (cached briefly). */
  async orgUserIds(orgId: string): Promise<string[]> {
    const hit = this.recipients.get(orgId);
    if (hit && Date.now() - hit.at < RECIPIENTS_TTL_MS) return hit.ids;
    const conn: any = (this.mongo as any)?.connection ?? this.mongo;
    const Agent = conn?.models?.["Agent"];
    if (!Agent || !Types.ObjectId.isValid(orgId)) return [];
    const rows: any[] = await Agent.find({ organizationId: orgId, active: { $ne: false } }).select("_id").lean();
    const ids = rows.map((r) => String(r._id));
    this.recipients.set(orgId, { ids, at: Date.now() });
    return ids;
  }
}
