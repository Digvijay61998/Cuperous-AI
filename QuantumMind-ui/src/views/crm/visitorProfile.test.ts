import { describe, expect, it } from 'vitest';
import { entryDate, entryKey, outcomeLabel, parseFactInput, profileView } from './visitorProfile';

describe('visitor profile view (R18.8, R18.12)', () => {
  it('shows entries newest first with the date as stored in the org zone', () => {
    const v = profileView({
      facts: { interests: ['lifts'], language: 'en' },
      adminOverrides: { 'facts.interests': ['lifts'] },
      entries: [
        { conversationId: 'c1', at: '2026-10-01T09:00:00+05:30', summary: 'Older', outcome: 'answered' },
        { conversationId: 'c2', at: '2026-10-09T15:35:00+05:30', summary: 'Newer', outcome: 'resolved_by_agent', ticketRef: 'SR_1', ai: false },
      ],
    });
    expect(v.entries.map((e) => e.summary)).toEqual(['Newer', 'Older']);
    expect(v.entries[0]).toMatchObject({ date: '09 Oct 2026, 15:35', outcome: 'Resolved by agent', ticketRef: 'SR_1', ai: false, key: 'c:c2' });
    expect(v.facts.find((f) => f.key === 'facts.interests')).toMatchObject({ values: ['lifts'], overridden: true });
    expect(v.facts.find((f) => f.key === 'facts.language')).toMatchObject({ values: ['en'], overridden: false });
    expect(v.empty).toBe(false);
  });

  it('is an empty view for missing or malformed data, never a crash', () => {
    for (const p of [null, undefined, 'x', { facts: 'no', entries: 'no' }, { entries: [null, { at: 'x' }] }]) {
      expect(profileView(p).empty).toBe(true);
    }
  });

  it('shows the earlier bucket with its range and refs', () => {
    const v = profileView({ entries: [], earlier: { from: '2025-01-02', to: '2025-06-30', summary: 'Older visits', count: 12, incidentRefs: ['SR_A'] } });
    expect(v.earlier).toEqual({ range: '02 Jan 2025 – 30 Jun 2025', summary: 'Older visits', count: 12, refs: ['SR_A'] });
    expect(v.empty).toBe(false);
  });

  it('keys entries like the backend', () => {
    expect(entryKey({ conversationId: 'abc' })).toBe('c:abc');
    expect(entryKey({ at: '2026-01-01', summary: 'x'.repeat(50) })).toBe(`t:2026-01-01|${'x'.repeat(40)}`);
  });

  it('parses comma-separated fact input', () => {
    expect(parseFactInput(' lifts, Lifts ,, doors\nescalators ')).toEqual(['lifts', 'doors', 'escalators']);
    expect(parseFactInput('')).toEqual([]);
    expect(parseFactInput(Array.from({ length: 30 }, (_, i) => `v${i}`).join(','))).toHaveLength(20);
  });

  it('labels outcomes and dates defensively', () => {
    expect(outcomeLabel('follow_up_ticket')).toBe('Follow-up ticket');
    expect(outcomeLabel('some_new_value')).toBe('Some new value');
    expect(outcomeLabel(undefined)).toBe('Not available');
    expect(entryDate('garbage')).toBe('Not available');
    expect(entryDate('2026-13-01')).toBe('Not available');
  });
});
