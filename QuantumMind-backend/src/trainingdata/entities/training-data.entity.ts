import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

export type TrainingDataDocument = TrainingData & mongoose.Document;

/**
 * Represents an uploaded training-data file (PDF, DOCX, TXT) that has been
 * processed and ingested into the AI knowledge base (Milvus vector store).
 */
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
})
export class TrainingData {
  @Prop({ required: true, index: true })
  botId: string;

  @Prop()
  userId: string;

  @Prop({ required: true })
  filename: string;

  @Prop()
  originalName: string;

  @Prop()
  mimeType: string;

  @Prop({ default: 0 })
  fileSize: number;

  // The source key used in the AI vector store (for later deletion).
  @Prop({ required: true })
  source: string;

  // Number of text chunks created from this file.
  @Prop({ default: 0 })
  chunksIngested: number;

  // Extracted plain text, kept so the UI can offer a "view" action. Excluded
  // from list queries (see service select) to keep list payloads light.
  @Prop()
  content: string;

  // Which AI nodes reference this file (for the AI node modal file picker).
  @Prop({ type: [String], default: [] })
  nodeIds: string[];

  @Prop({ default: "processing" })
  status: string; // processing | completed | failed

  @Prop()
  error: string;
}

export const TrainingDataSchema = SchemaFactory.createForClass(TrainingData);
TrainingDataSchema.index({ botId: 1, filename: 1 });
