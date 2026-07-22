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

  // Tenant this scraped content belongs to. Multiple bots of the same company
  // share one clientId so the ingested data is queryable by all of them.
  @Prop()
  clientId: string;

  @Prop()
  botId: string;

  @Prop()
  companyName: string;

  // Whether this record's content has been pushed into the AI knowledge base.
  @Prop({ default: false })
  aiSynced: boolean;

  @Prop()
  aiSyncedAt: Date;
}

export const ScraperSchema = SchemaFactory.createForClass(Scraper);
