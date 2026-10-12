import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock('src/helper/Axios', () => ({ default: api }));
vi.mock('react-hot-toast', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import reducer, { fetchSrBoard, moveSr, openSrDetail, setSrFilters, setSrMe, srRealtime } from './index';
import { EMPTY_FILTERS } from 'src/views/crm/service-requests/srFilters';

const stage = (id: string, category = 'OPEN') => ({ id, name: id, color: null, category });
const card = (id: string, stageId: string, boardPosition: number, o: Record<string, any> = {}) => ({
  id,
  ref: `SR_${id}`,
  stageId,
  boardPosition,
  assigneeId: 'u1',
  stage: stage(stageId),
  ...o,
});
const columns = () => [
  { stage: stage('open'), count: 2, hasMore: false, data: [card('a', 'open', 1), card('b', 'open', 2)] },
  { stage: stage('done', 'DONE'), count: 0, hasMore: false, data: [] },
];

const make = () => configureStore({ reducer: { crmServiceRequests: reducer }, middleware: (g) => g({ serializableCheck: false }) });
const ids = (s: any) => s.crmServiceRequests.board.columns.map((c: any) => c.data.map((x: any) => x.id).join(''));

describe('service desk store', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
  });

  it('a slower board answer for older filters never wins', async () => {
    const store = make();
    let first: (v: any) => void = () => undefined;
    api.get.mockReturnValueOnce(new Promise((r) => (first = r)));
    api.get.mockResolvedValueOnce({ data: { columns: columns() } });
    const p1 = store.dispatch(fetchSrBoard({ ...EMPTY_FILTERS, q: 'old' }));
    await store.dispatch(fetchSrBoard({ ...EMPTY_FILTERS }));
    first({ data: { columns: [] } });
    await p1;
    expect(ids(store.getState())).toEqual(['ab', '']);
  });

  it('a move shows at once, keeps the server card, and goes back on failure', async () => {
    const store = make();
    store.dispatch(setSrMe('u1'));
    store.dispatch(setSrFilters({ ...EMPTY_FILTERS, assignee: ['any'] }));
    api.get.mockResolvedValueOnce({ data: { columns: columns() } });
    await store.dispatch(fetchSrBoard(EMPTY_FILTERS));

    api.post.mockResolvedValueOnce({ data: card('a', 'done', 5, { subject: 'saved' }) });
    const ok = store.dispatch(moveSr({ id: 'a', target: { stageId: 'done', index: 0 } }));
    expect(ids(store.getState())).toEqual(['b', 'a']);
    await ok;
    expect(api.post).toHaveBeenCalledWith('crm/service-requests/a/move', { stageId: 'done' });
    expect(store.getState().crmServiceRequests.board.columns![1].data[0]).toMatchObject({ subject: 'saved' });

    api.post.mockRejectedValueOnce(new Error('boom'));
    await store.dispatch(moveSr({ id: 'b', target: { stageId: 'done', index: 1 } }));
    expect(ids(store.getState())).toEqual(['b', 'a']);
    // neighbours sent for a drop between cards
    api.post.mockResolvedValueOnce({ data: card('b', 'done', 6) });
    await store.dispatch(moveSr({ id: 'b', target: { stageId: 'done', index: 0 } }));
    expect(api.post).toHaveBeenLastCalledWith('crm/service-requests/b/move', { stageId: 'done', belowId: 'a' });
  });

  it('your own move out of the filtered view drops the card once saved', async () => {
    const store = make();
    store.dispatch(setSrMe('u1'));
    store.dispatch(setSrFilters({ ...EMPTY_FILTERS, category: ['OPEN'] }));
    api.get.mockResolvedValueOnce({ data: { columns: columns() } });
    await store.dispatch(fetchSrBoard(EMPTY_FILTERS));
    api.post.mockResolvedValueOnce({ data: card('a', 'done', 5, { stage: stage('done', 'DONE') }) });
    await store.dispatch(moveSr({ id: 'a', target: { stageId: 'done', index: 0 } }));
    expect(ids(store.getState())).toEqual(['b', '']);
  });

  it('pushes patch the board with the live filters and refresh an open drawer', async () => {
    const store = make();
    store.dispatch(setSrMe('u1'));
    store.dispatch(setSrFilters({ ...EMPTY_FILTERS, assignee: ['me'] }));
    api.get.mockResolvedValueOnce({ data: { columns: columns() } });
    await store.dispatch(fetchSrBoard(EMPTY_FILTERS));

    // reassigned away from me: leaves the board
    await store.dispatch(srRealtime({ kind: 'assigned', id: 'a', stageId: 'open', data: card('a', 'open', 1, { assigneeId: 'u2' }) as any }));
    expect(ids(store.getState())).toEqual(['b', '']);

    // the open drawer refetches its history and notes
    store.dispatch(openSrDetail('b'));
    api.get.mockResolvedValue({ data: [] });
    await store.dispatch(srRealtime({ kind: 'commented', id: 'b', stageId: 'open', data: card('b', 'open', 2) as any }));
    const urls = api.get.mock.calls.map((c) => c[0]);
    expect(urls).toContain('crm/service-requests/b/comments');
    expect(urls).toContain('crm/service-requests/b/events');

    // deleted while open: the drawer says so
    await store.dispatch(srRealtime({ kind: 'deleted', id: 'b', stageId: null, data: null }));
    expect(store.getState().crmServiceRequests.detail.error).toBe('missing');
    expect(ids(store.getState())).toEqual(['', '']);
  });
});
