import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ChatTypeEnum } from '../enums/chat-type.enum';
import { ChatDirectionEnum } from '../enums/chat-direction.enum';
import { ChatStatusEnum } from '../enums/chat-status.enum';
import { Conversation } from './conversation.entity';

export type ChatDocument = Chat & mongoose.Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.__v;
      delete ret.createdAt;
      delete ret.updatedAt;
    },
  },
})
export class Chat {
  @Prop()
  message: string;

  @Prop()
  sender: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  })
  conversationId: Conversation;

  @Prop({
    enum: ChatTypeEnum,
    default: ChatTypeEnum.TEXT,
  })
  type: string;

  @Prop()
  time: Date;

  @Prop()
  chatId: string;

  @Prop({
    default: false,
  })
  secured: boolean;

  // ---------------------------------------------------------------------------
  // Channel (WhatsApp / Telegram / Instagram / ...) message fields.
  //
  // All optional, so every existing widget/bot chat row stays valid and nothing
  // needs backfilling. Named generically rather than `waMessageId` etc. so the
  // other channels reuse the same columns instead of each adding their own.
  // ---------------------------------------------------------------------------

  /**
   * The thread this message belongs to. Lets us read a full channel history
   * across several conversations (a WhatsApp thread outlives any one
   * Conversation, which is closed/expired by cron).
   */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ChannelThread' })
  channelThread: any;

  /**
   * The channel-native message id (WhatsApp `key.id`, Telegram `message_id`).
   *
   * This is the dedup key: engines re-fire the same message (reconnects, history
   * overlap), and without it every replay inserts a duplicate row.
   */
  @Prop()
  externalMessageId: string;

  /**
   * Which way the message travelled, from OUR point of view. Needed because
   * `sender` alone is ambiguous on a channel: a message the operator typed on
   * their own phone is outbound but its sender is neither our bot nor an agent.
   */
  @Prop({ enum: ChatDirectionEnum })
  direction: string;

  /**
   * Delivery state for outbound messages — the double-tick ladder.
   *
   * Advances forward only (pending -> sent -> delivered -> read); `failed` is
   * terminal. Left undefined for inbound messages and for widget chats, where
   * the concept does not apply.
   */
  @Prop({ enum: ChatStatusEnum })
  status: string;

  /** Display name of the external sender, as the channel reported it. */
  @Prop()
  authorName: string;

  /** Stored/downloaded media location for image/video/audio/file messages. */
  @Prop()
  mediaUrl: string;

  @Prop()
  mimetype: string;

  @Prop()
  fileName: string;

  /**
   * True when the channel had media but we deliberately did not store the bytes
   * (over the size cap, download disabled, or a download failure). Lets the UI
   * render an explicit "attachment not downloaded" affordance instead of an
   * empty bubble.
   */
  @Prop({ default: false })
  mediaOmitted: boolean;

  /** The channel-native id of the message this one replies to, when quoted. */
  @Prop()
  quotedMessageId: string;

  /**
   * True for rows written by a history backfill rather than a live event.
   * Backfilled messages must never be fed to the bot — replaying them would
   * make the bot answer months-old messages.
   */
  @Prop({ default: false })
  historical: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

/**
 * Prefix marking a locally-generated stand-in for a channel message id.
 *
 * WHY A PLACEHOLDER IS NEEDED AT ALL
 * ----------------------------------
 * An outbound message is written BEFORE it is sent, so that a message the channel
 * accepts can never lack a local record. At write time we do not yet know the
 * channel's own id — but leaving `externalMessageId` unset is not an option,
 * because of how the unique index below behaves on a compound key:
 *
 *   `sparse` skips a document only when **every** indexed field is missing. A row
 *   with `channelThread` set and `externalMessageId` absent IS indexed, as
 *   `externalMessageId: null` — so only ONE such row can exist per thread.
 *
 * The consequence, observed in production: the first reply on a thread stored
 * fine; the moment one was left in `pending`/`failed`, every later reply on that
 * thread collided with E11000 and was rejected. A single failed message
 * permanently blocked the conversation.
 *
 * Giving each outbound row a unique placeholder keeps the slot occupied by a
 * distinct value, so unlimited replies can be in flight per thread. It is
 * overwritten with the channel's real id by `linkOutboundChannelMessage`.
 */
export const PENDING_EXTERNAL_ID_PREFIX = 'pending:';

/** The placeholder a not-yet-acknowledged outbound row carries. */
export function pendingExternalId(correlationId: string): string {
  return `${PENDING_EXTERNAL_ID_PREFIX}${correlationId}`;
}

/** True for a locally-minted stand-in rather than a real channel message id. */
export function isPendingExternalId(
  externalMessageId: string | undefined | null,
): boolean {
  return !!externalMessageId?.startsWith(PENDING_EXTERNAL_ID_PREFIX);
}

/**
 * Dedup oracle for channel messages: at most one row per (thread, external id).
 *
 * `sparse` is essential — the vast majority of rows (widget + bot chats) carry
 * neither field, and a non-sparse unique index would treat them all as
 * duplicate nulls and reject every insert after the first.
 *
 * NOTE the compound-sparse subtlety documented on
 * {@link PENDING_EXTERNAL_ID_PREFIX}: this index does NOT skip a row that has a
 * `channelThread` but no `externalMessageId`. Anything writing an outbound row
 * before the channel has answered must supply a unique placeholder.
 */
ChatSchema.index(
  { channelThread: 1, externalMessageId: 1 },
  { unique: true, sparse: true },
);

/** Ack lookups: an incoming delivery receipt finds its row by external id. */
ChatSchema.index({ externalMessageId: 1 }, { sparse: true });

/**
 * Correlation-id lookups, on the hot path for every outbound channel message.
 *
 * `linkOutboundChannelMessage` and `failOutboundByCorrelationId` both find a row
 * by `chatId`; without this the send path pays a collection scan per reply.
 * Sparse because widget/bot rows written before the correlation convention have
 * no value here.
 */
ChatSchema.index({ chatId: 1 }, { sparse: true });

/** Thread history paging, newest-first. */
ChatSchema.index({ channelThread: 1, time: -1 });
