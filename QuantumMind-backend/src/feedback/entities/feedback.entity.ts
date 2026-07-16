import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { FeedbackForEnum } from '../enums/feedback-for.enum';
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
export class Feedback {
  @Prop()
  rating: number;

  @Prop()
  comment: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
  })
  visitor: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
  })
  agent: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
  })
  bot: string;

  @Prop({
    required: true,
    enum: FeedbackForEnum,
  })
  feedbackFor: FeedbackForEnum;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  })
  conversation: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

export type FeedbackDocument = Feedback & mongoose.Document;
