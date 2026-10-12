import { describe, expect, it } from 'vitest';
import {
  applyEvent,
  Column,
  dropTarget,
  findCard,
  keyboardTarget,
  moveAnnouncement,
  moveCard,
  neighbours,
  replaceCard,
} from './boardState';
import { EMPTY_FILTERS, SrFilters } from './srFilters';

const stage = (id: string, category = 'OPEN') => ({ id, name: id.toUpperCase(), color: null, category });
const card = (id: string, stageId: string, boardPosition: number, o: Record<string, any> = {}) => ({
  id,
  stageId,
  boardPosition,
  assigneeId: 'u1',
  priority: 'MEDIUM',
  stage: stage(stageId),
  ...o,
});

const board = (): Column[] => [
  { stage: stage('open'), count: 3, hasMore: false, data: [card('a', 'open', 1), card('b', 'open', 2), card('c', 'open', 3)] },
  { stage: stage('doing', 'IN_PROGRESS'), count: 1, hasMore: false, data: [card('d', 'doing', 1)] },
  { stage: stage('done', 'DONE'), count: 0, hasMore: false, data: [] },
];

const ids = (cols: Column[]) => cols.map((c) => c.data.map((x) => x.id).join(''));
const counts = (cols: Column[]) => cols.map((c) => c.count);
const any: SrFilters = { ...EMPTY_FILTERS, assignee: ['any'] };

describe('board drops (R11.3, R11.4)', () => {
  it('finds a card', () => {
    expect(findCard(board(), 'd')).toMatchObject({ col: 1, index: 0 });
    expect(findCard(board(), 'zz')).toBeNull();
  });

  it('neighbours ignore the moved card itself', () => {
    const cols = board();
    expect(neighbours(cols, 'a', { stageId: 'open', index: 1 })).toEqual({ aboveId: 'b', belowId: 'c' });
    expect(neighbours(cols, 'c', { stageId: 'open', index: 0 })).toEqual({ aboveId: null, belowId: 'a' });
    expect(neighbours(cols, 'a', { stageId: 'doing', index: 5 })).toEqual({ aboveId: 'd', belowId: null });
    expect(neighbours(cols, 'a', { stageId: 'done', index: 0 })).toEqual({ aboveId: null, belowId: null });
    expect(neighbours(cols, 'a', { stageId: 'nope', index: 0 })).toEqual({ aboveId: null, belowId: null });
  });

  it('moves across columns and keeps counts right', () => {
    const before = board();
    const next = moveCard(before, 'b', { stageId: 'doing', index: 0 });
    expect(ids(next)).toEqual(['ac', 'bd', '']);
    expect(counts(next)).toEqual([2, 2, 0]);
    expect(findCard(next, 'b')!.card).toMatchObject({ stageId: 'doing', stage: { category: 'IN_PROGRESS' } });
    // input untouched (rollback restores it)
    expect(ids(before)).toEqual(['abc', 'd', '']);
  });

  it('reorders within a column without touching counts', () => {
    const next = moveCard(board(), 'a', { stageId: 'open', index: 2 });
    expect(ids(next)).toEqual(['bca', 'd', '']);
    expect(counts(next)).toEqual([3, 1, 0]);
  });

  it('unknown card or column is a no-op', () => {
    const cols = board();
    expect(moveCard(cols, 'zz', { stageId: 'open', index: 0 })).toBe(cols);
    expect(moveCard(cols, 'a', { stageId: 'nope', index: 0 })).toBe(cols);
  });

  it('server result replaces the card in place, or relocates it if the stage differs', () => {
    const same = replaceCard(board(), card('b', 'open', 2, { subject: 'new' }) as any);
    expect(ids(same)).toEqual(['abc', 'd', '']);
    expect(findCard(same, 'b')!.card.subject).toBe('new');
    const moved = replaceCard(board(), card('b', 'done', 1) as any);
    expect(ids(moved)).toEqual(['ac', 'd', 'b']);
    expect(counts(moved)).toEqual([2, 1, 1]);
    const cols = board();
    expect(replaceCard(cols, card('zz', 'open', 1) as any)).toBe(cols);
  });
});

