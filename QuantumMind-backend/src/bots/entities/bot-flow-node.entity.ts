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
  // ** Open Template node (Phase 2) **
  templateId?: string;
  /** Overrides the template's own hostedUrl for this node only. */
  templateUrl?: string;
  buttonText?: string;
  buttonIcon?: string;
  variableMappings?: TemplateVariableMapping[];
  callbackEvent?: string;
  timeoutMinutes?: number;
  sessionExpiryMinutes?: number;
  analyticsEnabled?: boolean;
  // ** AI Response node **
  // Knowledge-base tenant to query. Multiple bots of the same company can share
  // one clientId so they all answer from the same ingested data. Falls back to
  // the bot's own id when not set.
  clientId?: string;
  companyName?: string;
  // ** Transfer To Agent node **
  /** Agent group routing ("within" | "another"), set by the flow builder. */
  group?: string;
  /** Transfers from this node raise a high-priority (emergency) agent alert. */
  emergency?: boolean;
  /**
   * Marks the node as a Terminal_Outcome: after it runs, the bot sends the
   * Closure_Prompt instead of continuing (R14.1). Set by the flow builder.
   */
  terminal?: boolean;
  // ** Ticket node **
  /**
   * Attribute aliases appended under the problem in the Service Request
   * description, in order (R1.1). Default: ticket_summary, ticket_reference.
   */
  ticketAttributes?: string[];
}

export interface TemplateVariableMapping {
  templateKey: string; // config key the template expects
  source: 'attribute' | 'static';
  value: string; // attribute name (when source=attribute) or literal (when static)
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
