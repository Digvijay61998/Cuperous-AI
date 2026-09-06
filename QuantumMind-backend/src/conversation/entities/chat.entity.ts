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
 * Dedup oracle for channel messages: at most one row per (thread, external id).
 *
 * `sparse` is essential — the vast majority of rows (widget + bot chats) carry
 * neither field, and a non-sparse unique index would treat them all as
 * duplicate nulls and reject every insert after the first.
 */
ChatSchema.index(
  { channelThread: 1, externalMessageId: 1 },
  { unique: true, sparse: true },
);

/** Ack lookups: an incoming delivery receipt finds its row by external id. */
ChatSchema.index({ externalMessageId: 1 }, { sparse: true });

/** Thread history paging, newest-first. */
ChatSchema.index({ channelThread: 1, time: -1 });
