/**
 * Board state changes: drops (optimistic), realtime pushes and server
 * results (crm-plugins-service-desk R11.4, R18.2). Pure: each function
 * returns new columns and never mutates its input.
 */
import { CardLike, matchesFilters, SrFilters } from './srFilters';

export interface Column<C extends CardLike = any> {
  stage: { id: string; name: string; color?: string | null; category: string };
  count: number;
  data: C[];
  hasMore: boolean;
}

/** Where a drop lands, as the API wants it: the cards right above and below. */
export interface DropTarget {
  stageId: string;
  /** Index in the target column, counted without the moved card. */
  index: number;
}

export function findCard<C extends CardLike>(cols: Column<C>[], id: string): { col: number; index: number; card: C } | null {
  for (let col = 0; col < cols.length; col++) {
    const index = cols[col].data.findIndex((c) => c.id === id);
    if (index !== -1) return { col, index, card: cols[col].data[index] };
  }
  return null;
}

/** Neighbours of a drop, for POST …/move (aboveId / belowId). */
export function neighbours<C extends CardLike>(cols: Column<C>[], id: string, target: DropTarget) {
  const col = cols.find((c) => c.stage.id === target.stageId);
  const rest = (col?.data || []).filter((c) => c.id !== id);
  const i = Math.max(0, Math.min(target.index, rest.length));
  return { aboveId: rest[i - 1]?.id ?? null, belowId: rest[i]?.id ?? null };
}

/** Optimistic move: take the card out, put it at the target. Counts follow. */
export function moveCard<C extends CardLike>(cols: Column<C>[], id: string, target: DropTarget): Column<C>[] {
  const hit = findCard(cols, id);
  const to = cols.findIndex((c) => c.stage.id === target.stageId);
  if (!hit || to === -1) return cols;
  const next = cols.map((c) => ({ ...c, data: [...c.data] }));
  next[hit.col].data.splice(hit.index, 1);
  const stage = next[to].stage;
  const moved = { ...hit.card, stageId: stage.id, stage: { ...(hit.card.stage || {}), ...stage } } as C;
  const i = Math.max(0, Math.min(target.index, next[to].data.length));
  next[to].data.splice(i, 0, moved);
  if (hit.col !== to) {
    next[hit.col].count = Math.max(0, next[hit.col].count - 1);
    next[to].count += 1;
  }
  return next;
}

/** Replace a card with the server's version, in place (keeps the local order). */
export function replaceCard<C extends CardLike>(cols: Column<C>[], card: C): Column<C>[] {
  const hit = findCard(cols, card.id);
  if (!hit) return cols;
  if (cols[hit.col].stage.id !== card.stageId) {
    return upsertCard(cols, card, { keepOrder: false });
  }
  return cols.map((c, i) => (i === hit.col ? { ...c, data: c.data.map((x) => (x.id === card.id ? { ...x, ...card } : x)) } : c));
}

function upsertCard<C extends CardLike>(cols: Column<C>[], card: C, opts: { keepOrder: boolean }): Column<C>[] {
  const hit = findCard(cols, card.id);
  const to = cols.findIndex((c) => c.stage.id === card.stageId);
  let next = cols.map((c) => ({ ...c, data: [...c.data] }));
  if (hit && (!opts.keepOrder || hit.col !== to)) {
    next[hit.col].data.splice(hit.index, 1);
    next[hit.col].count = Math.max(0, next[hit.col].count - 1);
  }
  if (to === -1) return next;
  if (hit && opts.keepOrder && hit.col === to) {
    next[to].data[hit.index] = { ...next[to].data[hit.index], ...card };
    return next;
  }
  // Insert by board position (the column is ordered by it).
  const pos = (card as any).boardPosition;
  let at = next[to].data.findIndex((x: any) => typeof pos === 'number' && typeof x.boardPosition === 'number' && x.boardPosition > pos);
  if (at === -1) at = typeof pos === 'number' ? next[to].data.length : 0;
  // A column that is not fully loaded must not show a card past its end.
  if (next[to].hasMore && at >= next[to].data.length) {
    next[to].count += 1;
    return next;
  }
  next[to].data.splice(at, 0, card);
  next[to].count += 1;
  return next;
}

/**
 * The DOM index a drop lands on (counted with the dragged card still in its
 * column) as a {@link DropTarget}; `null` when the card would not move.
 */
export function dropTarget<C extends CardLike>(cols: Column<C>[], id: string, stageId: string, domIndex: number): DropTarget | null {
  const hit = findCard(cols, id);
  if (!hit) return null;
  const same = cols[hit.col].stage.id === stageId;
  const index = same && domIndex > hit.index ? domIndex - 1 : domIndex;
  if (same && index === hit.index) return null;
  return { stageId, index: Math.max(0, index) };
}

/**
 * Keyboard move (R11.3): Alt+Left/Right to the neighbouring column at the
 * same height, Alt+Up/Down within the column. `null` at the edges.
 */
export function keyboardTarget<C extends CardLike>(cols: Column<C>[], id: string, key: string): DropTarget | null {
  const hit = findCard(cols, id);
  if (!hit) return null;
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    const index = hit.index + (key === 'ArrowUp' ? -1 : 1);
    if (index < 0 || index >= cols[hit.col].data.length) return null;
    return { stageId: cols[hit.col].stage.id, index };
  }
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const col = cols[hit.col + (key === 'ArrowLeft' ? -1 : 1)];
    if (!col) return null;
    return { stageId: col.stage.id, index: Math.min(hit.index, col.data.length) };
  }
  return null;
}

/** Screen reader text after a move: "SR-1 moved to Done, position 1 of 3." */
export function moveAnnouncement<C extends CardLike & { ref?: string }>(cols: Column<C>[], id: string): string {
  const hit = findCard(cols, id);
  if (!hit) return '';
  const col = cols[hit.col];
  return `${hit.card.ref || 'Request'} moved to ${col.stage.name}, position ${hit.index + 1} of ${col.data.length}.`;
}

export interface RealtimeEvent<C extends CardLike = any> {
  kind: 'created' | 'updated' | 'moved' | 'assigned' | 'commented' | 'deleted';
  id: string;
  stageId: string | null;
  data: C | null;
}

/**
 * A push from another user (R18.2). The card being dragged here is left
 * alone (the drop's own response wins). A card that no longer matches the
 * filters leaves the board; a new one joins only when it clearly matches.
 */
export function applyEvent<C extends CardLike>(
  cols: Column<C>[],
  e: RealtimeEvent<C>,
  ctx: { filters: SrFilters; me?: string; draggingId?: string | null },
): Column<C>[] {
  if (!e?.id || e.id === ctx.draggingId) return cols;
  const hit = findCard(cols, e.id);
  if (e.kind === 'deleted' || !e.data) {
    if (!hit) return cols;
    return cols.map((c, i) => (i === hit.col ? { ...c, count: Math.max(0, c.count - 1), data: c.data.filter((x) => x.id !== e.id) } : c));
  }
  const m = matchesFilters(e.data, ctx.filters, ctx.me);
  if (m === false) {
    if (!hit) return cols;
    return cols.map((c, i) => (i === hit.col ? { ...c, count: Math.max(0, c.count - 1), data: c.data.filter((x) => x.id !== e.id) } : c));
  }
  if (!hit && m === null) return cols;
  // A move from elsewhere goes by its new position; other changes keep the order.
  return upsertCard(cols, e.data, { keepOrder: e.kind !== 'moved' && e.kind !== 'created' });
}
