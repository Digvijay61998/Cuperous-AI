import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Visitor } from 'src/visitor/entities/visitor.entity';
import * as mongoose from 'mongoose';

@Schema({
  timestamps: true,
  versionKey: false,
  virtuals: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class UnansweredQuestion {
  @Prop()
  question: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
  })
  askedBy: Visitor;

  @Prop()
  time: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
  })
  botid: string;
}

export const UnansweredQuestionSchema =
  SchemaFactory.createForClass(UnansweredQuestion);

export type UnansweredQuestionDocument = mongoose.Document & UnansweredQuestion;
