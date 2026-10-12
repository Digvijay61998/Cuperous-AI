// Widget session continuity (crm-incident-handover R9.3, R9.11).
// Pure helpers over a Storage-like object so they are testable without a DOM.

export interface StoredSession {
  visitorId: string;
  conversationId?: string;
  /** The visitor ended the chat (Ended_State, R14): never resume it. */
  ended?: boolean;
  savedAt: number;
}

export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** A stored session older than this is not resumed (the conversation has expired server-side anyway). */
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const sessionKey = (botId: string) => `jarcube.session.${botId}`;

/** Read the session for a bot; anything malformed or stale is ignored. */
export function readSession(store: KV | null | undefined, botId: string, now = Date.now()): StoredSession | null {
  if (!store || !botId) return null;
  let raw: string | null = null;
  try {
    raw = store.getItem(sessionKey(botId));
  } catch {
    return null; // storage disabled (private mode, sandboxed iframe)
  }
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object" || !OBJECT_ID.test(String(s.visitorId))) return null;
    if (typeof s.savedAt === "number" && now - s.savedAt > SESSION_MAX_AGE_MS) return null;
    return {
      visitorId: String(s.visitorId),
      conversationId: OBJECT_ID.test(String(s.conversationId)) ? String(s.conversationId) : undefined,
      ended: s.ended === true,
      savedAt: typeof s.savedAt === "number" ? s.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function writeSession(store: KV | null | undefined, botId: string, s: Omit<StoredSession, "savedAt">, now = Date.now()) {
  if (!store || !botId || !OBJECT_ID.test(String(s.visitorId))) return;
  try {
    store.setItem(sessionKey(botId), JSON.stringify({ ...s, savedAt: now }));
  } catch {
    /* quota or disabled storage: resume just won't happen */
  }
}

/** Mark the conversation ended (R14) but keep the visitor id for the next chat. */
export function markSessionEnded(store: KV | null | undefined, botId: string, now = Date.now()) {
  const s = readSession(store, botId, now);
  if (s) writeSession(store, botId, { visitorId: s.visitorId, conversationId: s.conversationId, ended: true }, now);
}

/**
 * R14.7: on reload, a stored ended conversation shows the Ended_State with
 * no request and no socket. "Start new chat" (startNew) always asks.
 */
export function showEndedWithoutConnecting(s: StoredSession | null, opts: { startNew?: boolean } = {}): boolean {
  return !!s && s.ended === true && !opts.startNew;
}
/**
 * A `conversation-ended` event applies to the conversation this widget is
 * showing. One naming another conversation (a late event for an older chat)
 * is ignored; one without an id applies.
 */
export function endedEventApplies(s: StoredSession | null, eventConversationId?: unknown): boolean {
  if (typeof eventConversationId !== "string" || !eventConversationId) return true;
  if (!s?.conversationId) return true;
  return s.conversationId === eventConversationId;
}
/**
 * The `resume` / `newConversation` fields for POST /widget/visitor. An
 * ended conversation, or "Start new chat", asks for a new conversation for
 * the same visitor; otherwise it asks to resume both.
 */
export function resumeRequest(
  s: StoredSession | null,
  opts: { startNew?: boolean } = {},
): { resume?: { visitorId: string; conversationId?: string }; newConversation?: boolean } {
  if (!s) return {};
  if (opts.startNew || s.ended) return { resume: { visitorId: s.visitorId }, newConversation: true };
  return { resume: { visitorId: s.visitorId, conversationId: s.conversationId } };
}
