import {
  ChatDocument,
  isPendingExternalId,
} from 'src/conversation/entities/chat.entity';
import { ChannelThreadDocument } from 'src/channel-thread/entities/channel-thread.entity';

/**
 * Wire shapes for the inbox API.
 *
 * Deliberately flat and explicit rather than handing back raw Mongoose
 * documents. `GET /conversation/:id` projects chats down to
 * `{message, time, sender, type}`, which is exactly why the dashboard can never
 * render a delivery tick or an attachment — the fields are dropped server-side.
 * These DTOs are the contract that fixes that, so every channel field the UI
 * needs has one documented name.
 */

/**
 * Media descriptor. Mirrors OpenWA's dashboard convention, which is worth
 * copying precisely: media is either present (`url`) or explicitly
 * `omitted: true`, and NEVER simply absent.
 *
 * The distinction matters because "no media" and "media we chose not to fetch"
 * render differently — an empty bubble versus a 📎 placeholder the agent can
 * click to download. Our inbound path already records `mediaOmitted` without
 * downloading bytes (see BaileysEngineService.emitMessage), so every media
 * message today is the second case. Collapsing them would make a real
 * attachment look like a blank message.
 */
export interface InboxMediaView {
  mimetype?: string;
  fileName?: string;
  /** Stored/downloaded location. Absent while `omitted` is true. */
  url?: string;
  omitted: boolean;
}

export interface InboxMessageView {
  id: string;
  /**
   * The channel-native id (WhatsApp `key.id`). The client dedups on
   * `externalMessageId ?? id` — a persisted row and a live socket echo of the
   * same message key differently, and anything keyed on `id` alone double-adds.
   */
  externalMessageId?: string;
  threadId?: string;
  conversationId?: string;
  message: string;
  type: string;
  time: Date;
  /** Who sent it: our bot/agent id, or the visitor id. */
  sender?: string;
  /** Display name of the external sender as the channel reported it. */
  authorName?: string;
  /** `inbound` | `outbound` from our point of view. Undefined on legacy rows. */
  direction?: string;
  /** Delivery ladder for outbound messages. Undefined for inbound. */
  status?: string;
  media?: InboxMediaView;
  quotedMessageId?: string;
  /** True for rows written by a history backfill rather than a live event. */
  historical: boolean;
  /**
   * The correlation id (`Chat.chatId`) this outbound row was stored under.
   *
   * Exposed so the dashboard can fold the echo of its own reply onto the
   * optimistic placeholder it rendered at submit time. The two are keyed
   * differently until the server identity is known — the placeholder by a
   * temporary id, the echo by the channel's id — so without this the same reply
   * renders twice.
   */
  correlationId?: string;
}

export interface InboxThreadView {
  id: string;
  channel: string;
  sessionName: string;
  chatId: string;
  phone?: string;
  name?: string;
  avatarUrl?: string;
  unreadCount: number;
  botEnabled: boolean;
  handledByAgent: boolean;
  assignedAgent?: { id: string; name?: string } | null;
  lastMessage?: Record<string, any> | null;
  lastMessageAt?: Date | null;
  bot?: { id: string; name?: string } | null;
  visitor?: { id: string; name?: string; email?: string; phone?: string } | null;
  /** True once the channel reports there is nothing older left to fetch. */
  historyExhausted: boolean;
  oldestMessageAt?: Date | null;
}

/** Types whose media we record the existence of without storing the bytes. */
const MEDIA_TYPES = new Set([
  'image',
  'video',
  'audio',
  'voice',
  'sticker',
  'file',
  'document',
]);

/**
 * Build the media descriptor for a stored row.
 *
 * Returns undefined only when the message genuinely has no media. A media-typed
 * message with neither a URL nor an explicit `mediaOmitted` flag still yields a
 * descriptor with `omitted: true`, because the row's own type is evidence that
 * an attachment existed — dropping it would silently render an empty bubble
 * where the customer sent a photo.
 */
function toMediaView(chat: ChatDocument): InboxMediaView | undefined {
  const hasMediaHint =
    !!chat.mediaUrl ||
    !!chat.mimetype ||
    !!chat.fileName ||
    chat.mediaOmitted === true ||
    MEDIA_TYPES.has(chat.type);

  if (!hasMediaHint) return undefined;

  return {
    mimetype: chat.mimetype || undefined,
    fileName: chat.fileName || undefined,
    url: chat.mediaUrl || undefined,
    omitted: !chat.mediaUrl,
  };
}

/** Normalise a populated ref to `{ id, ... }`, tolerating an unpopulated ObjectId. */
function refView(ref: any, fields: string[]): Record<string, any> | null {
  if (!ref) return null;
  // Unpopulated: the value is the ObjectId itself, so there is nothing but an id.
  if (!ref._id) return { id: ref.toString() };
  const out: Record<string, any> = { id: ref._id.toString() };
  for (const f of fields) {
    if (ref[f] !== undefined) out[f] = ref[f];
  }
  return out;
}

export function toMessageView(chat: ChatDocument): InboxMessageView {
  return {
    id: (chat._id as any).toString(),
    // A `pending:` placeholder is an internal device for keeping the unique index
    // satisfied before the channel answers (see PENDING_EXTERNAL_ID_PREFIX); it is
    // not a channel id. Leaking it would make the client dedupe on it, offer a
    // quoted reply the channel cannot resolve, and render a tick for a message the
    // channel has not accepted.
    externalMessageId: isPendingExternalId(chat.externalMessageId)
      ? undefined
      : chat.externalMessageId || undefined,
    threadId: chat.channelThread ? chat.channelThread.toString() : undefined,
    conversationId: chat.conversationId
      ? chat.conversationId.toString()
      : undefined,
    message: chat.message ?? '',
    type: chat.type,
    time: chat.time,
    sender: chat.sender || undefined,
    authorName: chat.authorName || undefined,
    direction: chat.direction || undefined,
    status: chat.status || undefined,
    media: toMediaView(chat),
    quotedMessageId: chat.quotedMessageId || undefined,
    historical: chat.historical === true,
    correlationId: chat.chatId || undefined,
  };
}

export function toThreadView(
  thread: ChannelThreadDocument,
): InboxThreadView {
  const visitor = refView(thread.visitor, ['name', 'email', 'phone']);
  return {
    id: (thread._id as any).toString(),
    channel: thread.channel,
    sessionName: thread.sessionName || '',
    chatId: thread.chatId,
    phone: thread.phone || undefined,
    // The channel's own display name wins; the visitor record is the fallback
    // for a thread whose contact never sent a pushName.
    name: thread.pushName || (visitor?.name as string) || thread.phone || thread.chatId,
    avatarUrl: thread.avatarUrl || undefined,
    unreadCount: thread.unreadCount ?? 0,
    botEnabled: thread.botEnabled !== false,
    handledByAgent: thread.handledByAgent === true,
    assignedAgent: refView(thread.assignedAgent, ['name', 'email']) as any,
    lastMessage: thread.lastMessage || null,
    lastMessageAt: thread.lastMessageAt || null,
    bot: refView(thread.bot, ['name']) as any,
    visitor: visitor as any,
    historyExhausted: thread.historyExhausted === true,
    oldestMessageAt: thread.oldestMessageAt || null,
  };
}