describe('drop index and keyboard moves (R11.3)', () => {
  it('converts the DOM index; dropping in place is a no-op', () => {
    const cols = board();
    // 'a' (index 0) dropped below 'b' (DOM slot 2) lands at index 1
    expect(dropTarget(cols, 'a', 'open', 2)).toEqual({ stageId: 'open', index: 1 });
    expect(dropTarget(cols, 'a', 'open', 0)).toBeNull();
    expect(dropTarget(cols, 'a', 'open', 1)).toBeNull();
    expect(dropTarget(cols, 'c', 'open', 0)).toEqual({ stageId: 'open', index: 0 });
    expect(dropTarget(cols, 'a', 'doing', 1)).toEqual({ stageId: 'doing', index: 1 });
    expect(dropTarget(cols, 'zz', 'doing', 0)).toBeNull();
  });

  it('Alt+arrows move within and across columns, edges do nothing', () => {
    const cols = board();
    expect(keyboardTarget(cols, 'b', 'ArrowUp')).toEqual({ stageId: 'open', index: 0 });
    expect(keyboardTarget(cols, 'b', 'ArrowDown')).toEqual({ stageId: 'open', index: 2 });
    expect(keyboardTarget(cols, 'a', 'ArrowUp')).toBeNull();
    expect(keyboardTarget(cols, 'c', 'ArrowDown')).toBeNull();
    expect(keyboardTarget(cols, 'c', 'ArrowRight')).toEqual({ stageId: 'doing', index: 1 });
    expect(keyboardTarget(cols, 'a', 'ArrowLeft')).toBeNull();
    expect(keyboardTarget(cols, 'd', 'ArrowRight')).toEqual({ stageId: 'done', index: 0 });
    expect(keyboardTarget(cols, 'a', 'Enter')).toBeNull();
  });

  it('announces the new place', () => {
    const next = moveCard(board(), 'b', { stageId: 'doing', index: 1 });
    expect(moveAnnouncement(next.map((c) => ({ ...c, data: c.data.map((x) => ({ ...x, ref: `SR-${x.id}` })) })), 'b')).toBe(
      'SR-b moved to DOING, position 2 of 2.',
    );
    expect(moveAnnouncement(next, 'zz')).toBe('');
  });
});

describe('realtime pushes (R18.2)', () => {
  it('leaves the dragged card alone', () => {
    const cols = board();
    const e = { kind: 'moved' as const, id: 'a', stageId: 'done', data: card('a', 'done', 1) };
    expect(applyEvent(cols, e, { filters: any, draggingId: 'a' })).toBe(cols);
    expect(ids(applyEvent(cols, e, { filters: any }))).toEqual(['bc', 'd', 'a']);
  });

  it('a move from elsewhere lands by board position', () => {
    const next = applyEvent(board(), { kind: 'moved', id: 'd', stageId: 'open', data: card('d', 'open', 2.5) }, { filters: any });
    expect(ids(next)).toEqual(['abdc', '', '']);
    expect(counts(next)).toEqual([4, 0, 0]);
  });

  it('an edit keeps the local order', () => {
    const next = applyEvent(board(), { kind: 'updated', id: 'a', stageId: 'open', data: card('a', 'open', 9, { subject: 'x' }) }, { filters: any });
    expect(ids(next)).toEqual(['abc', 'd', '']);
    expect(findCard(next, 'a')!.card.subject).toBe('x');
  });

  it('new request joins only on a clear match', () => {
    const created = { kind: 'created' as const, id: 'n', stageId: 'open', data: card('n', 'open', 0) };
    expect(ids(applyEvent(board(), created, { filters: any }))).toEqual(['nabc', 'd', '']);
    // assigned to someone else while "me" is on
    expect(ids(applyEvent(board(), created, { filters: { ...EMPTY_FILTERS, assignee: ['me'] }, me: 'u2' }))).toEqual(['abc', 'd', '']);
    // search on: cannot tell, not added
    expect(ids(applyEvent(board(), created, { filters: { ...any, q: 'printer' } }))).toEqual(['abc', 'd', '']);
  });

  it('with search on, a shown card is still updated', () => {
    const next = applyEvent(board(), { kind: 'updated', id: 'b', stageId: 'open', data: card('b', 'open', 2, { subject: 's' }) }, { filters: { ...any, q: 'x' } });
    expect(findCard(next, 'b')!.card.subject).toBe('s');
  });

  it('a card that stops matching leaves the board', () => {
    const next = applyEvent(
      board(),
      { kind: 'assigned', id: 'a', stageId: 'open', data: card('a', 'open', 1, { assigneeId: 'u9' }) },
      { filters: { ...EMPTY_FILTERS, assignee: ['me'] }, me: 'u1' },
    );
    expect(ids(next)).toEqual(['bc', 'd', '']);
    expect(counts(next)).toEqual([2, 1, 0]);
  });

  it('deleted removes; unknown deletes and non-matching unknowns are no-ops', () => {
    expect(ids(applyEvent(board(), { kind: 'deleted', id: 'c', stageId: 'open', data: null }, { filters: any }))).toEqual(['ab', 'd', '']);
    const cols = board();
    expect(applyEvent(cols, { kind: 'deleted', id: 'zz', stageId: null, data: null }, { filters: any })).toBe(cols);
    expect(
      applyEvent(cols, { kind: 'updated', id: 'zz', stageId: 'open', data: card('zz', 'open', 1, { priority: 'LOW' }) }, {
        filters: { ...any, priority: ['HIGH'] },
      }),
    ).toBe(cols);
  });

  it('a partly loaded column counts the card but does not show it past its end', () => {
    const cols = board();
    cols[0] = { ...cols[0], hasMore: true, count: 80 };
    const next = applyEvent(cols, { kind: 'moved', id: 'd', stageId: 'open', data: card('d', 'open', 50) }, { filters: any });
    expect(ids(next)).toEqual(['abc', '', '']);
    expect(counts(next)).toEqual([81, 0, 0]);
  });

  it('a card for a stage not on the board leaves its old column', () => {
    const next = applyEvent(board(), { kind: 'moved', id: 'd', stageId: 'archived', data: card('d', 'archived', 1) }, { filters: any });
    expect(ids(next)).toEqual(['abc', '', '']);
    expect(counts(next)).toEqual([3, 0, 0]);
  });
});
