import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

export type VisitorDetailsDocument = VisitorDetails & mongoose.Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      delete ret._id;
      delete ret.createdAt;
      delete ret.updatedAt;
      return ret;
    },
  },
})
export class VisitorDetails {
  @Prop({
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
    },
  })
  visitorId: string;

  @Prop()
  ua: string;

  @Prop()
  ip: string;

  @Prop()
  country: string;

  @Prop()
  city: string;

  @Prop()
  device: string;

  @Prop()
  os: string;

  @Prop()
  browser: string;

  @Prop()
  lat: number;

  @Prop()
  lon: number;

  @Prop({
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },
  })
  agent: string;
}

export const VisitorDetailsSchema =
  SchemaFactory.createForClass(VisitorDetails);
