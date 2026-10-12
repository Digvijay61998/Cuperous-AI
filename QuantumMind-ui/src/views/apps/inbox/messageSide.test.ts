import { describe, expect, it } from 'vitest';
import { isOrgMessage } from './messageSide';

// Dashboard: visitor LEFT, everything the org sends (bot, AI, flow, agent) RIGHT.
describe('isOrgMessage (dashboard side)', () => {
  const base: any = { id: '1', message: 'x', type: 'text', time: '', historical: false };

  it('senderRole decides, even when direction is missing (legacy widget rows)', () => {
    expect(isOrgMessage({ ...base, senderRole: 'bot' })).toBe(true);
    expect(isOrgMessage({ ...base, senderRole: 'agent' })).toBe(true);
    expect(isOrgMessage({ ...base, senderRole: 'system' })).toBe(true);
    expect(isOrgMessage({ ...base, senderRole: 'visitor' })).toBe(false);
  });

  it('falls back to direction for channel rows', () => {
    expect(isOrgMessage({ ...base, direction: 'outbound' })).toBe(true);
    expect(isOrgMessage({ ...base, direction: 'inbound' })).toBe(false);
  });

  it('my optimistic reply is always on my side', () => {
    expect(isOrgMessage({ ...base, optimistic: true })).toBe(true);
  });
});
