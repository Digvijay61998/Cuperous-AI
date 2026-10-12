/**
 * What happens to a conversation's chat rows once it ends
 * (crm-incident-handover R18.5–R18.7, R18.10, design §8, Property 7).
 * Pure, so every branch is unit-tested without Mongo.
 */
export type PurgeMode = "dry_run" | "live";
export type TranscriptPlan = "purge" | "summarise";

/** Merge runs before the deterministic fallback is used: at end + 3 daily retries. */
export const MAX_MERGE_RUNS = 4;
/** An expired (not closed) conversation is left alone while it is still being used. */
export const EXPIRED_QUIET_MS = 30 * 60_000;

export interface LifecycleFacts {
  platform?: string | null;
  /** Closed (endedAt) or marked completed / expired. */
  ended: boolean;
  /** Only an expiry: the last chat is newer than EXPIRED_QUIET_MS. */
  recentActivity?: boolean;
  /** `profileSummaries` on for the bot. */
  flagOn: boolean;
  state?: string | null;
  mode: PurgeMode;
  openIncident: boolean;
  hasIncident: boolean;
  contactId?: string | null;
  plan?: string | null;
}

export type LifecycleDecision =
  | { action: "skip"; reason: string }
  /** R18.6: the agent still needs the transcript. Re-run on incident.closed. */
  | { action: "keep"; reason: "open_incident" }
  /** R18.7: nobody to summarise for: delete without generating anything. */
  | { action: "purge" }
  /** R18.2–R18.5: merge into the profile, then delete. */
  | { action: "merge" }
  /** Live mode picking up a dry-run decision. */
  | { action: "finish"; plan: TranscriptPlan };

const DONE = new Set(["summarised", "purged"]);

export function decideLifecycle(f: LifecycleFacts): LifecycleDecision {
  // Other channels keep their behaviour (R15.7).
  if (f.platform && f.platform !== "widget") return { action: "skip", reason: "channel" };
  if (!f.flagOn) return { action: "skip", reason: "flag_off" };
  if (!f.ended) return { action: "skip", reason: "not_ended" };
  if (f.state && DONE.has(f.state)) return { action: "skip", reason: "done" };
  if (f.recentActivity) return { action: "skip", reason: "recent_activity" };
  if (f.openIncident) return { action: "keep", reason: "open_incident" };
  if (f.state === "would_purge") {
    if (f.mode !== "live") return { action: "skip", reason: "dry_run_done" };
    return { action: "finish", plan: f.plan === "purge" ? "purge" : "summarise" };
  }
  if (!f.contactId && !f.hasIncident) return { action: "purge" };
  return { action: "merge" };
}

/** Final state written for a plan (R18.5, R18.7, rollout §2). */
export function finalState(plan: TranscriptPlan, mode: PurgeMode): "summarised" | "purged" | "would_purge" {
  if (mode !== "live") return "would_purge";
  return plan === "purge" ? "purged" : "summarised";
}

/** After a failed merge: the fallback is allowed on the last scheduled run. */
export function allowFallbackOn(attemptsSoFar: number): boolean {
  return attemptsSoFar + 1 >= MAX_MERGE_RUNS;
}
