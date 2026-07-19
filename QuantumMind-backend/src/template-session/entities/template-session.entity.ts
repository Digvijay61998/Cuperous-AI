import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { TemplateSessionStatusEnum } from '../enums/template-session-status.enum';

export type TemplateSessionDocument = TemplateSession & mongoose.Document;

/**
 * Correlation record linking a launched template instance back to the paused
 * workflow execution that spawned it. This is the single source of truth for
 * "which node, in which conversation, for which visitor is waiting on this
 * template submission".
 */
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      delete ret.launchToken; // never expose the raw token in API responses
      return ret;
    },
  },
})
export class TemplateSession {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true })
  templateId: mongoose.Schema.Types.ObjectId;

  @Prop({ default: '1.0.0' })
  templateVersion: string; // snapshot at launch; survives mid-session republish

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Bot' })
  botId: mongoose.Schema.Types.ObjectId;

  @Prop() nodeId: string; // BotFlowNode that launched this
  @Prop() visitorId: string;
  @Prop() conversationId: string;
  @Prop() platform: string; // channel the workflow is running on

  @Prop({
    enum: TemplateSessionStatusEnum,
    default: TemplateSessionStatusEnum.CREATED,
  })
  status: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  variables: Record<string, any>; // dynamic vars passed INTO the template

  @Prop({ required: true, index: true })
  launchToken: string; // opaque, single-use, validated server-side

  @Prop() launchedAt: Date;
  @Prop() openedAt: Date;
  @Prop() submittedAt: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'TemplateSubmission', default: null })
  submissionId: mongoose.Schema.Types.ObjectId;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: null })
  idempotencyKey: string;

  @Prop({ required: true })
  expiresAt: Date; // TTL-eligible for sessions that never complete
}

export const TemplateSessionSchema = SchemaFactory.createForClass(TemplateSession);

TemplateSessionSchema.index({ visitorId: 1, createdAt: -1 });
TemplateSessionSchema.index({ status: 1, expiresAt: 1 }); // timeout sweep
