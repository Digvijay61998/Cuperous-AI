import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  agentViewHref,
  channelLabel,
  formatDateTime,
  hasMoreLinks,
  headerStateFrom,
  isValidEmail,
  isValidPhone,
  mergeLinkPage,
  nextSkip,
  resolveAgentViewTarget,
  serverMessage,
  statusLabel,
  ticketHref,
  validateDetails,
} from './contactLinks';

const CONV = '64b7f0c2a1b2c3d4e5f60718';

describe('pagination merge', () => {
  it('appends pages in order and drops repeated ids', () => {
    const a = [{ _id: '1' }, { _id: '2' }];
    const b = [{ _id: '2' }, { _id: '3' }];
    expect(mergeLinkPage(a, b).map((r) => r._id)).toEqual(['1', '2', '3']);
  });

  it('never loses or duplicates an id (property)', () => {
    const page = fc.array(fc.record({ _id: fc.stringMatching(/^[a-f0-9]{1,3}$/) }), {
      maxLength: 60,
    });
    fc.assert(
      fc.property(page, page, (a, b) => {
        const merged = mergeLinkPage(a, b);
        const ids = merged.map((r) => r._id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(ids)).toEqual(new Set([...a, ...b].map((r) => r._id)));
        // Existing rows keep their position.
        const firstSeen = Array.from(new Set(a.map((r) => r._id)));
        expect(ids.slice(0, firstSeen.length)).toEqual(firstSeen);
      }),
    );
  });

  it('shows Load more only while fewer rows than count are loaded', () => {
    expect(hasMoreLinks(50, 120)).toBe(true);
    expect(hasMoreLinks(120, 120)).toBe(false);
    expect(hasMoreLinks(0, 0)).toBe(false);
    expect(nextSkip(50)).toBe(50);
    expect(nextSkip(-1)).toBe(0);
  });
});

describe('labels', () => {
  it('formats channels and statuses', () => {
    expect(channelLabel('widget')).toBe('Web Chat');
    expect(channelLabel('whatsapp_web')).toBe('WhatsApp Web');
    expect(channelLabel('whatsapp')).toBe('WhatsApp Business');
    expect(channelLabel('new_channel')).toBe('New Channel');
    expect(channelLabel(undefined)).toBe('-');
    expect(statusLabel('IN_PROGRESS')).toBe('In Progress');
    expect(statusLabel('')).toBe('-');
  });

  it('formats date-times and tolerates bad input', () => {
    expect(formatDateTime(undefined)).toBe('-');
    expect(formatDateTime('not a date')).toBe('-');
    expect(formatDateTime('2026-10-08T08:35:00Z')).toMatch(/2026/);
  });
});

describe('hrefs', () => {
  it('links a conversation to the agent view only with a real id', () => {
    expect(agentViewHref(CONV)).toBe(`/apps/chat/active?conversation=${CONV}`);
    expect(agentViewHref({ _id: CONV })).toBe(`/apps/chat/active?conversation=${CONV}`);
    expect(agentViewHref('abc')).toBeNull();
    expect(agentViewHref(undefined)).toBeNull();
  });

  it('links a request to its drawer by id, not its SR reference', () => {
    expect(ticketHref({ _id: 'x1', ticketId: 'SR-1' })).toBe('/crm/service-requests/x1');
    expect(ticketHref({ id: 'cuid1' })).toBe('/crm/service-requests/cuid1');
    expect(ticketHref({ ticketId: 'SR-1' })).toBeNull();
  });

  it('resolves the agent-view target from a conversation record', () => {
    expect(resolveAgentViewTarget({ _id: CONV, channelThread: 't1' })).toEqual({
      kind: 'thread',
      threadId: 't1',
    });
    expect(
      resolveAgentViewTarget({ _id: CONV, status: 'in_progress', visitor: { _id: 'v1' } }),
    ).toEqual({ kind: 'live', conversationId: CONV, visitorId: 'v1' });
    expect(resolveAgentViewTarget({ _id: CONV, status: 'completed', visitor: 'v1' })).toEqual({
      kind: 'visitor',
      visitorId: 'v1',
    });
    expect(resolveAgentViewTarget(null)).toEqual({ kind: 'none' });
  });
});

describe('agent view header state', () => {
  it('maps every response shape', () => {
    expect(headerStateFrom({ linked: false })).toEqual({ kind: 'none' });
    expect(headerStateFrom({ linked: true, unavailable: true })).toEqual({ kind: 'unavailable' });
    expect(
      headerStateFrom({
        linked: true,
        unavailable: false,
        contact: { id: 'c1', name: 'Sam Lee', isAnonymous: false },
      }),
    ).toEqual({ kind: 'linked', id: 'c1', name: 'Sam Lee', isAnonymous: false });
    expect(
      headerStateFrom({ linked: true, unavailable: false, contact: { id: 'c2', isAnonymous: true } }),
    ).toEqual({ kind: 'linked', id: 'c2', name: 'Anonymous', isAnonymous: true });
  });

  it('renders nothing for unknown shapes', () => {
    expect(headerStateFrom(undefined)).toEqual({ kind: 'none' });
    expect(headerStateFrom({ queued: true })).toEqual({ kind: 'none' });
    expect(headerStateFrom({ linked: true, unavailable: false })).toEqual({ kind: 'none' });
  });
});

describe('add details validation', () => {
  it('requires at least one field', () => {
    const r = validateDetails({ name: ' ', email: '', phone: '' });
    expect(r.ok).toBe(false);
    expect(r.errors.form).toBeTruthy();
  });

  it('accepts one valid field and trims the payload', () => {
    const r = validateDetails({ name: '  Sam  ', email: '', phone: '' });
    expect(r.ok).toBe(true);
    expect(r.payload).toEqual({ name: 'Sam' });
  });

  it('checks email shape and phone digit count', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@c.d')).toBe(false);
    expect(isValidPhone('+1 (555) 010-9999')).toBe(true);
    expect(isValidPhone('123456')).toBe(false);
    expect(isValidPhone('1234567890123456')).toBe(false);
    expect(isValidPhone('12345abc67')).toBe(false);
    expect(validateDetails({ email: 'bad' }).errors.email).toBeTruthy();
    expect(validateDetails({ phone: '12' }).errors.phone).toBeTruthy();
  });

  it('phone is valid exactly when it has 7 to 15 digits (property)', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[0-9]{1,20}$/), (digits) => {
        expect(isValidPhone(digits)).toBe(digits.length >= 7 && digits.length <= 15);
      }),
    );
  });

  it('reads server messages as string or string[]', () => {
    expect(serverMessage({ response: { data: { message: 'Bad email' } } })).toBe('Bad email');
    expect(serverMessage({ response: { data: { message: ['a', 'b'] } } })).toBe('a b');
    expect(serverMessage({})).toBe('Could not save the details.');
  });
});
