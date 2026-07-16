import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class ConversationActivities {
  @Prop()
  conversationId: string;

  @Prop()
  startedAt: Date;

  @Prop()
  endedAt: Date;

  @Prop()
  timeSpent: number;

  @Prop({
    type: Object,
  })
  attributes: Record<string, any>;
}

export type ConversationActivitiesDocument = ConversationActivities &
  mongoose.Document;

export const ConversationActivitiesSchema = SchemaFactory.createForClass(
  ConversationActivities,
);
