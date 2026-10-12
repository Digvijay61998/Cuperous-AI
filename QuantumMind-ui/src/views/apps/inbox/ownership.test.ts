import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  ownershipErrorText,
  ownershipView,
  shouldSendTyping,
  typingActive,
  TYPING_CLEAR_MS,
  TYPING_SEND_INTERVAL_MS,
} from './ownership';

const agent = (id: string, name?: string, email?: string) => ({ _id: id, name, email });

describe('ownership matrix (R8.1–R8.3)', () => {
  it('bot: take over shown, no header, composer enabled', () => {
    const v = ownershipView({ handledByAgent: false, meId: 'me' });
    expect(v).toMatchObject({ kind: 'bot', headerText: null, showTakeover: true, showRelease: false, composerDisabledReason: null });
  });

  it('mine: release shown, take over hidden, composer enabled', () => {
    const v = ownershipView({ handledByAgent: true, assignedAgent: agent('me', 'Raj'), meId: 'me' });
    expect(v).toMatchObject({ kind: 'mine', headerText: 'You are handling this chat', showTakeover: false, showRelease: true, composerDisabledReason: null });
  });

  it('other: names the owner, disables composer, hides release', () => {
    const v = ownershipView({ handledByAgent: true, assignedAgent: agent('a2', 'Priya'), meId: 'me' });
    expect(v).toMatchObject({
      kind: 'other',
      headerText: 'Priya is handling this chat',
      showRelease: false,
      showOverride: false,
      composerDisabledReason: 'Priya is handling this chat',
    });
  });

  it('falls back to the email when the owner has no name', () => {
    expect(ownershipView({ handledByAgent: true, assignedAgent: agent('a2', '  ', 'p@x.io'), meId: 'me' }).headerText).toBe(
      'p@x.io is handling this chat',
    );
  });

  it('only org admins see Override, and only on someone else\'s chat', () => {
    expect(ownershipView({ handledByAgent: true, assignedAgent: agent('a2', 'P'), meId: 'me', isOrgAdmin: true }).showOverride).toBe(true);
    expect(ownershipView({ handledByAgent: true, assignedAgent: agent('me', 'P'), meId: 'me', isOrgAdmin: true }).showOverride).toBe(false);
    expect(ownershipView({ handledByAgent: false, meId: 'me', isOrgAdmin: true }).showOverride).toBe(false);
  });

  it('handledByAgent with no owner id is treated as the bot (never a dead composer)', () => {
    expect(ownershipView({ handledByAgent: true, assignedAgent: null, meId: 'me' }).kind).toBe('bot');
  });

  it('property: composer is disabled exactly when someone else owns the chat', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.option(fc.constantFrom('me', 'a2', 'a3'), { nil: null }), fc.boolean(), (handled, owner, admin) => {
        const v = ownershipView({ handledByAgent: handled, assignedAgent: owner ? agent(owner, 'N') : null, meId: 'me', isOrgAdmin: admin });
        const other = handled && !!owner && owner !== 'me';
        expect(!!v.composerDisabledReason).toBe(other);
        expect(v.showRelease).toBe(handled && owner === 'me');
        expect(v.showOverride).toBe(other && admin);
      }),
    );
  });
});

describe('ownership errors (R8.9)', () => {
  it('names the owner for ownership reasons, ignores others', () => {
    expect(ownershipErrorText({ reason: 'not_thread_owner', ownerName: 'Priya' })).toBe('Priya is handling this chat');
    expect(ownershipErrorText({ reason: 'thread_owned_by_other_agent' })).toBe('Another agent is handling this chat');
    expect(ownershipErrorText({ reason: 'ownership_changed', ownerName: 'Priya' })).toMatch(/Priya took this chat first/);
    expect(ownershipErrorText({ reason: 'rate_limited' })).toBeNull();
    expect(ownershipErrorText(undefined)).toBeNull();
  });
});

describe('typing timing (R8.6, R8.7)', () => {
  it('sends at most once per 3 s and clears after 5 s', () => {
    expect(shouldSendTyping(null, 0)).toBe(true);
    expect(shouldSendTyping(0, TYPING_SEND_INTERVAL_MS - 1)).toBe(false);
    expect(shouldSendTyping(0, TYPING_SEND_INTERVAL_MS)).toBe(true);
    expect(typingActive(0, TYPING_CLEAR_MS - 1)).toBe(true);
    expect(typingActive(0, TYPING_CLEAR_MS)).toBe(false);
    expect(typingActive(null, 0)).toBe(false);
  });
});
