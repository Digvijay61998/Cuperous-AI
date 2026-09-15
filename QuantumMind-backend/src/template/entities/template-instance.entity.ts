import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type TemplateInstanceDocument = TemplateInstance & mongoose.Document;

/**
 * A per-customer copy of a template's editable configuration.
 *
 * `Template.configValues` holds the catalog-wide defaults shared by everyone.
 * A TemplateInstance layers one bot's overrides on top, so two customers using
 * the same template can set their own branding, labels and pricing without
 * overwriting each other.
 */
@Schema({
  virtuals: true,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class TemplateInstance {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
  })
  templateId: mongoose.Schema.Types.ObjectId;

  /** The bot this configuration belongs to - the tenant boundary. */
  @Prop({
    required: true,
    trim: true,
  })
  botId: string;

  /** Denormalized for dashboard listing/filtering; not used for resolution. */
  @Prop({
    default: '',
    trim: true,
  })
  workspaceId: string;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: {},
  })
  configValues: Record<string, any>;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    default: null,
  })
  updatedBy: mongoose.Schema.Types.ObjectId;

  @Prop({
    default: false,
  })
  isDeleted: boolean;
}

export const TemplateInstanceSchema =
  SchemaFactory.createForClass(TemplateInstance);

// One configuration per (template, bot). Also backs the resolution lookup and
// makes concurrent upserts safe by surfacing a duplicate-key error.
TemplateInstanceSchema.index({ templateId: 1, botId: 1 }, { unique: true });
