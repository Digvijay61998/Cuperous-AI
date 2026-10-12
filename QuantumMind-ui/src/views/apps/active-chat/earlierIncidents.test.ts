import { describe, expect, it } from 'vitest';
import { appendEarlier, earlierIncidentRows, NOT_AVAILABLE } from './earlierIncidents';

describe('earlier incident rows (R9.4)', () => {
  it('shows "Not available" for every missing field', () => {
    const [r] = earlierIncidentRows([{ id: 'i1' }]);
    expect(r).toEqual({
      id: 'i1',
      openedAt: NOT_AVAILABLE,
      problem: NOT_AVAILABLE,
      outcome: NOT_AVAILABLE,
      summary: NOT_AVAILABLE,
      ticketRef: NOT_AVAILABLE,
    });
  });

  it('sorts newest first, labels outcomes and drops duplicates', () => {
    const rows = earlierIncidentRows([
      { id: 'a', openedAt: '2026-01-02T10:00:00Z', outcome: 'resolved_by_agent', problem: 'Door', summary: 'Fixed', ticketRef: 'SR1' },
      { id: 'b', openedAt: '2026-03-02T10:00:00Z', outcome: 'abandoned' },
      { id: 'a', openedAt: '2026-01-02T10:00:00Z' },
    ]);
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
    expect(rows[1]).toMatchObject({ outcome: 'Resolved by an agent', summary: 'Fixed', ticketRef: 'SR1' });
  });

  it('appends the next page without repeats', () => {
    expect(appendEarlier([{ id: 'a' }], [{ id: 'a' }, { id: 'b' }]).map((x) => x.id)).toEqual(['a', 'b']);
  });
});
