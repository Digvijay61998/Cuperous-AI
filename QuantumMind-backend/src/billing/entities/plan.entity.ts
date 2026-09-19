import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type PlanDocument = Plan & mongoose.Document;

export interface PlanLimits {
  maxBots: number;
  maxAgents: number;
  maxPlatforms: number;
  maxTemplates: number;
}

/**
 * A subscription tier ("group") — the shared catalog of default entitlements.
 * An organization is attached to a Plan via a Subscription, which may layer
 * per-org overrides on top. This mirrors the Template -> TemplateInstance
 * pattern: shared defaults + a per-tenant override layer.
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
export class Plan {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ default: true })
  isPublic: boolean;

  @Prop({
    type: {
      maxBots: Number,
      maxAgents: Number,
      maxPlatforms: Number,
      maxTemplates: Number,
    },
    default: { maxBots: 0, maxAgents: 0, maxPlatforms: 0, maxTemplates: 0 },
  })
  limits: PlanLimits;

  /** Feature key -> enabled. Keys must come from the fixed feature catalog. */
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  features: Record<string, boolean>;

  /** Metadata only for now (no payment integration yet). */
  @Prop({
    type: { price: Number, interval: String, currency: String },
    default: { price: 0, interval: 'month', currency: 'USD' },
  })
  billing: { price: number; interval: string; currency: string };
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
