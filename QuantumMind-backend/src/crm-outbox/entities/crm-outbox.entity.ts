import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";

export type CrmOutboxDocument = CrmOutbox & mongoose.Document;

export enum CrmOutboxStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  DONE = "done",
  FAILED = "failed",
}

/**
 * A CRM write that could not be applied when it happened (CRM Postgres down,
 * transient Prisma error). Chat must never wait on the CRM, so the write is
 * parked here and replayed by the drain cron (R2.8, R3.9, R10.5).
 *
 * Lives in the platform Mongo, NOT the CRM database, so it is available
 * exactly when the CRM is not.
 */
@Schema({ timestamps: true, collection: "crm_outbox" })
export class CrmOutbox {
  /** Handler key, e.g. "contact.resolve", "activity.create". */
  @Prop({ required: true })
  op: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  payload: Record<string, any>;

  @Prop({ type: String, index: true })
  organizationId?: string;

  /**
   * Optional idempotency key. A second enqueue with the same key while one is
   * still pending is ignored, so a retried capture cannot double-queue.
   */
  @Prop({ type: String })
  dedupeKey?: string;

  @Prop({
    type: String,
    enum: Object.values(CrmOutboxStatus),
    default: CrmOutboxStatus.PENDING,
  })
  status: string;

  /** Attempts made so far (the first, failed, live attempt counts as 1). */
  @Prop({ default: 0 })
  attempts: number;

  @Prop({ type: Date, required: true })
  nextAt: Date;

  @Prop()
  lastError?: string;

  /** Lease expiry while PROCESSING; a crashed worker's item is retried. */
  @Prop()
  leaseUntil?: Date;

  /**
   * Set when the item reaches DONE or FAILED; Mongo's TTL monitor deletes it
   * then. Payloads can hold contact details, so nothing is kept forever.
   */
  @Prop()
  expireAt?: Date;
}

export const CrmOutboxSchema = SchemaFactory.createForClass(CrmOutbox);

CrmOutboxSchema.index({ status: 1, nextAt: 1 });
CrmOutboxSchema.index({ op: 1, status: 1, nextAt: 1 });
/**
 * One live item per dedupe key. The service unsets `dedupeKey` when an item
 * reaches DONE or FAILED, so the filter only needs `$type` (works on every
 * MongoDB version, unlike `$in` in a partial filter, which needs 6.0+).
 */
CrmOutboxSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } },
);
/** Finished items are deleted at `expireAt` (DONE 7 days, FAILED 30 days). */
CrmOutboxSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
