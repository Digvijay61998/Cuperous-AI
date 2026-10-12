import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  decideHandover,
  decideMessage,
  handoverPlayKey,
  MESSAGE_THROTTLE_MS,
  messageKey,
  MessageContext,
  sortAlerts,
  timeKey,
  upgradeKey,
} from './alertPolicy';
import type { HandoverAlert, SoundPrefs } from './types';

const ON: SoundPrefs = { handoverSound: true, messageSound: true };
const OFF: SoundPrefs = { handoverSound: false, messageSound: false };

const alert = (over: Partial<HandoverAlert> = {}): HandoverAlert => ({
  id: 'a1',
  conversationId: 'c1',
  botId: 'b1',
  visitorName: 'V',
  reason: 'flow_transfer',
  priority: 'normal',
  createdAt: '2026-10-07T10:00:00.000Z',
  agentAssigned: false,
  ...over,
});

const ctx = (over: Partial<MessageContext> = {}): MessageContext => ({
  ownedByMe: true,
  isOpenHere: false,
  tabFocused: false,
  atBottom: false,
  seen: new Map(),
  prefs: ON,
  now: 1_000_000,
  ...over,
});

describe('decideHandover', () => {
  it('plays the normal sound once for a new alert', () => {
    expect(decideHandover(alert(), ON, new Set(), new Set())).toEqual({
      sound: 'handover',
      showVisual: true,
      addToIndicator: true,
    });
  });

  it('plays the emergency sound for high priority', () => {
    expect(decideHandover(alert({ priority: 'high', reason: 'emergency' }), ON, new Set(), new Set()).sound).toBe(
      'emergency',
    );
  });

  it('muted: no sound but still shows the visual and indicator', () => {
    expect(decideHandover(alert(), OFF, new Set(), new Set())).toEqual({
      sound: null,
      showVisual: true,
      addToIndicator: true,
    });
  });

  it('repeat of a played/known id: silent, not re-added', () => {
    expect(decideHandover(alert(), ON, new Set(['a1']), new Set(['a1']))).toEqual({
      sound: null,
      showVisual: false,
      addToIndicator: false,
    });
  });

  it('emergency upgrade sounds once more even though the id already played', () => {
    const up = alert({ priority: 'high', reason: 'emergency', updated: true });
    expect(handoverPlayKey(up)).toBe(upgradeKey('a1'));
    expect(decideHandover(up, ON, new Set(['a1']), new Set(['a1']))).toEqual({
      sound: 'emergency',
      showVisual: true,
      addToIndicator: false,
    });
    expect(decideHandover(up, ON, new Set(['a1', upgradeKey('a1')]), new Set(['a1'])).sound).toBeNull();
  });

  it('sortAlerts: high first, then oldest first', () => {
    const list = [
      alert({ id: 'n-new', createdAt: '2026-10-07T12:00:00Z' }),
      alert({ id: 'h-new', priority: 'high', createdAt: '2026-10-07T11:00:00Z' }),
      alert({ id: 'n-old', createdAt: '2026-10-07T09:00:00Z' }),
      alert({ id: 'h-old', priority: 'high', createdAt: '2026-10-07T08:00:00Z' }),
    ];
    expect(sortAlerts(list).map((a) => a.id)).toEqual(['h-old', 'h-new', 'n-old', 'n-new']);
  });
});

describe('decideMessage', () => {
  // Property 4: role silence — anything not a visitor never notifies.
  it('property: non-visitor or unknown roles never notify', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom('bot', 'agent', 'system', undefined, null, '', 'VISITOR', 'outbound'),
          fc.string(),
        ),
        fc.boolean(),
        fc.boolean(),
        (role, owned, msgSound) => {
          if (role === 'visitor') return;
          const d = decideMessage(
            { id: 'm1', senderRole: role },
            ctx({ ownedByMe: owned, prefs: { handoverSound: true, messageSound: msgSound } }),
          );
          expect(d).toBe('none');
        },
      ),
    );
  });

  it('visitor message in a conversation I own plays', () => {
    expect(decideMessage({ id: 'm1', senderRole: 'visitor' }, ctx())).toBe('play');
  });

  it('visitor message in a conversation I do not own is silent', () => {
    expect(decideMessage({ id: 'm1', senderRole: 'visitor' }, ctx({ ownedByMe: false }))).toBe('none');
  });

  it('muted message sound -> visual only', () => {
    expect(
      decideMessage({ id: 'm1', senderRole: 'visitor' }, ctx({ prefs: { handoverSound: true, messageSound: false } })),
    ).toBe('visualOnly');
  });

  it('looking at it (open, focused, at bottom) -> none', () => {
    expect(
      decideMessage(
        { id: 'm1', senderRole: 'visitor' },
        ctx({ isOpenHere: true, tabFocused: true, atBottom: true }),
      ),
    ).toBe('none');
    // Scrolled up or tab unfocused still notifies.
    expect(
      decideMessage({ id: 'm1', senderRole: 'visitor' }, ctx({ isOpenHere: true, tabFocused: true, atBottom: false })),
    ).toBe('play');
  });

  it('dedup: same message on both transports notifies once (id or conv+time)', () => {
    const t = '2026-10-07T10:00:00.000Z';
    const first = { id: 'm1', conversationId: 'c1', time: t, senderRole: 'visitor' };
    const seen = new Map<string, number>();
    expect(decideMessage(first, ctx({ seen }))).toBe('play');
    [messageKey(first), timeKey(first)].forEach((k) => k && seen.set(k, 1_000_000));
    // Twin delivery with the same id.
    expect(decideMessage({ ...first }, ctx({ seen, now: 1_005_000 }))).toBe('none');
    // Twin delivery without an id, matched by conversation + timestamp.
    expect(decideMessage({ conversationId: 'c1', time: t, senderRole: 'visitor' }, ctx({ seen, now: 1_005_000 }))).toBe(
      'none',
    );
  });

  // Property 8: throttle — consecutive sounds on one conversation >= 5s apart.
  it('property: notifications on one conversation are at least 5s apart', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 30_000 }), { minLength: 1, maxLength: 40 }), (offsets) => {
        const times = [...offsets].sort((a, b) => a - b);
        let last: number | undefined;
        const played: number[] = [];
        times.forEach((t, i) => {
          const d = decideMessage(
            { id: `m${i}`, senderRole: 'visitor' },
            ctx({ now: t, lastNotifiedAt: last }),
          );
          if (d === 'play') {
            played.push(t);
            last = t;
          }
        });
        for (let i = 1; i < played.length; i++) {
          expect(played[i] - played[i - 1]).toBeGreaterThanOrEqual(MESSAGE_THROTTLE_MS);
        }
        // The first message always notifies.
        expect(played[0]).toBe(times[0]);
      }),
    );
  });
});
