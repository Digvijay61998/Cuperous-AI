import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SocialPlatformEnum } from '../enums/social-platform.enum';
import { SocialStatusEnum } from '../enums/social-status.enum';

export type SocialDocument = Social & mongoose.Document;

@Schema({
  timestamps: true,
  virtuals: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class Social {
  @Prop()
  name: string;

  @Prop()
  accessToken: string;

  @Prop({ enum: SocialPlatformEnum })
  platform: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
  })
  jarcubeBot: any;

  @Prop()
  botId: string;

  @Prop({
    enum: SocialStatusEnum,
    default: SocialStatusEnum.DRAFT,
  })
  status: string;

  // WhatsApp Web only: link back to the WhatsappWebSession this row represents,
  // and a denormalised copy of its live status so the list can drive the
  // OpenWA-style session action buttons without a second lookup.
  @Prop()
  sessionId: string;

  @Prop()
  sessionStatus: string;
}

export const SocialSchema = SchemaFactory.createForClass(Social);
