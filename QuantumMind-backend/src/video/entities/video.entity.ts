import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { VideoStatusEnum } from '../enum/video-status.enum';

export type VideoDocument = Video & mongoose.Document;

@Schema({
  virtuals: true,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      delete ret.views;
    },
  },
})
export class Video {
  @Prop({
    required: true,
  })
  title: string;
  @Prop({
    required: true,
  })
  subtitle: string;

  @Prop({
    required: true,
  })
  url: string;

  @Prop({
    required: true,
  })
  category: string;

  @Prop({
    required: true,
  })
  description: string;

  @Prop({
    default: VideoStatusEnum.DRAFT,
  })
  status: string;

  @Prop({
    type: [
      {
        type: {
          date: { type: Date, default: Date.now },
        },
      },
    ],
    default: [],
  })
  views: [];
}

export const VideoSchema = SchemaFactory.createForClass(Video);

VideoSchema.virtual('viewCount').get(function () {
  return this.views.length;
});

VideoSchema.index(
  {
    title: 'text',
    subtitle: 'text',
    description: 'text',
  },
  {
    weights: {
      title: 10,
      search_keywords: 5,
      description: 1,
    },
  },
);
