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
