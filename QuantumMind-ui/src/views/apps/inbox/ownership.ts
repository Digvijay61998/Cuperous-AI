// Pure ownership rules for the agent views (crm-incident-handover R8).
// Kept free of React so the matrix is unit-testable (ownership.test.ts).

export interface OwnerRef {
  _id?: string;
  id?: string;
  name?: string | null;
  email?: string | null;
}

export interface OwnershipInput {
  handledByAgent?: boolean;
  assignedAgent?: OwnerRef | string | null;
  /** Signed-in user. */
  meId?: string | null;
  isOrgAdmin?: boolean;
}

export type OwnershipKind = 'bot' | 'mine' | 'other';

export interface OwnershipView {
  kind: OwnershipKind;
  ownerId: string | null;
  ownerName: string | null;
  /** Header line, or null when the bot is handling the chat. */
  headerText: string | null;
  showTakeover: boolean;
  showRelease: boolean;
  showOverride: boolean;
  /** Set when the composer must be disabled; the text explains why. */
  composerDisabledReason: string | null;
}

const idOf = (a: OwnerRef | string | null | undefined): string | null => {
  if (!a) return null;
  if (typeof a === 'string') return a;
  return a._id ? String(a._id) : a.id ? String(a.id) : null;
};

/** Display name, then email, then a neutral fallback (R8.1). */
export const ownerDisplayName = (a: OwnerRef | string | null | undefined): string | null => {
  if (!a) return null;
  if (typeof a === 'string') return 'Another agent';
  return (a.name || '').trim() || (a.email || '').trim() || 'Another agent';
};

/**
 * The ownership matrix (R8.1–R8.3):
 * - bot:   Take over shown, composer enabled (sending takes nothing over).
 * - mine:  "You are handling this chat", Release shown, Take over hidden.
 * - other: "<name> is handling this chat", Take over disabled (shown, so the
 *          state is obvious), Release hidden, composer disabled; admins also
 *          get Override.
 */
export function ownershipView(input: OwnershipInput): OwnershipView {
  const ownerId = input.handledByAgent ? idOf(input.assignedAgent) : null;
  const me = input.meId ? String(input.meId) : null;

  if (!input.handledByAgent || !ownerId) {
    return {
      kind: 'bot',
      ownerId: null,
      ownerName: null,
      headerText: null,
      showTakeover: true,
      showRelease: false,
      showOverride: false,
      composerDisabledReason: null,
    };
  }
  if (me && ownerId === me) {
    return {
      kind: 'mine',
      ownerId,
      ownerName: ownerDisplayName(input.assignedAgent),
      headerText: 'You are handling this chat',
      showTakeover: false,
      showRelease: true,
      showOverride: false,
      composerDisabledReason: null,
    };
  }
  const name = ownerDisplayName(input.assignedAgent);
  return {
    kind: 'other',
    ownerId,
    ownerName: name,
    headerText: `${name} is handling this chat`,
    showTakeover: true,
    showRelease: false,
    showOverride: !!input.isOrgAdmin,
    composerDisabledReason: `${name} is handling this chat`,
  };
}

/** Reasons the server uses for ownership conflicts (R7.1, R7.2). */
export const OWNERSHIP_REASONS = ['thread_owned_by_other_agent', 'not_thread_owner', 'ownership_changed'];

/** Toast text for an ownership rejection, naming the owner (R8.9). */
export function ownershipErrorText(body: any): string | null {
  if (!body || !OWNERSHIP_REASONS.includes(body.reason)) return null;
  const name = (body.ownerName || '').trim();
  if (body.reason === 'ownership_changed') {
    return name ? `${name} took this chat first. Review and try again.` : 'Ownership changed. Review and try again.';
  }
  return name ? `${name} is handling this chat` : 'Another agent is handling this chat';
}

// ----- typing indicator (R8.6, R8.7)

/** Signals are sent at most this often while the owner types. */
export const TYPING_SEND_INTERVAL_MS = 3000;
/** The indicator clears this long after the last signal. */
export const TYPING_CLEAR_MS = 5000;

/** True when a new typing signal may be sent now. */
export const shouldSendTyping = (lastSentAt: number | null, now: number): boolean =>
  lastSentAt == null || now - lastSentAt >= TYPING_SEND_INTERVAL_MS;

/** True while an indicator received at `receivedAt` is still current. */
export const typingActive = (receivedAt: number | null, now: number): boolean =>
  receivedAt != null && now - receivedAt < TYPING_CLEAR_MS;
