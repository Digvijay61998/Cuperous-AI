/**
 * Channel-agnostic inbox → channel-hub events.
 *
 * The inbox module must not import a concrete engine (baileys today, Telegraf
 * tomorrow) or it stops being channel-agnostic and creates a circular module
 * graph. It publishes intent on EventEmitter2 instead — the same decoupling the
 * WhatsApp Web hub already uses for `send-whatsapp-web-message`.
 *
 * Both are fire-and-forget by nature:
 *  - a read receipt has no meaningful failure the agent can act on;
 *  - a history page is delivered asynchronously by the channel anyway (baileys
 *    answers `fetchMessageHistory` later, via `messaging-history.set`), so the
 *    HTTP call can only ever report "requested", never "here it is".
 */
export const INBOX_MARK_READ_EVENT = 'inbox.channel.mark-read';
export const INBOX_REQUEST_HISTORY_EVENT = 'inbox.channel.request-history';

/**
 * inbox -> channel hub: deliver an agent reply, and tell me what happened.
 *
 * Unlike the two events above this one is NOT fire-and-forget, because an agent
 * must never be told a reply was sent when it was not. EventEmitter2's `emitAsync`
 * returns each listener's resolved value, which is what lets the inbox await a
 * real delivery outcome without importing the engine — the decoupling the module
 * boundary depends on is preserved, the fire-and-forget semantics are not.
 *
 * Every hub listens, and each returns `null` for a channel it does not own, so
 * exactly one meaningful result comes back per reply.
 */
export const INBOX_SEND_MESSAGE_EVENT = 'inbox.channel.send-message';

/** Payload for {@link INBOX_SEND_MESSAGE_EVENT}. */
export interface InboxSendMessageEvent {
  channel: string;
  sessionName: string;
  chatId: string;
  threadId: string;
  /** Correlation id the stored row carries, used to bind the channel's own id. */
  correlationId: string;
  type: string;
  message?: string;
  mediaUrl?: string;
  mimetype?: string;
  fileName?: string;
  quotedMessageId?: string;
}

/**
 * The outcome of a delivery attempt.
 *
 * `reason` is a stable machine-readable token, never prose: the HTTP layer maps it
 * to a status code, and classifying on human-readable text would break the moment
 * a library reworded an error.
 */
export interface InboxSendResult {
  /** True only when the channel accepted the message. */
  accepted: boolean;
  /** The channel-native message id, present when accepted. */
  externalMessageId?: string;
  /** The channel's own timestamp for the message, when it reported one. */
  timestamp?: Date;
  reason?: InboxSendFailureReason;
  /** Operator-facing detail for the log; never used for classification. */
  detail?: string;
}

export type InboxSendFailureReason =
  | 'session_not_connected'
  | 'no_reply_target'
  | 'invalid_send_request'
  | 'channel_send_failed'
  | 'channel_send_timeout'
  | 'rate_limited'
  | 'unsupported_media';

/** Payload for {@link INBOX_MARK_READ_EVENT}. */
export interface InboxMarkReadEvent {
  channel: string;
  sessionName: string;
  chatId: string;
  /** Channel-native message ids to acknowledge. Empty means nothing to do. */
  externalMessageIds: string[];
}

/** Payload for {@link INBOX_REQUEST_HISTORY_EVENT}. */
export interface InboxRequestHistoryEvent {
  channel: string;
  sessionName: string;
  chatId: string;
  threadId: string;
  /** The oldest message we already hold — the cursor to page backwards from. */
  oldest: {
    externalMessageId: string;
    time: Date;
    fromMe: boolean;
  };
  count: number;
}

/**
 * inbox -> channel hub: "is this channel actually usable right now, and if not,
 * why?"
 *
 * Request/response like {@link INBOX_SEND_MESSAGE_EVENT}, and for the same
 * reason: the answer is shown to a human who has to act on it, so a hub that
 * cannot answer must be distinguishable from a hub that answers "broken".
 * Listeners return `null` for a channel they do not own.
 *
 * WHY THE INBOX CANNOT WORK THIS OUT ITSELF
 * ----------------------------------------
 * The channel tab list is derived from ChannelThread rows, which are permanent
 * — they outlive the messenger that created them. So a deleted, stopped or
 * logged-out WhatsApp connection leaves a fully-populated tab behind, and the
 * threads in it look completely normal right up until a reply fails. Only the
 * owning hub knows the difference, and it is the only thing that can name it.
 */
export const INBOX_CHANNEL_STATUS_EVENT = 'inbox.channel.status';

/** Payload for {@link INBOX_CHANNEL_STATUS_EVENT}. */
export interface InboxChannelStatusQuery {
  channel: string;
  /**
   * The caller's permission scope as bot ids, straight from
   * InboxService.scopeFilter. `null`/`undefined` is unscoped (admin); an EMPTY
   * ARRAY means "this caller may see nothing" and must not widen to everything.
   */
  botIds?: string[] | null;
}

/**
 * Why a channel is or is not usable — a closed set, deliberately.
 *
 * These are the states an OPERATOR can act on, not the engine's internal
 * lifecycle. Several engine statuses collapse into one entry here (both
 * `initializing` and `authenticating` are just "connecting" to a human), and two
 * states that share the engine status `disconnected` are split apart, because
 * "you stopped this" and "WhatsApp logged you out" need completely different
 * actions from the person reading the banner.
 */
export type InboxChannelState =
  /** A live connection exists. Nothing to show. */
  | 'connected'
  /** Handshaking. Transient, resolves on its own. */
  | 'connecting'
  /** Waiting for someone to scan the QR / enter the pairing code. */
  | 'awaiting_scan'
  /** The messenger row and its session are gone — this tab is history only. */
  | 'removed'
  /** Created but never linked to a number. */
  | 'not_connected'
  /** Deliberately stopped by an operator. Restartable, creds intact. */
  | 'disabled'
  /** WhatsApp unlinked the device: credentials are dead, a fresh scan is needed. */
  | 'session_expired'
  /** Dropped unexpectedly; the engine is retrying on its own backoff. */
  | 'reconnecting'
  /** Reconnect gave up, or the engine reported a hard failure. */
  | 'failed'
  /** No hub answered for this channel — we genuinely do not know. */
  | 'unknown';

/** One messenger/account behind a channel, and its own state. */
export interface InboxChannelStatusAccount {
  /** The hub's own identifier for the account (a WhatsApp Web session name). */
  sessionName: string;
  /** Operator-facing label, usually the messenger name. */
  label?: string;
  state: InboxChannelState;
  phone?: string;
  /** Populated for `failed`, when the engine recorded a reason. */
  detail?: string;
}

/**
 * The answer the dashboard renders as a banner.
 *
 * `state` is the AGGREGATE: a channel with one working account and one broken one
 * is `connected`, because messages still flow and a banner would be a false
 * alarm. `accounts` carries the per-account detail for a channel with several
 * numbers.
 */
export interface InboxChannelStatusResult {
  channel: string;
  state: InboxChannelState;
  /** True only when at least one account can send right now. */
  connected: boolean;
  accounts: InboxChannelStatusAccount[];
}
