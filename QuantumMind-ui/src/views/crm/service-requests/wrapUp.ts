/**
 * Wrap-up of a chat (owner request): before an agent closes or releases a
 * conversation, its service request card is filled in (the AI prefills it)
 * and confirmed. Pure helpers for the dialog; the backend checks again.
 */

export type WrapUpMode = 'close' | 'release' | 'save';
export type WrapUpOutcome = 'resolved' | 'open';

export interface WrapUpForm {
  subject: string;
  description: string;
  priority: string;
  emergency: boolean;
  tags: string[];
  outcome: WrapUpOutcome;
  confirmed: boolean;
}

export const WRAP_SUBJECT_MAX = 200;
export const WRAP_DESCRIPTION_MAX = 10000;

/** Closing usually means solved; releasing to the bot or a plain save keeps it open. */
export const defaultOutcome = (mode: WrapUpMode): WrapUpOutcome => (mode === 'close' ? 'resolved' : 'open');

/** The form from the server's draft. Never pre-confirmed: the agent must check it. */
export function formFromDraft(draft: Partial<WrapUpForm> | null | undefined, mode: WrapUpMode): WrapUpForm {
  return {
    subject: (draft?.subject ?? '').slice(0, WRAP_SUBJECT_MAX),
    description: (draft?.description ?? '').slice(0, WRAP_DESCRIPTION_MAX),
    priority: draft?.priority || 'MEDIUM',
    emergency: !!draft?.emergency,
    tags: Array.isArray(draft?.tags) ? draft!.tags : [],
    outcome: defaultOutcome(mode),
    confirmed: false,
  };
}

/** What blocks saving, or null. */
export function wrapUpError(f: WrapUpForm): string | null {
  const subject = f.subject.trim();
  if (!subject) return 'Add a subject.';
  if (subject.length > WRAP_SUBJECT_MAX) return `The subject can have at most ${WRAP_SUBJECT_MAX} characters.`;
  if (f.description.length > WRAP_DESCRIPTION_MAX) return `The description can have at most ${WRAP_DESCRIPTION_MAX} characters.`;
  if (!f.description.trim()) return 'Add what the customer needed and what was done.';
  if (!f.confirmed) return 'Confirm that the details are correct.';
  return null;
}

/** POST body for crm/service-requests/wrap-up. */
export function wrapUpBody(f: WrapUpForm, target: { conversationId?: string | null; threadId?: string | null }) {
  return {
    ...(target.conversationId ? { conversationId: target.conversationId } : {}),
    ...(target.threadId ? { threadId: target.threadId } : {}),
    subject: f.subject.trim(),
    description: f.description.trim(),
    priority: f.priority,
    emergency: f.emergency,
    tags: [...new Set(f.tags.map((t) => t.trim()).filter(Boolean))].slice(0, 20),
    outcome: f.outcome,
    confirmed: f.confirmed,
  };
}

/** Title and main button of the dialog per mode. */
export function wrapUpLabels(mode: WrapUpMode, hasRequest: boolean) {
  const card = hasRequest ? 'Update the service request' : 'Create the service request';
  if (mode === 'close') return { title: `${card} before closing`, action: 'Save and close conversation' };
  if (mode === 'release') return { title: `${card} before releasing`, action: 'Save and release to bot' };
  return { title: card, action: hasRequest ? 'Update request' : 'Create request' };
}
