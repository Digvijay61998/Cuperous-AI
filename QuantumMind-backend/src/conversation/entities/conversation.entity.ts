import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose, { Document } from 'mongoose';
import { Agent, AgentDocument } from 'src/agent/entities/agent.entity';
import { Bot, BotDocument } from 'src/bots/entities';
import { Visitor } from 'src/visitor/entities/visitor.entity';
import { ConversationStatusEnum } from '../enums/conversation-status.enum';
import { ConversationTypeEnum } from '../enums/conversation-type.enum';
import { PlatformEnum } from '../enums/platform.enum';
import { Chat } from './chat.entity';
import { ConversationActivities } from './conversation-activities.entity';

export type ConversationDocument = Conversation & Document;

@Schema({
  timestamps: true,
})
export class Conversation {
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
      },
    ],
  })
  chats: Chat[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Agent.name,
  })
  agent: any;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Visitor.name,
  })
  visitor: Visitor;

  @Prop({
    enum: ConversationStatusEnum,
    default: ConversationStatusEnum.IN_PROGRESS,
  })
  status: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Bot.name,
  })
  bot: BotDocument;

  @Prop({
    required: true,
    enum: ConversationTypeEnum,
  })
  type: string;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConversationActivities',
      },
    ],
  })
  activities: ConversationActivities[];

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
      },
    ],
    default: [],
  })
  feedbacks: string[];

  @Prop({
    default: false,
  })
  transferredToAgent: boolean;

  @Prop()
  transferredAt: Date;

  @Prop()
  agentCallEndedAt: Date;

  @Prop({
    default: true,
  })
  anonymous: boolean;

  @Prop({
    enum: PlatformEnum,
    default: PlatformEnum.WIDGET,
  })
  platform: string;

  /**
   * The durable omnichannel thread this conversation is mirrored onto, if any.
   * Set once the first message is persisted (see WidgetInboxBridgeService). Lets
   * the inbox read a widget conversation's messages by thread, exactly like a
   * WhatsApp thread.
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChannelThread',
  })
  channelThread: any;

  // ---------------------------------------------------------------------------
  // crm-incident-handover (all optional, additive — existing rows stay valid)
  // ---------------------------------------------------------------------------

  /** CRM (Postgres) contact cuid this conversation is linked to (R3.1). No FK. */
  @Prop({ type: String, index: true })
  crmContactId?: string;

  /**
   * Persisted flow position so a widget reload can resume the same
   * conversation instead of restarting it (R9.3).
   */
  @Prop({ type: Object, _id: false })
  flowPosition?: { nodeId: string; updatedAt: Date };

  /** An identity-conflict question awaiting the visitor's answer (R17.2). */
  @Prop({ type: Object, _id: false })
  pendingIdentity?: {
    field: 'email' | 'phone';
    newValue: string;
    contactId: string;
    askedAt: Date;
    turns: number;
  };

  /** A problem-description question awaiting the visitor's answer (R4). */
  @Prop({ type: Object, _id: false })
  awaitingProblem?: { attempt: number; askedAt: Date };

  /** A Closure_Prompt awaiting the visitor's answer (R14). */
  @Prop({ type: Object, _id: false })
  awaitingClosure?: { sentAt: Date; idleMinutes?: number; closingMessage?: string };

  /** True while this conversation has an open Incident_Record. */
  @Prop({ default: false })
  incidentOpen: boolean;

  /**
   * What happened to the raw chat rows after the session (D9, R18):
   * kept (default), pending_merge (merge failed, retry), summarised (merged
   * into the Visitor_Profile then deleted), purged (deleted, nothing kept),
   * would_purge (dry-run marker during rollout).
   */
  @Prop({
    type: String,
    enum: ['kept', 'pending_merge', 'summarised', 'purged', 'would_purge'],
    default: 'kept',
  })
  transcriptState: string;

  /** Message counter kept so reports stay correct after chats are deleted. */
  @Prop({ default: 0 })
  messageCount: number;

  /** What a live run does (or did) with the chats: 'purge' or 'summarise' (R18.5, R18.7). */
  @Prop()
  transcriptPlan?: string;

  /** Failed profile merges so far; the daily run retries (R18.10). */
  @Prop({ default: 0 })
  mergeAttempts: number;

  @Prop()
  lastMergeError?: string;

  @Prop()
  lastMergeAt?: Date;

  /** When the chat rows were deleted. */
  @Prop()
  purgedAt?: Date;

  /** One session-lifecycle worker at a time per conversation. */
  @Prop()
  lifecycleLeaseUntil?: Date;

  @Prop()
  endedAt?: Date;

  /** Why the conversation ended (closure, idle, close_chat, expired, disconnect, agent). */
  @Prop()
  endCause?: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Idle-close cron (R14.5): only conversations with a pending prompt are indexed.
ConversationSchema.index(
  { 'awaitingClosure.sentAt': 1 },
  { partialFilterExpression: { 'awaitingClosure.sentAt': { $exists: true } } },
);
