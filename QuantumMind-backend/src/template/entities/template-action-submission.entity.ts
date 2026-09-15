import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { TemplateActionStatusEnum } from '../enums/template-action-status.enum';

export type TemplateActionSubmissionDocument = TemplateActionSubmission &
  mongoose.Document;

/**
 * One record per hosted-template action submission (appointment booking,
 * form, lead, slot, upload, payment, quote). Every submission is traceable
 * back to the template, bot, conversation and visitor it came from, so it
 * can be surfaced in a dashboard or re-delivered into the conversation.
 */
@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class TemplateActionSubmission {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
  })
  templateId: mongoose.Schema.Types.ObjectId;

  @Prop({
    required: true,
  })
  actionType: string;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: {},
  })
  payload: Record<string, any>;

  @Prop({
    default: '',
  })
  botId: string;

  @Prop({
    default: '',
  })
  conversationId: string;

  @Prop({
    default: '',
  })
  visitorId: string;

  @Prop({
    default: '',
  })
  phone: string;

  @Prop({
    default: '',
  })
  platform: string;

  @Prop({
    enum: Object.values(TemplateActionStatusEnum),
    default: TemplateActionStatusEnum.RECEIVED,
  })
  status: string;

  @Prop({
    type: String,
    default: null,
  })
  requestId: string | null;
}

export const TemplateActionSubmissionSchema = SchemaFactory.createForClass(
  TemplateActionSubmission,
);

TemplateActionSubmissionSchema.index({ templateId: 1, createdAt: -1 });
TemplateActionSubmissionSchema.index({ botId: 1, createdAt: -1 });
TemplateActionSubmissionSchema.index({ conversationId: 1 });
// Idempotency: the same template + requestId can only be stored once.
TemplateActionSubmissionSchema.index(
  { templateId: 1, requestId: 1 },
  { unique: true, partialFilterExpression: { requestId: { $type: 'string' } } },
);
