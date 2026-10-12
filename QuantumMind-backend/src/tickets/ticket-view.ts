/**
 * A Postgres Service Request in the old Mongo ticket shape
 * (crm-plugins-service-desk R19.1, R19.2), so every existing screen and
 * caller keeps working. Pure.
 */
import { STATUS_FOR_CATEGORY, StageCategoryKey } from "src/crm/service-requests/stage-rules";

export interface VisitorLite {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface TicketView {
  _id: string;
  id: string;
  /** The SR_ reference (old field name). */
  ticketId: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  emergency: boolean;
  stage: { id: string; name: string; color?: string | null; category: string } | null;
  bot: { _id: string; name?: string | null } | null;
  visitor: VisitorLite | null;
  agents: { _id: string; name?: string | null }[];
  tags: string[];
  conversationId: string | null;
  incident: string | null;
  crmContactId: string | null;
  contact: { id: string; name: string; email?: string | null; phone?: string | null; isAnonymous?: boolean } | null;
  source: string;
  channel: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  activities?: ActivityView[];
}

export interface ActivityView {
  _id: string;
  message: string;
  status: string;
  date: Date;
}

export function toTicketView(row: any, visitor?: VisitorLite | null): TicketView {
  const category = (row?.stage?.category ?? "OPEN") as StageCategoryKey;
  const c = row?.contact;
  return {
    _id: row.id,
    id: row.id,
    ticketId: row.ref,
    subject: row.subject,
    description: row.description ?? null,
    status: STATUS_FOR_CATEGORY[category] ?? "OPEN",
    priority: row.priority,
    emergency: !!row.emergency,
    stage: row.stage
      ? { id: row.stage.id, name: row.stage.name, color: row.stage.color ?? null, category: row.stage.category }
      : null,
    bot: row.botId ? { _id: row.botId, name: row.botName ?? null } : null,
    visitor: visitor ?? (row.visitorId ? { _id: row.visitorId } : null),
    agents: row.assigneeId ? [{ _id: row.assigneeId, name: row.assigneeName ?? null }] : [],
    tags: row.tags ?? [],
    conversationId: row.conversationId ?? null,
    incident: row.incidentId ?? null,
    crmContactId: row.contactId ?? null,
    contact: c
      ? {
          id: c.id,
          name: [c.firstName, c.lastName].filter(Boolean).join(" "),
          email: c.email ?? null,
          phone: c.phone ?? null,
          isAnonymous: !!c.isAnonymous,
        }
      : null,
    source: row.source,
    channel: row.channel ?? null,
    closedAt: row.closedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** History events as the old activity timeline rows. */
export function toActivities(events: any[]): ActivityView[] {
  return [...events]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((e) => ({ _id: e.id, date: e.createdAt, ...describe(e) }));
}

function describe(e: any): { message: string; status: string } {
  const who = e.actorName ? ` by ${e.actorName}` : "";
  switch (e.type) {
    case "CREATED":
      return { message: "Service Request Created", status: "CREATED" };
    case "ASSIGNED":
      return e.to?.assigneeId
        ? { message: `Assigned to ${e.to?.name ?? "an agent"}${who}`, status: "ASSIGNED" }
        : { message: `Unassigned${who}`, status: "ASSIGNED" };
    case "STAGE_CHANGED": {
      const done = e.to?.category === "DONE";
      return { message: `Moved to ${e.to?.name ?? "another stage"}${who}`, status: done ? "RESOLVED" : "COMMENTED" };
    }
    case "REOPENED":
      return { message: `Reopened${who}`, status: "REOPENED" };
    case "PRIORITY_CHANGED":
      return { message: `Priority changed to ${e.to?.priority}${who}`, status: "COMMENTED" };
    case "COMMENTED":
      return { message: `Note added${who}`, status: "COMMENTED" };
    case "CONTACT_LINKED":
      return { message: e.to?.contactId ? "Contact linked" : "Contact unlinked", status: "COMMENTED" };
    case "SUMMARY_GENERATED":
      return { message: "AI summary updated", status: "COMMENTED" };
    default:
      return { message: `Details edited${who}`, status: "COMMENTED" };
  }
}
