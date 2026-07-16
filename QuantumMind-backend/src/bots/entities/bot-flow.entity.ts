import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { Bot } from "./bot.entity";

export type BotFlowDocument = BotFlow & mongoose.Document;

@Schema({
  timestamps: true,
})
export class BotFlow {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bot",
  })
  botId: Bot;

  @Prop({
    default: [],
  })
  edges: [];

  @Prop({
    default: [],
  })
  nodes: [];

  @Prop()
  startNode: string;

  @Prop({
    default: [],
  })
  customAttributes: any[];
}

export const BotFlowSchema = SchemaFactory.createForClass(BotFlow);
