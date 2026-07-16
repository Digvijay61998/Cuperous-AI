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
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
