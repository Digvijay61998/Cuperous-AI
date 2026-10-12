/**
 * Share of conversations that needed an agent, per bot and month
 * (crm-incident-handover R21.5, D2 target 1%). Pure helpers.
 * Months are calendar months in UTC.
 */
export const AGENT_SHARE_TARGET = 0.01;
export const AGENT_SHARE_MAX_MONTHS = 12;

export interface MonthRange {
  month: string; // "2026-10"
  from: Date;
  to: Date; // exclusive
}

/** The last `n` months ending with the month of `now`, oldest first. */
export function lastMonths(n: number, now: Date = new Date()): MonthRange[] {
  const count = Math.min(AGENT_SHARE_MAX_MONTHS, Math.max(1, Math.floor(Number(n) || 1)));
  const out: MonthRange[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
    out.push({ month: `${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}`, from, to });
  }
  return out;
}

/** Null when there were no conversations (no share, not 0%). */
export function share(withAgent: number, total: number): number | null {
  if (!total || total < 0) return null;
  return Math.min(1, Math.max(0, withAgent / total));
}
