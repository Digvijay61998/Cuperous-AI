import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Bot } from 'src/bots/entities';
import * as mongoose from 'mongoose';
import { Webhook } from './webhook.entity';

@Schema({
  timestamps: true,
})
export class WebHookActivities {
  @Prop({
    required: true,
  })
  status: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Bot.name,
  })
  bot: Bot;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Webhook',
  })
  webhookId: Webhook;
}

export type WebHookActivitiesDocument = WebHookActivities & mongoose.Document;

export const WebHookActivitiesSchema =
  SchemaFactory.createForClass(WebHookActivities);
