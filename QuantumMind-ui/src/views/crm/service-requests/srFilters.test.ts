import { describe, expect, it } from 'vitest';
import {
  activeFilterCount,
  ageLabel,
  contactName,
  dayBoundary,
  DEFAULT_FILTERS,
  EMPTY_FILTERS,
  filtersFromQuery,
  filtersToApiParams,
  filtersToQuery,
  matchesFilters,
  SrFilters,
} from './srFilters';

const f = (o: Partial<SrFilters> = {}): SrFilters => ({ ...EMPTY_FILTERS, ...o });

describe('service desk filters ⇄ address (R12.1, R12.3)', () => {
  it('an address without filters means "Assigned to me"', () => {
    expect(filtersFromQuery({})).toEqual(DEFAULT_FILTERS);
    // view / drawer / paging keys are not filters
    expect(filtersFromQuery({ view: 'list', srId: 'x', page: '2', sort: 'ref', dir: 'asc' }).assignee).toEqual(['me']);
  });

  it('assignee=any keeps "everyone" across reloads', () => {
    const q = filtersToQuery(f());
    expect(q).toEqual({ assignee: 'any' });
    expect(filtersFromQuery(q).assignee).toEqual(['any']);
    expect(filtersToApiParams(f({ assignee: ['any'] }))).toEqual({});
    expect(filtersToApiParams(f())).toEqual({});
  });

  it('round-trips every filter', () => {
    const all = f({
      assignee: ['me', 'unassigned', 'u1'],
      stageId: ['s1', 's2'],
      category: ['OPEN'],
      priority: ['HIGH', 'CRITICAL'],
      emergency: true,
      botId: ['b1'],
      channel: ['whatsapp'],
      source: ['chat'],
      tags: ['vip'],
      contactId: 'c1',
      createdFrom: '2026-10-01',
      createdTo: '2026-10-10',
      updatedFrom: '2026-10-02',
      updatedTo: '2026-10-11',
      olderThanHours: 24,
      q: 'SR-AB',
    });
    expect(filtersFromQuery(filtersToQuery(all))).toEqual(all);
    expect(activeFilterCount(all)).toBe(16);
  });

  it('reads comma lists and repeated keys, ignores junk', () => {
    const r = filtersFromQuery({ priority: 'HIGH, LOW,', tags: ['a', 'b,c'], olderThanHours: 'abc', emergency: 'yes' });
    expect(r.priority).toEqual(['HIGH', 'LOW']);
    expect(r.tags).toEqual(['a', 'b', 'c']);
    expect(r.olderThanHours).toBeUndefined();
    expect(r.emergency).toBe(false);
    // any filter key present: no default assignee
    expect(r.assignee).toEqual([]);
    expect(filtersFromQuery({ olderThanHours: '-3' }).olderThanHours).toBeUndefined();
  });

  it('API params send "me" for the server to resolve', () => {
    expect(filtersToApiParams(DEFAULT_FILTERS)).toEqual({ assignee: 'me' });
  });

  it('date filters cover whole local days', () => {
    const p = filtersToApiParams(f({ createdFrom: '2026-10-01', createdTo: '2026-10-10', updatedTo: '2026-10-11T05:00:00Z' }));
    expect(new Date(p.createdFrom).getTime()).toBe(new Date(2026, 9, 1).getTime());
    expect(new Date(p.createdTo).getTime()).toBe(new Date(2026, 9, 10, 23, 59, 59, 999).getTime());
    // a full timestamp passes through
    expect(p.updatedTo).toBe('2026-10-11T05:00:00Z');
    expect(dayBoundary('junk', 'start')).toBe('junk');
  });

  it('counts only active filters', () => {
    expect(activeFilterCount(f())).toBe(0);
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(1);
    expect(activeFilterCount(f({ assignee: ['any'] }))).toBe(0);
  });
});

