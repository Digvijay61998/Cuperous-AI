import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Interval } from "@nestjs/schedule";
import { Model } from "mongoose";
import {
  CRM_OUTBOX_BATCH,
  CRM_OUTBOX_HANDLER_TIMEOUT_MS,
  CRM_OUTBOX_KEEP_DONE_MS,
  CRM_OUTBOX_KEEP_FAILED_MS,
  CRM_OUTBOX_LEASE_MS,
  CRM_OUTBOX_PROVIDER,
  CRM_OUTBOX_RETRY_DELAYS_MS,
  CRM_OUTBOX_TICK_MS,
} from "./constants";
import { CrmOutboxDocument, CrmOutboxStatus } from "./entities/crm-outbox.entity";

export type CrmOutboxHandler = (payload: Record<string, any>) => Promise<void>;

/** Emitted once when an item ends FAILED: `{ op, payload, error }`. */
export const CRM_OUTBOX_FAILED = "crm.outbox.failed";

export interface EnqueueOptions {
  organizationId?: string;
  dedupeKey?: string;
  lastError?: string;
}

/** Payloads are small CRM writes; anything bigger is a bug, not a retry. */
const MAX_PAYLOAD_BYTES = 64 * 1024;

/** Max attempts in total: the live one plus one per retry delay. */
const MAX_ATTEMPTS = CRM_OUTBOX_RETRY_DELAYS_MS.length + 1;

/**
 * Durable retry queue for CRM writes that failed live.
 *
 * Contract: callers try the write first; on failure they `enqueue` and move
 * on. The live attempt counts as attempt 1, so retries follow at about
 * 1, 3 and 10 minutes (R2.8); after the third failed retry the item is marked
 * FAILED and kept 30 days for inspection. Handlers are registered by op name
 * by the feature that owns the write, so this module knows nothing about the
 * CRM.
 *
 * Handlers MUST be idempotent: a worker can die after the write succeeded but
 * before DONE was recorded, and the item is then replayed.
 *
 * Never throws into the caller: the caller is on the visitor's chat path.
 */
@Injectable()
export class CrmOutboxService {
  private readonly logger = new Logger(CrmOutboxService.name);
  private readonly handlers = new Map<string, CrmOutboxHandler>();
  private running = false;
  /** Overridable for tests. */
  handlerTimeoutMs = CRM_OUTBOX_HANDLER_TIMEOUT_MS;

  constructor(
    @Inject(CRM_OUTBOX_PROVIDER)
    private readonly model: Model<CrmOutboxDocument>,
    // Optional: older test harnesses build the service with the model only.
    @Optional() private readonly eventEmitter?: EventEmitter2,
  ) {}

  registerHandler(op: string, handler: CrmOutboxHandler): void {
    if (this.handlers.has(op)) {
      this.logger.warn(`CRM outbox handler for "${op}" registered twice; last one wins`);
    }
    this.handlers.set(op, handler);
  }

  /** Returns true when the item is stored (or already queued under the key). */
  async enqueue(
    op: string,
    payload: Record<string, any>,
    opts: EnqueueOptions = {},
  ): Promise<boolean> {
    try {
      const size = Buffer.byteLength(JSON.stringify(payload ?? {}), "utf8");
      if (size > MAX_PAYLOAD_BYTES) {
        this.logger.error(`CRM outbox payload for ${op} is ${size} bytes; not queued`);
        return false;
      }
      await this.model.create({
        op,
        payload: payload ?? {},
        organizationId: opts.organizationId,
        dedupeKey: opts.dedupeKey || undefined,
        status: CrmOutboxStatus.PENDING,
        attempts: 1,
        nextAt: new Date(Date.now() + CRM_OUTBOX_RETRY_DELAYS_MS[0]),
        lastError: opts.lastError?.slice(0, 500),
      });
      return true;
    } catch (error) {
      if (error?.code === 11000) return true; // already queued under this dedupeKey
      this.logger.error(`CRM outbox enqueue failed for ${op}: ${error?.message}`);
      return false;
    }
  }

  /**
   * Run `fn` now; on failure park it in the outbox under `op`. The handler for
   * `op` must perform the same write from `payload`. Resolves true when the
   * live attempt succeeded.
   */
  async runOrEnqueue(
    op: string,
    payload: Record<string, any>,
    fn: () => Promise<void>,
    opts: Omit<EnqueueOptions, "lastError"> = {},
  ): Promise<boolean> {
    try {
      await fn();
      return true;
    } catch (error) {
      await this.enqueue(op, payload, { ...opts, lastError: error?.message });
      return false;
    }
  }

