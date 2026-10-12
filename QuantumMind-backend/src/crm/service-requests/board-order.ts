/**
 * Card positions inside a board column (crm-plugins-service-desk R11.4).
 * Pure. Positions are floats: a drop between two cards takes the midpoint,
 * so one move writes one row. When the gap gets too small the column is
 * renumbered (rare; done in the same transaction by the caller).
 */

export const MIN_GAP = 1e-6;

/** New position between `before` (above) and `after` (below); either may be missing. */
export function positionBetween(before?: number | null, after?: number | null): number {
  const hasB = typeof before === "number" && Number.isFinite(before);
  const hasA = typeof after === "number" && Number.isFinite(after);
  if (hasB && hasA) return (before! + after!) / 2;
  if (hasB) return before! + 1;
  if (hasA) return after! - 1;
  return 0;
}

/** True when the new position is too close to a neighbour to stay distinct. */
export function needsRenumber(pos: number, before?: number | null, after?: number | null): boolean {
  return (
    (typeof before === "number" && Math.abs(pos - before) < MIN_GAP) ||
    (typeof after === "number" && Math.abs(after - pos) < MIN_GAP)
  );
}

/** Evenly spaced positions for a column in its current order. */
export function renumber(ids: string[]): Map<string, number> {
  return new Map(ids.map((id, i) => [id, i]));
}
