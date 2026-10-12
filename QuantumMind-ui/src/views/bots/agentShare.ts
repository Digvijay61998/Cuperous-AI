// Agent-share card (crm-incident-handover R21.5). Pure.

export interface AgentShareRow {
  month: string; // "2026-10"
  conversations: number;
  withAgent: number;
  share: number | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(m: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(m || '');
  const name = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && name ? `${name} ${match[1]}` : m || '';
}

/** "0.8%" with one decimal under 10%, whole numbers above; "No chats" for null. */
export function percent(share: number | null | undefined): string {
  if (share == null || !Number.isFinite(share)) return 'No chats';
  const p = share * 100;
  return `${p < 10 ? p.toFixed(1) : Math.round(p)}%`;
}

export function agentShareView(data: any) {
  const target = typeof data?.target === 'number' ? data.target : 0.01;
  const rows: AgentShareRow[] = (Array.isArray(data?.months) ? data.months : []).filter(
    (r: any) => r && typeof r.month === 'string',
  );
  const latest = rows.length ? rows[rows.length - 1] : null;
  return {
    target,
    targetLabel: percent(target),
    latest,
    onTarget: latest?.share != null ? latest.share <= target : null,
    // Bars scale to the larger of the worst month and twice the target.
    scale: Math.max(target * 2, ...rows.map((r) => r.share ?? 0)),
    rows,
  };
}
