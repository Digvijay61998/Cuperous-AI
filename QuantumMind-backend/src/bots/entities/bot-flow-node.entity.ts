import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { NodeTypeEnum } from "../enums/node-type.enum";
import * as mongoose from "mongoose";

export type BotFlowNodeDocument = BotFlowNode & mongoose.Document;

export interface BotPayload {
  webhookId?: string;
  segmentId?: string;
  ticketSubject?: string;
  blockId?: string;
  elements?: elements[];
  alias?: string;
  entity?: string;
  attributes?: [];
  eventField?: string;
  secure?: boolean;
}

interface elements {
  actionOnFailure?: string;
  alias?: string;
  entity?: string;
  lifespan?: number;
  prompt?: string;
  secure?: boolean;
}

@Schema()
export class BotFlowNode {
  @Prop({
    required: true,
  })
  id: string;

  @Prop({
    enum: NodeTypeEnum,
    required: true,
  })
  nodeType: string;

  @Prop()
  utterance: [string];

  @Prop()
  next: [string];

  @Prop({
    type: Object,
  })
  payload: BotPayload;

  @Prop()
  keywords: [string];

  @Prop()
  title: string;

  @Prop()
  responses: [];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bot",
  })
  botId: string;
}

export const BotFlowNodeSchema = SchemaFactory.createForClass(BotFlowNode);
BotFlowNodeSchema.index(
  {
    id: 1,
  },
  { unique: true }
);
