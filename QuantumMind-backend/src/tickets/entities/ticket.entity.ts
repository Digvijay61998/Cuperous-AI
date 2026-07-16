import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Agent } from "http";
import * as mongoose from "mongoose";

import { Bot } from "src/bots/entities";
import { generateId } from "src/util";
import { Visitor, VisitorDocument } from "src/visitor/entities/visitor.entity";
import { TicketStatusEnum } from "../enums/ticket-status.enum";
import { TicketPriorityEnum } from "../enums/ticket-priority";
import { TicketActivities } from "./ticket-activities.entity";
import { AgentDocument } from "src/agent/entities/agent.entity";

export type TicketDocument = Ticket & mongoose.Document;

@Schema({
  timestamps: true,
})
export class Ticket {
  @Prop({
    default: () => generateId("SR", 6),
  })
  ticketId: string;

  @Prop({
    required: true,
  })
  subject: string;

  @Prop()
  description: string;

  @Prop({
    default: TicketStatusEnum.OPEN,
    enum: TicketStatusEnum,
  })
  status: string;

  @Prop({
    default: TicketPriorityEnum.LOW,
    enum: TicketPriorityEnum,
  })
  priority: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Visitor.name,
  })
  visitor: VisitorDocument;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Bot.name,
    required: true,
  })
  bot: Bot;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Agent.name,
      },
    ],
    default: [],
  })
  agents: string[];

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: TicketActivities.name,
      },
    ],
  })
  activities: TicketActivities[];

  @Prop()
  closedAt: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  })
  conversationId: string;

  @Prop({
    default: [],
  })
  tags: string[];
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// ["Gneral", "HR"]
