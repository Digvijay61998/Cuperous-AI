import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type TemplateSubmissionDocument = TemplateSubmission & mongoose.Document;

/**
 * The customer's submitted template data. Single collection for ALL template
 * types (no per-template collections). Domain-specific fields live in the
 * schema-agnostic `data` blob; five promoted fields are duplicated out for
 * cheap cross-template querying / analytics / the customer timeline.
 */
@Schema({
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
export class TemplateSubmission {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'TemplateSession', required: true })
  templateSessionId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true })
  templateId: mongoose.Schema.Types.ObjectId;

  @Prop({ index: true }) visitorId: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Bot' })
  botId: mongoose.Schema.Types.ObjectId;

  // --- Promoted fields (duplicated out of `data` for querying) ---
  @Prop({ index: true }) category: string;
  @Prop() industry: string;
  @Prop({ default: 'pending' })
  status: string; // pending | confirmed | cancelled | completed | failed
  @Prop({ type: Date, default: null }) primaryDate: Date;
  @Prop({ type: Number, default: null }) primaryAmount: number;

  // --- Full domain-specific payload, arbitrary shape ---
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  data: Record<string, any>;

  @Prop({
    type: [{ url: String, type: String, filename: String }],
    default: [],
  })
  attachments: { url: string; type: string; filename: string }[];
}

export const TemplateSubmissionSchema =
  SchemaFactory.createForClass(TemplateSubmission);

TemplateSubmissionSchema.index({ visitorId: 1, createdAt: -1 });
TemplateSubmissionSchema.index({ category: 1, status: 1 });
