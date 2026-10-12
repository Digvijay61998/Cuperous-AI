/**
 * Display helpers for a contact's emails, phones and platform ids
 * (crm-plugins-service-desk R5.2, R21.6). Pure, unit-tested.
 */

export const CAPTURE_SOURCE_LABELS: Record<string, string> = {
  widget_form: 'Chat widget form',
  widget_chat: 'Chat widget',
  template: 'Chat form',
  whatsapp: 'WhatsApp',
  whatsapp_web: 'WhatsApp',
  telegram: 'Telegram',
  facebook: 'Messenger',
  agent: 'Added by an agent',
};

export const IDENTIFIER_KIND_LABELS: Record<string, string> = {
  EMAIL: 'Email',
  PHONE: 'Phone',
  TELEGRAM: 'Telegram ID',
  FACEBOOK: 'Messenger ID',
  WHATSAPP_LID: 'WhatsApp ID (number hidden)',
};

export const IDENTIFIER_KIND_ICONS: Record<string, string> = {
  EMAIL: 'bx:envelope',
  PHONE: 'bx:phone',
  TELEGRAM: 'mdi:telegram',
  FACEBOOK: 'mdi:facebook-messenger',
  WHATSAPP_LID: 'mdi:whatsapp',
};

export const captureSourceLabel = (source?: string | null): string | null =>
  source ? CAPTURE_SOURCE_LABELS[source] ?? source : null;

export interface IdentifierRow {
  key: string;
  kind: string;
  kindLabel: string;
  icon: string;
  value: string;
  /** The contact's Current email / phone (newest given). Platform ids are always current. */
  isCurrent: boolean;
  sourceLabel: string | null;
  lastSeenAt: string | null;
}

const digits = (v?: string | null) => (v || '').replace(/\D/g, '');

/**
 * Rows to show, Current email/phone first, then the rest newest first.
 * Contacts typed by hand have no identifier rows: their email/phone are shown
 * from the record so the list is never empty when details exist.
 */
export function identifierRows(record: {
  email?: string | null;
  phone?: string | null;
  identifiers?: { id: string; kind: string; display: string; source?: string | null; lastSeenAt?: string | null }[];
}): IdentifierRow[] {
  const email = (record.email || '').trim().toLowerCase();
  const phone = digits(record.phone);
  const rows: IdentifierRow[] = (record.identifiers || []).map((i) => {
    const isCurrent =
      i.kind === 'EMAIL'
        ? i.display.trim().toLowerCase() === email
        : i.kind === 'PHONE'
        ? !!phone && digits(i.display) === phone
        : true;
    return {
      key: i.id,
      kind: i.kind,
      kindLabel: IDENTIFIER_KIND_LABELS[i.kind] ?? i.kind,
      icon: IDENTIFIER_KIND_ICONS[i.kind] ?? 'bx:id-card',
      value: i.display,
      isCurrent,
      sourceLabel: captureSourceLabel(i.source),
      lastSeenAt: i.lastSeenAt ?? null,
    };
  });
  const has = (kind: string) => rows.some((r) => r.kind === kind && r.isCurrent);
  if (email && !has('EMAIL')) rows.push(synthetic('EMAIL', record.email as string));
  if (phone && !has('PHONE')) rows.push(synthetic('PHONE', record.phone as string));
  const time = (r: IdentifierRow) => (r.lastSeenAt ? Date.parse(r.lastSeenAt) : 0);
  return rows.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || time(b) - time(a));
}

function synthetic(kind: 'EMAIL' | 'PHONE', value: string): IdentifierRow {
  return {
    key: `current-${kind}`,
    kind,
    kindLabel: IDENTIFIER_KIND_LABELS[kind],
    icon: IDENTIFIER_KIND_ICONS[kind],
    value,
    isCurrent: true,
    sourceLabel: null,
    lastSeenAt: null,
  };
}

/** True when the contact has more than one email or more than one phone. */
export const hasHistory = (rows: IdentifierRow[]) => rows.some((r) => !r.isCurrent);
