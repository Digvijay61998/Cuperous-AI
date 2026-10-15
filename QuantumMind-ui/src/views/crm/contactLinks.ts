// ** Pure helpers for the CRM contact <-> conversation / incident / ticket links.
//
// Kept free of React and Axios so they can be unit tested (see
// contactLinks.test.ts). The components that use them live next to this file.

export type LinkKind = 'conversations' | 'incidents' | 'tickets';

export const LINK_KINDS: LinkKind[] = ['conversations', 'incidents', 'tickets'];

/** Page size of every linked-records list (R3.3). */
export const LINKS_PAGE_SIZE = 50;

/** The inbox channel widget conversations are mirrored into; its thread chatId is the conversation id. */
export const WIDGET_CHANNEL = 'widget';

export interface LinksPage<T = any> {
  data: T[];
  count: number;
}

export const LINK_TITLES: Record<LinkKind, string> = {
  conversations: 'Conversations',
  incidents: 'Incidents',
  tickets: 'Service Requests',
};

export const LINK_EMPTY_TEXT: Record<LinkKind, string> = {
  conversations: 'No conversations yet.',
  incidents: 'No incidents yet.',
  tickets: 'No service requests yet.',
};

const rowKey = (row: any): string | undefined => {
  const id = row?._id ?? row?.id;
  return id === undefined || id === null ? undefined : String(id);
};

/**
 * Append a fetched page to what is already shown.
 *
 * Deduplicated by `_id`: a record created between two page requests shifts
 * every later row down by one, so the next page repeats the previous last row.
 * Order is preserved (the server already sorts newest first).
 */
export function mergeLinkPage<T>(existing: T[], incoming: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of [...existing, ...incoming]) {
    const key = rowKey(row);
    if (key !== undefined) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(row);
  }
  return out;
}

/** True while the server reports more rows than have been loaded. */
export const hasMoreLinks = (loaded: number, count: number): boolean =>
  Number.isFinite(count) && loaded < count;

/** `skip` for the next page: the number of rows already loaded. */
export const nextSkip = (loaded: number): number => Math.max(0, loaded);

/** `2026-10-08 14:05`-style local date and time, or `-` when missing/invalid. */
export const formatDateTime = (value?: string | Date | null): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CHANNEL_LABELS: Record<string, string> = {
  widget: 'Web Chat',
  whatsapp: 'WhatsApp Business',
  'whatsapp-web': 'WhatsApp Web',
  whatsapp_web: 'WhatsApp Web',
  'whatsapp-business': 'WhatsApp Business',
  telegram: 'Telegram',
  instagram: 'Instagram',
  facebook: 'Facebook',
  messenger: 'Facebook',
};

