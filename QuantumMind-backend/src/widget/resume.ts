/**
 * Widget resume decision (crm-incident-handover R9.3, R9.11). Pure, so the
 * edge cases are unit-tested without Mongo.
 */

export interface ResumeRequest {
  visitorId?: unknown;
  conversationId?: unknown;
  /** The visitor chose "Start new chat": never resume (R14). */
  newConversation?: unknown;
}

export interface ResumeFacts {
  /** The stored visitor exists and belongs to this bot. */
  visitor: { id: string; botId: string } | null;
  /** The visitor's conversation named in the request (or latest for the bot). */
  conversation: {
    id: string;
    botId: string;
    visitorId: string;
    status: string;
    /** Ended_State: closed by the closure prompt / CLOSE_CHAT (R14). */
    ended?: boolean;
  } | null;
  botId: string;
}

export type ResumeDecision =
  | { kind: "resume"; visitorId: string; conversationId: string }
  /** Same visitor, fresh conversation (earlier ones untouched, R9.11). */
  | { kind: "new_conversation"; visitorId: string; reason: string }
  /** No usable visitor: normal first-visit flow. */
  | { kind: "new_visitor"; reason: string }
  /**
   * The stored conversation was closed (Ended_State, R14.7): the widget shows
   * the Ended_State; nothing is created until "Start new chat" (R14.9).
   */
  | { kind: "ended"; visitorId: string; conversationId: string };

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const isId = (v: unknown): v is string => typeof v === "string" && OBJECT_ID.test(v);

/** Validate the client's resume hint; anything malformed is ignored. */
export function parseResumeRequest(body: any): { visitorId?: string; conversationId?: string; newConversation: boolean } {
  const r = (body?.resume ?? {}) as ResumeRequest;
  return {
    visitorId: isId(r.visitorId) ? r.visitorId : undefined,
    conversationId: isId(r.conversationId) ? r.conversationId : undefined,
    newConversation: body?.newConversation === true || r.newConversation === true,
  };
}

/**
 * Resume only when the stored visitor belongs to this bot AND the named
 * conversation is that visitor's, on this bot, IN_PROGRESS and not ended.
 * Every other case starts fresh; a known visitor keeps their Visitor_Record.
 */
export function decideResume(
  req: { visitorId?: string; conversationId?: string; newConversation: boolean },
  facts: ResumeFacts,
): ResumeDecision {
  if (!req.visitorId) return { kind: "new_visitor", reason: "no_stored_visitor" };
  const v = facts.visitor;
  if (!v || v.id !== req.visitorId || v.botId !== facts.botId) {
    return { kind: "new_visitor", reason: "visitor_not_found_for_bot" };
  }
  if (req.newConversation) return { kind: "new_conversation", visitorId: v.id, reason: "requested" };
  const c = facts.conversation;
  if (!c) return { kind: "new_conversation", visitorId: v.id, reason: "no_conversation" };
  if (c.visitorId !== v.id || c.botId !== facts.botId) {
    return { kind: "new_conversation", visitorId: v.id, reason: "conversation_not_visitors" };
  }
  if (c.ended) return { kind: "ended", visitorId: v.id, conversationId: c.id };
  if (c.status !== "in_progress") return { kind: "new_conversation", visitorId: v.id, reason: `status_${c.status}` };
  return { kind: "resume", visitorId: v.id, conversationId: c.id };
}
