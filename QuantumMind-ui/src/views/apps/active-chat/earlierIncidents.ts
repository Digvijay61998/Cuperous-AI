// Display rows for earlier incidents (crm-incident-handover R9.4).
// Every missing field shows "Not available"; newest first; duplicates dropped.

export const NOT_AVAILABLE = 'Not available';

const OUTCOME_LABELS: Record<string, string> = {
  resolved_by_agent: 'Resolved by an agent',
  resolved_by_bot: 'Resolved by the bot',
  follow_up_ticket: 'Follow-up by email',
  abandoned: 'Abandoned',
  closed_unresolved: 'Closed, unresolved',
};

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : NOT_AVAILABLE);

export interface EarlierRow {
  id: string;
  openedAt: string;
  problem: string;
  outcome: string;
  summary: string;
  ticketRef: string;
}

export function earlierIncidentRows(items: any[] | null | undefined, locale = 'en-GB'): EarlierRow[] {
  const seen = new Set<string>();
  const rows: { at: number; row: EarlierRow }[] = [];
  for (const i of items || []) {
    const id = i?.id ? String(i.id) : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const at = new Date(i?.openedAt ?? NaN);
    const valid = !Number.isNaN(at.getTime());
    rows.push({
      at: valid ? at.getTime() : 0,
      row: {
        id,
        openedAt: valid
          ? at.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
          : NOT_AVAILABLE,
        problem: text(i?.problem),
        outcome: i?.outcome ? OUTCOME_LABELS[i.outcome] ?? text(i.outcome) : NOT_AVAILABLE,
        summary: text(i?.summary),
        ticketRef: text(i?.ticketRef),
      },
    });
  }
  return rows.sort((a, b) => b.at - a.at).map((r) => r.row);
}

/** Append a page, keeping order and dropping repeats (R9.4 "next 20"). */
export function appendEarlier(existing: any[] = [], page: any[] = []): any[] {
  const ids = new Set(existing.map((e) => String(e?.id)));
  return [...existing, ...page.filter((p) => p?.id && !ids.has(String(p.id)))];
}