/** Display label for a conversation platform / channel. */
export const channelLabel = (platform?: string | null): string => {
  if (!platform) return '-';
  const known = CHANNEL_LABELS[platform.toLowerCase()];
  if (known) return known;
  return platform.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

/** `OPEN_TICKET` -> `Open Ticket`; empty -> `-`. */
export const statusLabel = (status?: string | null): string => {
  if (!status) return '-';
  return String(status)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/** A Mongo ObjectId hex string: the only shape a conversation id can take. */
export const isConversationId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

const idOf = (value: any): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  const id = value._id ?? value.id;
  return id ? String(id) : undefined;
};

/** The query parameter the agent view (`/apps/chat/active`) reads a conversation id from. */
export const AGENT_VIEW_CONVERSATION_PARAM = 'conversation';

/**
 * Where "open in the agent view" goes for a conversation.
 *
 * The agent view resolves `?conversation=<id>` itself (see
 * `resolveAgentViewTarget`), because only the conversation record knows which
 * inbox thread it belongs to. Returns null when there is no usable id.
 */
export function agentViewHref(conversationId: unknown): string | null {
  const id = idOf(conversationId);
  if (!isConversationId(id)) return null;
  return `/apps/chat/active?${AGENT_VIEW_CONVERSATION_PARAM}=${encodeURIComponent(id)}`;
}

export type AgentViewTarget =
  | { kind: 'thread'; threadId: string }
  | { kind: 'live'; conversationId: string; visitorId?: string }
  | { kind: 'visitor'; visitorId: string }
  | { kind: 'none' };

/**
 * Decide what the agent view opens for a conversation record
 * (`GET /conversation/:id`).
 *
 * 1. The conversation is bound to an inbox thread: open that thread.
 * 2. It is still in progress: open it in the live chat box.
 * 3. Otherwise the visitor page, which lists that visitor's conversations.
 */
export function resolveAgentViewTarget(conversation: any): AgentViewTarget {
  if (!conversation) return { kind: 'none' };
  const conversationId = idOf(conversation);
  const visitorId = idOf(conversation.visitor);
  const threadId = idOf(conversation.channelThread);
  if (threadId) return { kind: 'thread', threadId };
  if (conversationId && conversation.status === 'in_progress') {
    return { kind: 'live', conversationId, visitorId };
  }
  if (visitorId) return { kind: 'visitor', visitorId };
  return { kind: 'none' };
}

/** The request drawer is keyed by the request's id (`_id` / `id`), not its SR reference. */
export function ticketHref(row: any): string | null {
  const id = idOf(row);
  return id ? `/crm/service-requests/${encodeURIComponent(id)}` : null;
}

// ** Agent view header state

export type ConversationContactResponse =
  | { linked: false }
  | { linked: true; unavailable: true }
  | {
      linked: true;
      unavailable: false;
      contact: { id: string; name?: string | null; isAnonymous?: boolean };
    }
  | { queued: true };

export type HeaderState =
  | { kind: 'none' }
  | { kind: 'unavailable' }
  | { kind: 'linked'; id: string; name: string; isAnonymous: boolean };

/** Reduce the endpoint response to what the header renders. Unknown shapes render nothing. */
export function headerStateFrom(res: any): HeaderState {
  if (!res || res.linked !== true) return { kind: 'none' };
  if (res.unavailable) return { kind: 'unavailable' };
  const id = res.contact?.id;
  if (!id) return { kind: 'none' };
  const isAnonymous = !!res.contact?.isAnonymous;
  const name = (res.contact?.name || '').trim() || (isAnonymous ? 'Anonymous' : 'Contact');
  return { kind: 'linked', id: String(id), name, isAnonymous };
}

// ** "Add details" form validation

export interface DetailsInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface DetailsValidation {
  ok: boolean;
  errors: { name?: string; email?: string; phone?: string; form?: string };
  /** Trimmed, with empty fields omitted. Only meaningful when `ok`. */
  payload: DetailsInput;
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^\+?[0-9\s\-().]+$/;

export const isValidEmail = (value: string): boolean =>
  value.length <= 254 && EMAIL_SHAPE.test(value);

/** Digits only, 7 to 15 of them, with common separators and a leading `+` allowed. */
export const isValidPhone = (value: string): boolean => {
  if (!PHONE_CHARS.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

export function validateDetails(input: DetailsInput): DetailsValidation {
  const name = (input.name || '').trim();
  const email = (input.email || '').trim();
  const phone = (input.phone || '').trim();
  const errors: DetailsValidation['errors'] = {};

  if (!name && !email && !phone) {
    errors.form = 'Enter at least one of name, email or phone.';
  }
  if (name.length > 200) errors.name = 'Name is too long.';
  if (email && !isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (phone && !isValidPhone(phone)) errors.phone = 'Enter a phone number with 7 to 15 digits.';

  const payload: DetailsInput = {};
  if (name) payload.name = name;
  if (email) payload.email = email;
  if (phone) payload.phone = phone;

  return { ok: Object.keys(errors).length === 0, errors, payload };
}

/** The server's 400 message (string or string[]) or a fallback. */
export function serverMessage(error: any, fallback = 'Could not save the details.'): string {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) {
    const parts = msg.filter((m) => typeof m === 'string' && m.trim());
    if (parts.length) return parts.join(' ');
  }
  if (typeof msg === 'string' && msg.trim()) return msg;
  return fallback;
}
