import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {
  AlertPriorityEnum,
  AlertReasonEnum,
  AlertResolutionEnum,
  AlertStatusEnum,
} from "../enums/handover-alert.enum";

export type HandoverAlertDocument = HandoverAlert & mongoose.Document;

/**
 * One persisted Handover_Request alert. The partial unique index below is what
 * guarantees "once per open request" even when several triggers for the same
 * conversation race each other.
 */
@Schema({ timestamps: true, collection: "handover_alerts" })
export class HandoverAlert {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Organization" })
  organizationId: any;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Bot", required: true })
  botId: any;

  @Prop({ type: String, required: true })
  conversationId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "ChannelThread" })
  threadId: any;

  @Prop({ type: String })
  visitorId: string;

  @Prop({ type: String })
  visitorName: string;

  @Prop({ type: String, enum: Object.values(AlertReasonEnum), required: true })
  reason: string;

  @Prop({ type: String })
  handoverReason: string;

  @Prop({
    type: String,
    enum: Object.values(AlertPriorityEnum),
    default: AlertPriorityEnum.NORMAL,
  })
  priority: string;

  @Prop({ type: [String], default: [] })
  recipients: string[];

  @Prop({ default: false })
  agentAssigned: boolean;

  @Prop({ type: String })
  assignedAgentId: string;

  @Prop({
    type: String,
    enum: Object.values(AlertStatusEnum),
    default: AlertStatusEnum.OPEN,
  })
  status: string;

  @Prop({ type: String, enum: Object.values(AlertResolutionEnum) })
  resolution: string;

  @Prop({ type: String })
  ackBy: string;

  @Prop()
  ackAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const HandoverAlertSchema = SchemaFactory.createForClass(HandoverAlert);

/** At most one OPEN alert per conversation (once-per-request + race safety). */
HandoverAlertSchema.index(
  { conversationId: 1 },
  { unique: true, partialFilterExpression: { status: AlertStatusEnum.OPEN } },
);
/** "My open alerts" list. */
HandoverAlertSchema.index({
  recipients: 1,
  status: 1,
  organizationId: 1,
  priority: 1,
  createdAt: 1,
});
HandoverAlertSchema.index({ threadId: 1, status: 1 });
HandoverAlertSchema.index({ botId: 1, status: 1 });
