import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {
  IncidentOutcomeEnum,
  IncidentStatusEnum,
  OPEN_INCIDENT_STATUSES,
  ProblemFlagEnum,
} from "../enums/incident.enum";

export type IncidentDocument = Incident & mongoose.Document;

/**
 * One case where a visitor needs human help (crm-incident-handover, design §1).
 * Lives in Mongo next to Conversation so state changes are single-document
 * conditional updates (single closure, R10.7).
 */
@Schema({ timestamps: true, collection: "incidents" })
export class Incident {
  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true })
  organizationId?: any;

  @Prop({ type: String, required: true, index: true })
  botId: string;

  @Prop({ type: String, required: true })
  conversationId: string;

  @Prop({ type: String })
  threadId?: string;

  @Prop({ type: String })
  visitorId?: string;

  /** CRM (Postgres) contact cuid. No FK; filled when the resolver links it. */
  @Prop({ type: String, index: true })
  crmContactId?: string;

  @Prop({ type: String, required: true })
  problem: string;

  @Prop({ type: [String], enum: Object.values(ProblemFlagEnum), default: [] })
  problemFlags: string[];

  @Prop({
    type: String,
    enum: Object.values(IncidentStatusEnum),
    default: IncidentStatusEnum.WAITING,
  })
  status: string;

  @Prop({ type: String, enum: Object.values(IncidentOutcomeEnum) })
  outcome?: string;

  /**
   * Service_Request id and its visitor-facing `SR…` ref. A CRM (Postgres)
   * cuid since crm-plugins-service-desk R19.3; Mixed so incidents written
   * before that (a Mongo ObjectId) still read.
   */
  @Prop({ type: mongoose.Schema.Types.Mixed })
  ticketId?: any;

  @Prop({ type: String })
  ticketRef?: string;

  @Prop({ type: String })
  handoverAlertId?: string;

  @Prop({ type: String })
  reason?: string;

  @Prop({ type: Boolean, default: false })
  emergency: boolean;

  /** Handling agent (Owner_Agent once accepted). */
  @Prop({ type: String })
  agentId?: string;

  @Prop() acceptedAt?: Date;
  @Prop() resolvedAt?: Date;
  @Prop() closedAt?: Date;
  @Prop() endCause?: string;

  @Prop({ type: String })
  resolutionNote?: string;

  /** Who closed it (agent id, or "ticket:<userId>" when via the Service Request). */
  @Prop({ type: String })
  resolvedBy?: string;

  /** Last release back to the bot (R10.2); status is left unchanged. */
  @Prop({ type: Object, _id: false })
  lastRelease?: { by?: string; at: Date };

  @Prop({ type: [Object], default: [] })
  ownershipLog: { at: Date; actor?: string; from?: string; to?: string; kind: string }[];

  /** Email delivery state (R19.4, R6.11): ack status is shown on the dashboard. */
  /**
   * Auto-learn from this resolution (R21, R12.9): claimed once, then the
   * outcome. `learned` = new Question Bank entry, `merged` = added to a
   * near-duplicate (R21.3), `failed` = no entry was created.
   */
  @Prop({ type: Object, _id: false })
  knowledge?: {
    status: "generating" | "learned" | "merged" | "failed" | "skipped";
    at: Date;
    questionId?: string;
    error?: string;
  };

  @Prop({ type: Object, _id: false })
  mail?: { ack?: { status: "sending" | "sent" | "failed" | "no_email"; at: Date; error?: string } };
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);

/** At most one open incident per conversation (R4.8, Property 3). */
IncidentSchema.index(
  { conversationId: 1 },
  {
    unique: true,
    name: "one_open_incident_per_conversation",
    partialFilterExpression: { status: { $in: [...OPEN_INCIDENT_STATUSES] } },
  },
);
IncidentSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
IncidentSchema.index({ ticketId: 1 });
