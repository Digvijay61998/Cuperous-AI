import { describe, expect, it } from 'vitest';
import { defaultOutcome, formFromDraft, wrapUpBody, wrapUpError, wrapUpLabels } from './wrapUp';

describe('chat wrap-up form', () => {
  it('closing defaults to resolved, release and save keep it open', () => {
    expect(defaultOutcome('close')).toBe('resolved');
    expect(defaultOutcome('release')).toBe('open');
    expect(defaultOutcome('save')).toBe('open');
  });

  it('the AI draft is never pre-confirmed', () => {
    const f = formFromDraft({ subject: 'Lift noise', description: 'Grinding noise', priority: 'HIGH', confirmed: true } as any, 'close');
    expect(f).toMatchObject({ subject: 'Lift noise', priority: 'HIGH', outcome: 'resolved', confirmed: false });
    expect(formFromDraft(null, 'save')).toMatchObject({ subject: '', priority: 'MEDIUM', tags: [], emergency: false });
  });

  it('subject, description and the confirmation are required', () => {
    const ok = { ...formFromDraft({ subject: 'S', description: 'D' }, 'close'), confirmed: true };
    expect(wrapUpError(ok)).toBeNull();
    expect(wrapUpError({ ...ok, subject: '  ' })).toMatch(/subject/);
    expect(wrapUpError({ ...ok, description: ' ' })).toMatch(/customer needed/);
    expect(wrapUpError({ ...ok, confirmed: false })).toMatch(/Confirm/);
    expect(wrapUpError({ ...ok, subject: 'x'.repeat(201) })).toMatch(/200/);
  });

  it('sends trimmed values, unique tags and the chat it belongs to', () => {
    const f = { ...formFromDraft({ subject: ' S ', description: ' D ', tags: ['a', ' a', 'b', ''] }, 'release'), confirmed: true };
    expect(wrapUpBody(f, { threadId: 't1' })).toEqual({
      threadId: 't1',
      subject: 'S',
      description: 'D',
      priority: 'MEDIUM',
      emergency: false,
      tags: ['a', 'b'],
      outcome: 'open',
      confirmed: true,
    });
    expect(wrapUpBody(f, { conversationId: 'c1', threadId: null })).toMatchObject({ conversationId: 'c1' });
  });

  it('labels say update when the chat already has a request', () => {
    expect(wrapUpLabels('close', true)).toEqual({
      title: 'Update the service request before closing',
      action: 'Save and close conversation',
    });
    expect(wrapUpLabels('save', false).action).toBe('Create request');
  });
});
