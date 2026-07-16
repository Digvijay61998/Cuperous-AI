import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { ScrapeStatusEnum } from "../enum/scrape-status.enum";

export type ScraperDocument = Scraper & mongoose.Document;

@Schema({
  virtuals: true,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class Scraper {
  @Prop({
    required: true,
  })
  title: string;

  @Prop({
    required: true,
  })
  url: string;

  @Prop({
    required: true,
  })
  data: string[];

  @Prop({
    default: ScrapeStatusEnum.DRAFT,
  })
  status: string;
}

export const ScraperSchema = SchemaFactory.createForClass(Scraper);
