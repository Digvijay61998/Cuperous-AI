import { describe, expect, it } from 'vitest';
import { captureSourceLabel, hasHistory, identifierRows } from './contactIdentifiers';

describe('contact identifiers (crm-plugins-service-desk R21.6)', () => {
  it('marks the Current email and phone, older ones after, newest first', () => {
    const rows = identifierRows({
      email: 'new@x.com',
      phone: '+919876543210',
      identifiers: [
        { id: '1', kind: 'EMAIL', display: 'old@x.com', source: 'widget_form', lastSeenAt: '2026-10-01T00:00:00Z' },
        { id: '2', kind: 'EMAIL', display: 'new@x.com', source: 'widget_chat', lastSeenAt: '2026-10-10T00:00:00Z' },
        { id: '3', kind: 'PHONE', display: '+919876543210', source: 'whatsapp', lastSeenAt: '2026-10-05T00:00:00Z' },
        { id: '4', kind: 'TELEGRAM', display: '777', source: 'telegram', lastSeenAt: '2026-09-01T00:00:00Z' },
      ],
    });
    expect(rows.map((r) => [r.value, r.isCurrent])).toEqual([
      ['new@x.com', true],
      ['+919876543210', true],
      ['777', true],
      ['old@x.com', false],
    ]);
    expect(rows.find((r) => r.kind === 'TELEGRAM')?.kindLabel).toBe('Telegram ID');
    expect(hasHistory(rows)).toBe(true);
  });

  it('a contact typed by hand (no identifier rows) still shows its email and phone', () => {
    const rows = identifierRows({ email: 'a@b.co', phone: '555 0001', identifiers: [] });
    expect(rows.map((r) => [r.kind, r.value, r.isCurrent])).toEqual([
      ['EMAIL', 'a@b.co', true],
      ['PHONE', '555 0001', true],
    ]);
    expect(hasHistory(rows)).toBe(false);
  });

  it('matches phones by digits, emails case-insensitively', () => {
    const rows = identifierRows({
      email: 'Raj@X.com',
      phone: '+91 98765 43210',
      identifiers: [
        { id: '1', kind: 'EMAIL', display: 'raj@x.com' },
        { id: '2', kind: 'PHONE', display: '+919876543210' },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.isCurrent)).toBe(true);
  });

  it('labels capture sources and passes unknown ones through', () => {
    expect(captureSourceLabel('widget_form')).toBe('Chat widget form');
    expect(captureSourceLabel('telegram')).toBe('Telegram');
    expect(captureSourceLabel('x')).toBe('x');
    expect(captureSourceLabel(null)).toBeNull();
  });
});
