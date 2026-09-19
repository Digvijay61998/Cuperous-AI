import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type AuditLogDocument = AuditLog & mongoose.Document;

/**
 * Append-only record of privileged actions (org create/suspend, subscription
 * and limit/feature changes, impersonation). Kept lean and never mutated.
 */
@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null })
  actorId: mongoose.Schema.Types.ObjectId | null;

  @Prop({ default: null })
  actorRole: string | null;

  @Prop({ required: true })
  action: string;

  @Prop({ default: null })
  targetType: string | null;

  @Prop({ default: null })
  targetId: string | null;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  })
  organizationId: mongoose.Schema.Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
