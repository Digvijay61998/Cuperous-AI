import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

export type AiUsageDocument = AiUsage & mongoose.Document;

/**
 * One record per AI-generated answer. Used for per-client billing and analytics
 * (the AI_RESPONSE node is a paid feature).
 */
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
})
export class AiUsage {
  @Prop({ required: true, index: true })
  clientId: string;

  @Prop()
  botId: string;

  @Prop()
  visitorId: string;

  @Prop()
  conversationId: string;

  @Prop()
  question: string;

  @Prop({ default: 0 })
  tokensUsed: number;

  @Prop()
  provider: string;

  @Prop()
  model: string;
}

export const AiUsageSchema = SchemaFactory.createForClass(AiUsage);
