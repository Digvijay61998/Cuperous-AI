import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export interface VisitorInfo {
  visitorId: any;
  addedAt?: Date;
}

export type SegmentDocument = Segment & mongoose.Document;

@Schema({
  timestamps: true,
  virtuals: true,
  toJSON: {
    virtuals: true,
  },
})
export class Segment {
  @Prop({ required: true })
  name: string;

  @Prop({
    type: [
      {
        visitorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Visitor',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  })
  visitors: VisitorInfo[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true,
  })
  organizationId: mongoose.Schema.Types.ObjectId | null;
}

export const SegmentSchema = SchemaFactory.createForClass(Segment);
