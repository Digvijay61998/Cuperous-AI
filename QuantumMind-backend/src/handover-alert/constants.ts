export const HANDOVER_ALERT_PROVIDER = "HANDOVER_ALERT_PROVIDER";

/** Socket events. Kept beside the inbox ones on the same `/socket.io/jarcube` connection. */
export const HANDOVER_REQUESTED_EVENT = "inbox:handover-requested";
export const HANDOVER_ACKNOWLEDGED_EVENT = "inbox:handover-acknowledged";
export const HANDOVER_PENDING_EVENT = "inbox:handover-pending";

/** Internal (EventEmitter2) events this module listens for. */
export const CONVERSATION_ENDED = "conversation.ended";
export const AGENT_ONLINE = "agent.online";
export const INBOX_THREAD_ACKNOWLEDGED = "inbox.thread.acknowledged";

export const MAX_HANDOVER_REASON_LENGTH = 200;
export const ANONYMOUS_VISITOR_NAME = "Anonymous visitor";

/** Persistence retry schedule (ms) for a failed insert: at most 3 retries within 10s. */
export const PERSIST_RETRY_DELAYS_MS = [1000, 3000, 6000];
