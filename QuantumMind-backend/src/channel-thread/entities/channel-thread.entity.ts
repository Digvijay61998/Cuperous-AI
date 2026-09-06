import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ChannelThreadDocument = ChannelThread & mongoose.Document;

/**
 * A durable, channel-agnostic conversation thread with one external contact.
 *
 * WHY THIS EXISTS
 * ---------------
 * Before this, the only thing that knew how to reply to a social-platform
 * visitor was the `ctx` object held in SocketStateService's in-memory Map. That
 * map is evicted after an idle TTL (2h), evicted by LRU past `maxEntries`, and
 * lost entirely on restart — so an agent could not reply to a WhatsApp customer
 * after a restart or a quiet period. This collection persists the reply address,
 * so replying is always possible regardless of process state.
 *
 * WHY IT IS SEPARATE FROM `Conversation`
 * --------------------------------------
 * A `Conversation` is a *session* of engagement: it carries a status, gets
 * closed, and is expired by a 2-hourly cron. A WhatsApp/Telegram thread is
 * *permanent* — the same customer keeps writing to the same number for months.
 * So one ChannelThread spans MANY conversations over time. The inbox lists
 * threads; history is stitched from the thread's messages.
 *
 * WHY `channel` IS A PLAIN STRING
 * -------------------------------
 * Deliberately not a strict enum. Adding Instagram / Facebook / Discord / a
 * mobile SDK must not require a schema migration or an enum edit — the inbox
 * derives its channel tabs from whatever distinct values exist here. Values
 * follow PlatformEnum by convention (`whatsapp_web`, `telegram`, `widget`, ...).
 */
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
    },
  },
})
export class ChannelThread {
  /**
   * Which platform this thread belongs to, e.g. `whatsapp_web`, `telegram`.
   * Free-form on purpose — see the class docblock.
   */
  @Prop({ required: true, index: true })
  channel: string;

  /**
   * The account/engine instance inside that channel that owns the thread: the
   * WhatsApp Web session name, a Telegram bot id, a Facebook page id. Defaults
   * to '' (not undefined) so the compound unique index below stays reliable —
   * Mongo treats missing keys as null and would collide across documents.
   */
  @Prop({ default: '' })
  sessionName: string;

  /** The channel-native chat id: a WhatsApp JID, a Telegram chat id, a page-scoped id. */
  @Prop({ required: true })
  chatId: string;

  /** E.164 digits when the channel exposes a phone number. */
  @Prop()
  phone: string;

  /** Display name as the channel reports it (WhatsApp pushName, Telegram username). */
  @Prop()
  pushName: string;

  @Prop()
  avatarUrl: string;

  /** The bot that answers on this thread. */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Bot' })
  bot: any;

  /** The visitor record this external contact maps to. */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Visitor' })
  visitor: any;

  /**
   * The conversation currently collecting this thread's messages. Rotates when
   * the previous one is closed/expired; past conversations stay reachable
   * through the Chat rows, which keep their own conversationId.
   */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' })
  conversation: any;

  /** Denormalised preview so the inbox list needs no per-thread message lookup. */
  @Prop({ type: Object })
  lastMessage: Record<string, any>;

  @Prop({ index: true })
  lastMessageAt: Date;

  /** Messages received since the agent last opened this thread. */
  @Prop({ default: 0 })
  unreadCount: number;

  /**
   * Durable bot on/off for this thread. Persisted here rather than only in
   * socket state so a takeover survives a restart: while false the bot must not
   * answer, and a human owns the thread.
   */
  @Prop({ default: true })
  botEnabled: boolean;

  @Prop({ default: false })
  handledByAgent: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Agent' })
  assignedAgent: any;

  /**
   * Oldest message timestamp we hold locally, and its channel-native id. These
   * are the cursor for on-demand history: WhatsApp's `fetchMessageHistory`
   * needs the oldest known message key + timestamp to page backwards from.
   */
  @Prop()
  oldestMessageAt: Date;

  @Prop()
  oldestExternalMessageId: string;

  /** True once the channel reports there is nothing older left to fetch. */
  @Prop({ default: false })
  historyExhausted: boolean;

  /** Last time an on-demand history page was requested (rate-limits retries). */
  @Prop()
  historyRequestedAt: Date;

  /**
   * Free-form per-channel extras that do not deserve a column: WhatsApp `lid`,
   * whether the contact is a business account, Telegram language code, etc.
   */
  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;
}

export const ChannelThreadSchema = SchemaFactory.createForClass(ChannelThread);

/**
 * One thread per (channel, owning account, external chat). This is the identity
 * the inbound path upserts on, so a customer messaging twice reuses one thread
 * instead of creating duplicates.
 */
ChannelThreadSchema.index(
  { channel: 1, sessionName: 1, chatId: 1 },
  { unique: true },
);

/** Inbox ordering: newest activity first, optionally filtered to one channel. */
ChannelThreadSchema.index({ channel: 1, lastMessageAt: -1 });

/** Resolving a thread from a visitor (used by the outbound/reply path). */
ChannelThreadSchema.index({ visitor: 1 });