  @Interval("crm-outbox-drain", CRM_OUTBOX_TICK_MS)
  async drain(now: Date = new Date()): Promise<number> {
    // Called by the scheduler with no args; guard against a non-Date too.
    const at = now instanceof Date ? now : new Date();
    if (this.running) return 0;
    this.running = true;
    let processed = 0;
    try {
      for (let i = 0; i < CRM_OUTBOX_BATCH; i++) {
        const item = await this.lease(at);
        if (!item) break;
        processed++;
        await this.process(item, at);
      }
    } catch (error) {
      this.logger.error(`CRM outbox drain failed: ${error?.message}`);
    } finally {
      this.running = false;
    }
    return processed;
  }

  /**
   * Atomically claim one due item: pending and due, or processing with an
   * expired lease (its worker died). A re-lease counts as an attempt, so an
   * item that crashes the process every time still ends in FAILED.
   */
  private async lease(now: Date): Promise<any | null> {
    const leaseUntil = new Date(now.getTime() + CRM_OUTBOX_LEASE_MS);
    const pending = await this.model
      .findOneAndUpdate(
        { status: CrmOutboxStatus.PENDING, nextAt: { $lte: now } },
        { $set: { status: CrmOutboxStatus.PROCESSING, leaseUntil } },
        { new: true, sort: { nextAt: 1 } },
      )
      .lean();
    if (pending) return pending;

    const stale = await this.model
      .findOneAndUpdate(
        { status: CrmOutboxStatus.PROCESSING, leaseUntil: { $lte: now } },
        { $set: { leaseUntil }, $inc: { attempts: 1 } },
        { new: true, sort: { leaseUntil: 1 } },
      )
      .lean();
    if (stale && stale.attempts > MAX_ATTEMPTS) {
      await this.finish(stale, now, CrmOutboxStatus.FAILED, "worker died while processing");
      this.eventEmitter?.emit(CRM_OUTBOX_FAILED, { op: stale.op, payload: stale.payload ?? {}, error: "worker died while processing" });
      return this.lease(now);
    }
    return stale;
  }

  private async process(item: any, now: Date): Promise<void> {
    const handler = this.handlers.get(item.op);
    if (!handler) {
      // No owner registered (feature off or not deployed yet): wait, don't burn retries.
      await this.model.updateOne(
        { _id: item._id, leaseUntil: item.leaseUntil },
        {
          $set: {
            status: CrmOutboxStatus.PENDING,
            nextAt: new Date(now.getTime() + CRM_OUTBOX_RETRY_DELAYS_MS[0]),
            lastError: `no handler registered for ${item.op}`,
          },
          $unset: { leaseUntil: "" },
        },
      );
      return;
    }

    try {
      await withTimeout(handler(item.payload ?? {}), this.handlerTimeoutMs);
      await this.finish(item, now, CrmOutboxStatus.DONE);
    } catch (error) {
      const message = String(error?.message ?? error);
      const attempts = (item.attempts ?? 1) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await this.finish({ ...item, attempts }, now, CrmOutboxStatus.FAILED, message);
        this.logger.warn(`CRM outbox item ${item._id} (${item.op}) failed permanently: ${message}`);
        // Lets the owner of the op show the failure (e.g. R12.8 ingestion).
        this.eventEmitter?.emit(CRM_OUTBOX_FAILED, { op: item.op, payload: item.payload ?? {}, error: message });
        return;
      }
      await this.model.updateOne(
        // Guard on our own lease: if it expired and another worker took the
        // item, that worker owns it now and we must not overwrite its state.
        { _id: item._id, leaseUntil: item.leaseUntil },
        {
          $set: {
            attempts,
            status: CrmOutboxStatus.PENDING,
            nextAt: new Date(now.getTime() + CRM_OUTBOX_RETRY_DELAYS_MS[attempts - 1]),
            lastError: message.slice(0, 500),
          },
          $unset: { leaseUntil: "" },
        },
      );
    }
  }

  /** Terminal state: free the dedupe key and schedule TTL deletion. */
  private async finish(
    item: any,
    now: Date,
    status: CrmOutboxStatus.DONE | CrmOutboxStatus.FAILED,
    lastError?: string,
  ): Promise<void> {
    const keep = status === CrmOutboxStatus.DONE ? CRM_OUTBOX_KEEP_DONE_MS : CRM_OUTBOX_KEEP_FAILED_MS;
    await this.model.updateOne(
      { _id: item._id, leaseUntil: item.leaseUntil },
      {
        $set: {
          status,
          attempts: item.attempts,
          expireAt: new Date(now.getTime() + keep),
          ...(lastError ? { lastError: lastError.slice(0, 500) } : {}),
        },
        $unset: { leaseUntil: "", dedupeKey: "" },
      },
    );
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`handler timed out after ${ms} ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}
