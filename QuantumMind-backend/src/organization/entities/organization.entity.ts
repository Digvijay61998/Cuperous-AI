import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { OrganizationStatus } from '../enums/organization-status.enum';

export type OrganizationDocument = Organization & mongoose.Document;

/**
 * A customer tenant. The hard data boundary for the platform: every
 * tenant-owned resource carries an `organizationId` pointing here, and all
 * non-super-admin queries are scoped to the caller's organization.
 *
 * The `*Count` fields are denormalized counters used for race-safe quota
 * enforcement (see Phase 3 EntitlementService). They are the source of truth
 * for "how many bots/agents/templates does this org currently have" so a
 * create can be gated with a single atomic `findOneAndUpdate`.
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
export class Organization {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({
    type: String,
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
  })
  status: OrganizationStatus;

  /** The ORG_ADMIN who owns this organization. */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null })
  ownerId: mongoose.Schema.Types.ObjectId;

  @Prop({ default: 0 })
  botCount: number;

  @Prop({ default: 0 })
  agentCount: number;

  @Prop({ default: 0 })
  templateCount: number;

  /** Connected channel/platform accounts (Social rows) — `maxPlatforms`. */
  @Prop({ default: 0 })
  platformCount: number;

  /** ISO 3166-1 alpha-2 country code; seeds the default time zone. */
  @Prop({ type: String, trim: true, uppercase: true, default: null })
  country: string | null;

  /**
   * IANA time zone for dates shown to visitors and in summaries/emails.
   * Null -> derived from `country`, then UTC (see resolveOrgTimeZone).
   */
  @Prop({ type: String, trim: true, default: null })
  timeZone: string | null;

  /** The SUPER_ADMIN who created this organization. */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null })
  createdBy: mongoose.Schema.Types.ObjectId;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
