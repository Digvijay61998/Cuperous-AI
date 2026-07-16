import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import * as mongoose from "mongoose";
import { Bot } from "src/bots/entities";
import { PlatformEnum } from "src/conversation/enums/platform.enum";
import { generateId } from "src/util";
import { VisitorStatusEnum } from "../enums/visitor-status.enum";
import { VisitorDetails } from "./visitor-details.entity";

export type VisitorDocument = Visitor & mongoose.Document;
@Schema({
  timestamps: true,
  virtuals: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      delete ret.visitorDetails;
      delete ret.totalRating;
      delete ret.totalRatingCount;
      return ret;
    },
  },
})
export class Visitor {
  _id: mongoose.Schema.Types.ObjectId;
  @Prop()
  name: string;

  @Prop({
    lowercase: true,
  })
  email: string;

  @Prop()
  phone: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Bot.name,
  })
  bot: Bot;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
      },
    ],
    default: [],
  })
  serviceRequests: string[];

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
    ],
    default: [],
  })
  conversations: string[];

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: VisitorDetails.name,
      },
    ],
    default: [],
  })
  visitorDetails: VisitorDetails[];

  @Prop({
    default: VisitorStatusEnum.OFFLINE,
  })
  status: string;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agent",
      },
    ],
  })
  agents: string[];

  @Prop({
    default: 0,
  })
  reportedCount: number;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feedback" }],
    default: [],
  })
  feedbacks: string[];

  @Prop({
    default: PlatformEnum.WIDGET,
    enum: PlatformEnum,
  })
  platform: string;

  @Prop({})
  username: string;
}

export const VisitorSchema = SchemaFactory.createForClass(Visitor);

VisitorSchema.index({
  name: "text",
  email: "text",
  phone: "text",
});

VisitorSchema.virtual("details").get(function () {
  if (!this.visitorDetails || this.visitorDetails.length === 0) return null;

  return this.visitorDetails[this.visitorDetails.length - 1];
});
