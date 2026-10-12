/** A Service Request was created / changed (realtime, summary, snapshot listeners). */
export const SR_CHANGED = "crm.service-request.changed";

export type SrChangeKind = "created" | "updated" | "moved" | "assigned" | "commented";

export interface SrChangedEvent {
  orgId: string;
  id: string;
  kind: SrChangeKind;
  /** Stage category after the change. */
  category?: string;
  /** True when this change moved it into a DONE stage. */
  closed?: boolean;
}

/**
 * A request was created for a conversation whose visitor has no CRM contact
 * yet. The CRM bridge finds or creates one from the visitor's stored details
 * and links it (it links every request of the conversation).
 */
export const SR_NEEDS_CONTACT = "crm.service-request.needs-contact";

export interface SrNeedsContactEvent {
  orgId: string;
  id: string;
  conversationId: string;
  visitorId?: string | null;
  botId?: string | null;
}

export const SR_SUBJECT_MAX = 200;
export const SR_DESCRIPTION_MAX = 10_000;
export const SR_COMMENT_MAX = 5_000;
export const SR_TAG_MAX = 40;
export const SR_TAGS_MAX = 20;

export const SR_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type SrPriority = (typeof SR_PRIORITIES)[number];

/** Who acts on a request; `id` undefined = the system (chat). */
export interface SrActor {
  id?: string;
  name?: string;
  role?: string;
}

export const SYSTEM_ACTOR: SrActor = { name: "Chat" };
