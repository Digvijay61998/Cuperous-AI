import { describe, expect, it } from 'vitest';
import { describeEvent, SrEvent } from './srHistory';

const ev = (type: string, o: Partial<SrEvent> = {}): SrEvent => ({
  id: 'e1',
  type,
  actorId: 'u1',
  actorName: 'Asha',
  createdAt: '2026-10-11T10:00:00Z',
  ...o,
});
const text = (e: SrEvent) => describeEvent(e).text;
const system = { actorId: null, actorName: 'Chat' };

describe('history sentences (R14.4)', () => {
  it('created', () => {
    expect(text(ev('CREATED', { ...system, to: { source: 'chat' } }))).toBe('Raised from the chat');
    expect(text(ev('CREATED', { to: { source: 'dashboard' } }))).toBe('Asha created this request');
  });

  it('stage changes, incl. a deleted stage', () => {
    expect(text(ev('STAGE_CHANGED', { from: { name: 'Open' }, to: { name: 'Resolved' } }))).toBe(
      'Asha moved this from Open to Resolved',
    );
    expect(text(ev('STAGE_CHANGED', { from: { name: 'Triage' }, to: { name: 'Open', reason: 'stage_deleted' } }))).toBe(
      'Moved to Open because "Triage" was deleted',
    );
    expect(text(ev('REOPENED'))).toBe('Asha reopened this request');
  });

  it('assignment: take, assign, unassign', () => {
    expect(text(ev('ASSIGNED', { to: { assigneeId: 'u1', name: 'Asha' } }))).toBe('Asha took this request');
    expect(text(ev('ASSIGNED', { to: { assigneeId: 'u2', name: 'Ravi' } }))).toBe('Asha assigned this to Ravi');
    expect(text(ev('ASSIGNED', { from: { assigneeId: 'u2', name: 'Ravi' }, to: { assigneeId: null } }))).toBe(
      'Asha unassigned Ravi',
    );
    // written by the system (no actor id)
    expect(text(ev('ASSIGNED', { ...system, to: { assigneeId: 'u2', name: 'Ravi' } }))).toBe('Assigned to Ravi');
  });

  it('priority and edits', () => {
    expect(text(ev('PRIORITY_CHANGED', { from: { priority: 'LOW' }, to: { priority: 'CRITICAL' } }))).toBe(
      'Asha changed priority from Low to Critical',
    );
    expect(text(ev('EDITED', { to: { subject: 'a', emergency: true } }))).toBe('Asha edited the subject, emergency flag');
    expect(text(ev('EDITED', { to: null }))).toBe('Asha edited the details');
  });

  it('contact links', () => {
    expect(text(ev('CONTACT_LINKED', { from: { contactId: null }, to: { contactId: 'c1' } }))).toBe('Asha linked a contact');
    expect(text(ev('CONTACT_LINKED', { from: { contactId: 'c0' }, to: { contactId: 'c1' } }))).toBe(
      'Asha changed the linked contact',
    );
    expect(text(ev('CONTACT_LINKED', { from: { contactId: 'c1' }, to: { contactId: null } }))).toBe(
      'Asha unlinked the contact',
    );
    expect(text(ev('CONTACT_LINKED', { ...system, to: { contactId: 'c1' } }))).toBe('Contact linked from the chat details');
  });

  it('notes, summary, unknown types and missing actor names', () => {
    expect(text(ev('COMMENTED'))).toBe('Asha added a note');
    expect(text(ev('SUMMARY_GENERATED', system))).toBe('AI summary updated');
    expect(text(ev('SOMETHING_NEW'))).toBe('Asha changed this request');
    expect(text(ev('COMMENTED', { actorName: null }))).toBe('Someone added a note');
    expect(text(ev('COMMENTED', { actorId: null, actorName: null }))).toBe('Chat added a note');
  });
});
