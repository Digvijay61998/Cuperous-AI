import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Agent } from 'src/agent/entities/agent.entity';
import { generateId } from 'src/util';
import { BotSetting } from './bot-setting.entity';
import { BotStyles } from './bot-styles.entity';
import { BotStatusEnum } from '../enums/bot-status.enum';

import { BotFlow } from './bot-flow.entity';
import { Tag } from 'src/tag/entities/tag.entity';

export type BotDocument = Bot & mongoose.Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
  },
})
export class Bot {
  @Prop({ required: true })
  name: string;

  /** Owning tenant. The organization is the hard data boundary for bots. */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true,
  })
  organizationId: mongoose.Schema.Types.ObjectId | null;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: Agent.name }],
  })
  agents: Agent[];

  @Prop({
    default: BotStatusEnum.ACTIVE,
  })
  status: BotStatusEnum;

  @Prop({
    default: false,
  })
  published: boolean;

  @Prop({
    default: () => generateId('bot', 15),
  })
  botId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: BotStyles.name })
  botStyles: BotStyles;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: BotSetting.name })
  botSetting: BotSetting;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: BotFlow.name,
  })
  botFlow: BotFlow;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: Tag.name }],
    default: [],
  })
  tags: Tag[];

  @Prop({
    default: false,
  })
  questionBank: boolean;

  @Prop({
    default: false,
  })
  saveUnansweredQuestions: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
  })
  advertisement: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
  })
  offer: string;

  @Prop({
    default: false,
  })
  showAdvertisement: boolean;

  @Prop({
    default: false,
  })
  showOffer: boolean;
}

export const BotSchema = SchemaFactory.createForClass(Bot);
