import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Agent } from 'http';
import * as mongoose from 'mongoose';
import { TicketActivitiesEnum } from '../enums/ticket-activities.enum';
import { Ticket } from './ticket.entity';

export type TicketActivitiesDocument = TicketActivities & mongoose.Document;

@Schema()
export class TicketActivities {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
  })
  ticket: Ticket;

  @Prop({
    default: '',
  })
  message: string;

  @Prop({
    required: true,
    enum: TicketActivitiesEnum,
  })
  status: TicketActivitiesEnum;

  @Prop()
  date: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Agent.name,
  })
  agent: Agent;
}

export const TicketActivitiesSchema =
  SchemaFactory.createForClass(TicketActivities);
