export const INCIDENT_PROVIDER = "INCIDENT_PROVIDER";

/** Internal events (EventEmitter2). */
export const INCIDENT_OPENED = "incident.opened";
export const INCIDENT_UPDATED = "incident.updated";
export const INCIDENT_CLOSED = "incident.closed";
export const TICKET_RESOLVED = "ticket.resolved";
/**
 * An agent accepts a waiting chat as a live chat (Live Chat tab). Handled by
 * the message handler, which owns the visitor's live state; emitted with
 * emitAsync so the caller gets "connected" | "taken" | "offline".
 */
export const AGENT_ACCEPT_LIVE = "incident.accept.live";
/** A widget chat became a live chat of `agentId`; the inbox marks its thread owned. */
export const LIVE_CHAT_CONNECTED = "inbox.live.connected";

/** Problem description length rules (R4.2, R4.4, R4.6). */
export const PROBLEM_MIN_LENGTH = 10;
export const PROBLEM_MAX_LENGTH = 1000;
export const NO_PROBLEM_TEXT = "No problem description provided";

/** Resolution note length rules (R10.1, R10.6). */
export const RESOLUTION_NOTE_MIN = 10;
export const RESOLUTION_NOTE_MAX = 2000;

/** Product-neutral default subject for incident tickets (D10: no customer wording). */
export const DEFAULT_INCIDENT_SUBJECT = "Request for a specialist from chat";

/**
 * Why a conversation ended, carried on `conversation.ended`. `agent_release`
 * is the agent handing the chat back to the bot: the incident stays open (R10.2).
 */
export type ConversationEndCause =
  | "close_chat"
  | "expired"
  | "disconnect"
  | "agent_release"
  | "ended"
  /** Visitor chose "Yes, resolved" (R14.2); the incident was resolved first (R10.3). */
  | "closure_resolved"
  /** No answer to the Closure_Prompt (R14.5); an open incident stays open. */
  | "idle";
