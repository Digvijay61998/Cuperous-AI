import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { mergeHistory } from './historyMerge';

const at = (s: number) => new Date(1_700_000_000_000 + s * 1000).toISOString();

describe('mergeHistory (R9.1, R9.8, R9.9)', () => {
  it('orders by time and drops server/live duplicates', () => {
    const server = [
      { _id: 's1', message: 'hi', time: at(1) },
      { _id: 's2', chatId: 'live-2', message: 'door stuck', time: at(2) },
    ];
    const live = [
      { id: 'live-2', value: 'door stuck', time: at(2) }, // same row, echoed live
      { id: 'live-3', value: 'still there?', time: at(3) },
    ];
    expect(mergeHistory(server, live).map((m: any) => m.message ?? m.value)).toEqual(['hi', 'door stuck', 'still there?']);
  });

  it('keeps rows without ids and is stable for equal times', () => {
    const out = mergeHistory([{ message: 'a', time: at(1) }], [{ value: 'b', time: at(1) }]);
    expect(out).toHaveLength(2);
    expect((out[0] as any).message).toBe('a');
  });

  it('puts rows without a time last instead of crashing', () => {
    const out = mergeHistory([{ _id: 'x', message: 'no time' }], [{ id: 'y', value: 'timed', time: at(1) }]);
    expect(out.map((m: any) => m.message ?? m.value)).toEqual(['timed', 'no time']);
  });

  it('property: no duplicates, sorted, nothing lost', () => {
    const row = fc.record({ k: fc.integer({ min: 0, max: 30 }), t: fc.integer({ min: 0, max: 100 }) });
    fc.assert(
      fc.property(fc.array(row, { maxLength: 30 }), fc.array(row, { maxLength: 30 }), (a, b) => {
        const server = a.map((r) => ({ _id: `k${r.k}`, time: at(r.t) }));
        const live = b.map((r) => ({ id: `k${r.k}`, time: at(r.t) }));
        const out = mergeHistory(server, live);
        const keys = out.map((m: any) => m._id ?? m.id);
        expect(new Set(keys).size).toBe(keys.length);
        expect(new Set(keys)).toEqual(new Set([...server.map((s) => s._id), ...live.map((l) => l.id)]));
        const ts = out.map((m: any) => new Date(m.time).getTime());
        expect([...ts].sort((x, y) => x - y)).toEqual(ts);
      }),
    );
  });
});
