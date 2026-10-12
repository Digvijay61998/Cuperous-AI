// Pure merge of server history with live rows (crm-incident-handover R9).
//
// Server rows (from /incidents/.../context or /conversation/:id) carry `_id`
// and, for rows this dashboard sent, the client `chatId`. Live socket rows
// carry `id`. A row is the same message when any of those keys match.

const keysOf = (m: any): string[] =>
  [m?._id, m?.id, m?.chatId].filter((k) => k !== undefined && k !== null && k !== '').map(String);

const timeOf = (m: any): number => {
  const t = new Date(m?.time ?? m?.createdAt ?? NaN).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
};

/**
 * Union of `server` and `live`, oldest first, with no duplicates (R9.8).
 * Server rows win on a key collision (they are the persisted truth). Sort is
 * stable, so equal-time rows keep server-then-live order. Rows without any
 * time go last rather than breaking the order.
 */
export function mergeHistory<S, L>(server: S[] = [], live: L[] = []): (S | L)[] {
  type T = S | L;
  const seen = new Set<string>();
  const out: { row: T; i: number }[] = [];
  let i = 0;
  for (const row of [...(server || []), ...(live || [])] as T[]) {
    const keys = keysOf(row);
    if (keys.length && keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    out.push({ row, i: i++ });
  }
  return out
    .sort((a, b) => {
      const d = timeOf(a.row) - timeOf(b.row);
      if (d !== 0 && Number.isFinite(d)) return d;
      if (!Number.isFinite(timeOf(a.row)) !== !Number.isFinite(timeOf(b.row))) {
        return Number.isFinite(timeOf(a.row)) ? -1 : 1;
      }
      return a.i - b.i;
    })
    .map((x) => x.row);
}
