import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { PlanLimits } from './plan.entity';

export type SubscriptionDocument = Subscription & mongoose.Document;

/**
 * Attaches one organization to one plan, with optional per-org overrides.
 *
 * Effective entitlements = plan defaults merged with these overrides. This is
 * how a SUPER_ADMIN customizes a single customer (e.g. "Pro plan but capped at
 * 1 bot" or "enable Telegram for just this org") without touching the shared
 * plan.
 */
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
})
export class Subscription {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true,
  })
  organizationId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true })
  planId: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  /** Partial overrides layered over the plan's defaults. */
  @Prop({
    type: {
      limits: mongoose.Schema.Types.Mixed,
      features: mongoose.Schema.Types.Mixed,
    },
    default: {},
  })
  overrides: {
    limits?: Partial<PlanLimits>;
    features?: Record<string, boolean>;
  };

  @Prop({ default: () => new Date() })
  startedAt: Date;

  @Prop({ default: null })
  currentPeriodEnd: Date | null;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
