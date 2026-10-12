import { describe, expect, it } from 'vitest';
import { isTerminal, supportsTerminal, withTerminal } from './terminal';

describe('flow-builder Terminal toggle (6.6)', () => {
  it('is offered on SUCCESS, FAILURE, TIMEOUT and BOT_RESPONSE only', () => {
    for (const t of ['SUCCESS', 'FAILURE', 'TIMEOUT', 'BOT_RESPONSE']) expect(supportsTerminal(t)).toBe(true);
    for (const t of ['WEBHOOK', 'CLOSE_CHAT', 'USER_INPUT', '', null, undefined]) expect(supportsTerminal(t as any)).toBe(false);
  });

  it('reads only a literal true', () => {
    expect(isTerminal({ terminal: true })).toBe(true);
    expect(isTerminal({ terminal: 'true' })).toBe(false);
    expect(isTerminal(undefined)).toBe(false);
  });

  it('keeps every other payload key when saving (the save replaces the payload)', () => {
    expect(withTerminal({ emergency: true, ticketAttributes: ['a'] }, true)).toEqual({
      emergency: true,
      ticketAttributes: ['a'],
      terminal: true,
    });
    expect(withTerminal({ terminal: true, x: 1 }, false)).toEqual({ terminal: false, x: 1 });
    expect(withTerminal(null, true)).toEqual({ terminal: true });
    expect(withTerminal(['bad'], true)).toEqual({ terminal: true });
  });
});