describe('client-side match for live updates (R18.2)', () => {
  const card = {
    id: 'r1',
    stageId: 's1',
    priority: 'HIGH',
    emergency: false,
    assigneeId: 'u1',
    botId: 'b1',
    channel: 'widget',
    source: 'chat',
    tags: ['vip'],
    contactId: 'c1',
    stage: { category: 'OPEN' },
  };

  it('assignee: me, unassigned, named, any', () => {
    expect(matchesFilters(card, f({ assignee: ['me'] }), 'u1')).toBe(true);
    expect(matchesFilters(card, f({ assignee: ['me'] }), 'u2')).toBe(false);
    expect(matchesFilters(card, f({ assignee: ['me'] }))).toBe(false);
    expect(matchesFilters({ ...card, assigneeId: null }, f({ assignee: ['unassigned'] }))).toBe(true);
    expect(matchesFilters(card, f({ assignee: ['unassigned', 'u1'] }))).toBe(true);
    expect(matchesFilters(card, f({ assignee: ['any'] }))).toBe(true);
  });

  it('every other client-side filter', () => {
    expect(matchesFilters(card, f({ stageId: ['s2'] }))).toBe(false);
    expect(matchesFilters(card, f({ category: ['DONE'] }))).toBe(false);
    expect(matchesFilters(card, f({ priority: ['HIGH'] }))).toBe(true);
    expect(matchesFilters(card, f({ emergency: true }))).toBe(false);
    expect(matchesFilters(card, f({ botId: ['b2'] }))).toBe(false);
    expect(matchesFilters({ ...card, botId: null }, f({ botId: ['b1'] }))).toBe(false);
    expect(matchesFilters(card, f({ channel: ['widget'] }))).toBe(true);
    expect(matchesFilters(card, f({ source: ['dashboard'] }))).toBe(false);
    expect(matchesFilters(card, f({ tags: ['x', 'vip'] }))).toBe(true);
    expect(matchesFilters({ ...card, tags: undefined }, f({ tags: ['vip'] }))).toBe(false);
    expect(matchesFilters(card, f({ contactId: 'c2' }))).toBe(false);
  });

  it('search, dates and age cannot be told on the client', () => {
    expect(matchesFilters(card, f({ q: 'x' }))).toBeNull();
    expect(matchesFilters(card, f({ createdFrom: '2026-01-01' }))).toBeNull();
    expect(matchesFilters(card, f({ olderThanHours: 4 }))).toBeNull();
    // a clear mismatch still wins
    expect(matchesFilters(card, f({ q: 'x', priority: ['LOW'] }))).toBe(false);
  });
});

describe('card labels', () => {
  it('age since creation', () => {
    const now = Date.parse('2026-10-11T12:00:00Z');
    expect(ageLabel(undefined, now)).toBe('');
    expect(ageLabel('2026-10-11T12:00:00Z', now)).toBe('1m');
    expect(ageLabel('2026-10-11T11:15:00Z', now)).toBe('45m');
    expect(ageLabel('2026-10-11T07:00:00Z', now)).toBe('5h');
    expect(ageLabel('2026-10-08T12:00:00Z', now)).toBe('3d');
    // clock skew: a future date is "1m", not negative
    expect(ageLabel('2026-10-11T12:05:00Z', now)).toBe('1m');
  });

  it('contact name', () => {
    expect(contactName(null)).toBeNull();
    expect(contactName({ firstName: 'Asha', lastName: 'Rao' })).toBe('Asha Rao');
    expect(contactName({ firstName: '', lastName: null })).toBe('Unnamed contact');
    expect(contactName({ firstName: 'Visitor', isAnonymous: true })).toBe('Anonymous visitor');
    expect(contactName({ firstName: 'Anonymous visitor', lastName: '#a1b2', isAnonymous: true })).toBe('Anonymous visitor');
    // named in chat, no email/phone yet: still anonymous in the CRM, but shown by name
    expect(contactName({ firstName: 'Raj', lastName: 'Kumar', isAnonymous: true })).toBe('Raj Kumar');
  });
});
