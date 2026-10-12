import { Prisma } from "@prisma/client";

/**
 * Service Request filters (crm-plugins-service-desk R12.2) -> one Prisma
 * where, always pinned to the org (R12.5). Pure.
 */
export interface SrFilters {
  /** "me" | "unassigned" | "any" | user ids. Several values are OR-ed. */
  assignee?: string[];
  stageId?: string[];
  category?: string[];
  priority?: string[];
  emergency?: boolean;
  botId?: string[];
  channel?: string[];
  source?: string[];
  contactId?: string;
  visitorId?: string;
  conversationId?: string;
  tags?: string[];
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  /** Older than this many hours since creation (age filter). */
  olderThanHours?: number;
  q?: string;
}

const CATEGORIES = new Set(["OPEN", "IN_PROGRESS", "ON_HOLD", "DONE"]);
const PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

const date = (v?: string): Date | undefined => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export function buildWhere(orgId: string, f: SrFilters, me?: string, now = new Date()): Prisma.ServiceRequestWhereInput {
  const and: Prisma.ServiceRequestWhereInput[] = [{ organizationId: orgId }];

  const assignee = (f.assignee ?? []).filter(Boolean);
  if (assignee.length && !assignee.includes("any")) {
    const or: Prisma.ServiceRequestWhereInput[] = [];
    const ids = new Set<string>();
    for (const a of assignee) {
      if (a === "unassigned") or.push({ assigneeId: null });
      else if (a === "me") {
        // "me" with no signed-in user matches nothing rather than everything.
        if (me) ids.add(me);
        else or.push({ id: "__nobody__" });
      } else ids.add(a);
    }
    if (ids.size) or.push({ assigneeId: { in: [...ids] } });
    and.push({ OR: or });
  }

  if (f.stageId?.length) and.push({ stageId: { in: f.stageId } });
  const cats = (f.category ?? []).map((c) => String(c).toUpperCase()).filter((c) => CATEGORIES.has(c));
  if (f.category?.length) and.push({ stage: { category: { in: cats as any } } });
  const prios = (f.priority ?? []).map((p) => String(p).toUpperCase()).filter((p) => PRIORITIES.has(p));
  if (f.priority?.length) and.push({ priority: { in: prios as any } });
  if (f.emergency === true) and.push({ emergency: true });
  if (f.botId?.length) and.push({ botId: { in: f.botId } });
  if (f.channel?.length) and.push({ channel: { in: f.channel } });
  if (f.source?.length) and.push({ source: { in: f.source } });
  if (f.contactId) and.push({ contactId: f.contactId });
  if (f.visitorId) and.push({ visitorId: f.visitorId });
  if (f.conversationId) and.push({ conversationId: f.conversationId });
  if (f.tags?.length) and.push({ tags: { hasSome: f.tags } });

  const cf = date(f.createdFrom);
  const ct = date(f.createdTo);
  if (cf || ct) and.push({ createdAt: { ...(cf ? { gte: cf } : {}), ...(ct ? { lte: ct } : {}) } });
  const uf = date(f.updatedFrom);
  const ut = date(f.updatedTo);
  if (uf || ut) and.push({ updatedAt: { ...(uf ? { gte: uf } : {}), ...(ut ? { lte: ut } : {}) } });
  if (typeof f.olderThanHours === "number" && f.olderThanHours > 0) {
    and.push({ createdAt: { lte: new Date(now.getTime() - f.olderThanHours * 3_600_000) } });
  }

  const q = f.q?.trim();
  if (q) {
    const term = { contains: q, mode: "insensitive" as const };
    const digits = q.replace(/\D/g, "");
    and.push({
      OR: [
        { ref: term },
        { subject: term },
        { description: term },
        { contact: { firstName: term } },
        { contact: { lastName: term } },
        { contact: { email: term } },
        { contact: { phone: term } },
        ...(digits.length >= 4 ? [{ contact: { phoneNormalized: { contains: digits } } }] : []),
      ],
    });
  }
  return { AND: and };
}

export const SORTS: Record<string, (dir: "asc" | "desc") => Prisma.ServiceRequestOrderByWithRelationInput[]> = {
  created: (dir) => [{ createdAt: dir }],
  updated: (dir) => [{ updatedAt: dir }],
  priority: (dir) => [{ priority: dir }, { createdAt: "desc" }],
  ref: (dir) => [{ ref: dir }],
  subject: (dir) => [{ subject: dir }],
};
