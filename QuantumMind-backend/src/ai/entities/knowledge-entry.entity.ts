import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

export type KnowledgeEntryDocument = KnowledgeEntry & mongoose.Document;

/**
 * A manually-added knowledge item for a client (product info, FAQ, policies).
 * The actual text lives in the AI service's vector store keyed by (clientId,
 * source); this record is the manageable index shown in dashboards.
 */
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
})
export class KnowledgeEntry {
  @Prop({ required: true, index: true })
  clientId: string;

  @Prop()
  botId: string;

  // Logical source key used to update/delete the chunks in the vector store.
  @Prop({ required: true })
  source: string;

  @Prop()
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: "manual" })
  sourceType: string;
}

export const KnowledgeEntrySchema = SchemaFactory.createForClass(KnowledgeEntry);
