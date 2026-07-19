import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type FeatureFlagDocument = FeatureFlag & mongoose.Document;

/**
 * Runtime feature flags stored in Mongo (not env) so they can be toggled per
 * bot at runtime without a redeploy. Primary use in Phase 2: selecting the
 * active messaging provider per channel (e.g. whatsapp_official vs
 * whatsapp_openwa). A bot-scoped flag overrides a global flag with the same key.
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
export class FeatureFlag {
  @Prop({ required: true, enum: ['global', 'bot'], default: 'global' })
  scope: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Bot', default: null })
  botId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  key: string; // e.g. "whatsapp.provider"

  @Prop({ type: mongoose.Schema.Types.Mixed })
  value: any; // e.g. "whatsapp_openwa"

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null })
  updatedBy: mongoose.Schema.Types.ObjectId;
}

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);

// One value per (scope, key, botId). Global rows have botId=null.
FeatureFlagSchema.index({ scope: 1, key: 1, botId: 1 }, { unique: true });
