import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

import { WebHookActivities } from './webhook-activities';

export type WebhookDocument = Webhook & mongoose.Document;

@Schema({
  timestamps: true,
})
export class Webhook {
  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: true,
  })
  url: string;

  @Prop({
    required: true,
  })
  verifyToken: string;

  @Prop()
  headersKey: string;

  @Prop()
  headersValue: string;

  @Prop()
  basicAuthUsername: string;

  @Prop()
  basicAuthPassword: string;

  @Prop()
  events: string;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    default: 0,
  })
  failedRequests: number;

  @Prop()
  lastRequest: Date;

  @Prop({
    default: 0,
  })
  succesRequests: number;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: WebHookActivities.name,
      },
    ],
    default: [],
  })
  activities: WebHookActivities[];
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);
