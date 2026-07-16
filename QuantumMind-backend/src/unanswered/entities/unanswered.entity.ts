import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { UnansweredQuestionDocument } from './unanswered-question.entity';

export interface Questions {
  question: string;
  askedBy: string;
  time: Date;
}

@Schema({
  timestamps: true,
  versionKey: false,
  virtuals: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class Unanswered {
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UnansweredQuestion',
      },
    ],
    default: [],
  })
  questions: UnansweredQuestionDocument[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
  })
  botId: string;
}

export type UnansweredDocument = Unanswered & Document;
export const UnansweredSchema = SchemaFactory.createForClass(Unanswered);
