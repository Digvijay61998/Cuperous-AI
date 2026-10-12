export const CRM_OUTBOX_PROVIDER = "CRM_OUTBOX_PROVIDER";

/**
 * Delay before each retry, measured from the previous failure. The live
 * attempt is attempt 1, so retries 1/2/3 run ~1, 3 and 10 minutes after the
 * first failure (R2.8: "about 1, 3 and 10 minutes"): 1 + 2 + 7.
 */
export const CRM_OUTBOX_RETRY_DELAYS_MS = [60_000, 120_000, 420_000];

/** Drain cadence and batch size. */
export const CRM_OUTBOX_TICK_MS = 60_000;
export const CRM_OUTBOX_BATCH = 50;

/** A leased item whose worker died is retried after this. */
export const CRM_OUTBOX_LEASE_MS = 5 * 60_000;

/**
 * A handler taking longer than this counts as failed, so one hung CRM call
 * cannot wedge the drain. Kept well under the lease so a slow-but-alive
 * worker never overlaps with a re-lease on another instance.
 */
export const CRM_OUTBOX_HANDLER_TIMEOUT_MS = 30_000;

/** How long finished items are kept for inspection before TTL deletion. */
export const CRM_OUTBOX_KEEP_DONE_MS = 7 * 24 * 3600_000;
export const CRM_OUTBOX_KEEP_FAILED_MS = 30 * 24 * 3600_000;
