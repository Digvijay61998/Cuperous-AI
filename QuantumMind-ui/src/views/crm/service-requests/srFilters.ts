/**
 * Service desk filters ⇄ address bar (crm-plugins-service-desk R12.1, R12.3)
 * and the client-side match used for live updates (R18.2). Pure.
 */

export type SrView = 'board' | 'list';

export interface SrFilters {
  /** 'me' | 'unassigned' | 'any' | user ids */
  assignee: string[];
  stageId: string[];
  category: string[];
  priority: string[];
  emergency: boolean;
  botId: string[];
  channel: string[];
  source: string[];
  tags: string[];
  contactId?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  olderThanHours?: number;
  q?: string;
}

export const EMPTY_FILTERS: SrFilters = {
  assignee: [],
  stageId: [],
  category: [],
  priority: [],
  emergency: false,
  botId: [],
  channel: [],
  source: [],
  tags: [],
};

/** The filter a user lands on (R12.1, D6). */
export const DEFAULT_FILTERS: SrFilters = { ...EMPTY_FILTERS, assignee: ['me'] };

const LIST_KEYS = ['assignee', 'stageId', 'category', 'priority', 'botId', 'channel', 'source', 'tags'] as const;
const TEXT_KEYS = ['contactId', 'createdFrom', 'createdTo', 'updatedFrom', 'updatedTo', 'q'] as const;
/** Query keys that are not filters (view, open drawer, list paging). */
const NON_FILTER_KEYS = new Set(['view', 'srId', 'sort', 'dir', 'page']);

type Query = Record<string, string | string[] | undefined>;

const asList = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v === undefined ? [] : [v])
    .flatMap((x) => String(x).split(','))
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * Filters from the address. An address without any filter key gets the
 * default "Assigned to me" (R12.1); `assignee=any` is how "everyone" is kept.
 */
export function filtersFromQuery(query: Query): SrFilters {
  const keys = Object.keys(query || {}).filter((k) => !NON_FILTER_KEYS.has(k) && query[k] !== undefined);
  if (!keys.length) return { ...DEFAULT_FILTERS, assignee: [...DEFAULT_FILTERS.assignee] };
  const f: SrFilters = { ...EMPTY_FILTERS };
  for (const k of LIST_KEYS) (f as any)[k] = asList(query[k]);
  for (const k of TEXT_KEYS) {
    const v = asList(query[k])[0];
    if (v) (f as any)[k] = v;
  }
  f.emergency = asList(query.emergency)[0] === 'true';
  const age = Number(asList(query.olderThanHours)[0]);
  if (Number.isFinite(age) && age > 0) f.olderThanHours = age;
  return f;
}

/** Filters to address keys; "everyone" is written as assignee=any so the default does not come back. */
export function filtersToQuery(f: SrFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of LIST_KEYS) {
    const v = (f as any)[k] as string[];
    if (v?.length) out[k] = v.join(',');
  }
  if (!f.assignee?.length) out.assignee = 'any';
  for (const k of TEXT_KEYS) {
    const v = (f as any)[k];
    if (v) out[k] = String(v);
  }
  if (f.emergency) out.emergency = 'true';
  if (f.olderThanHours) out.olderThanHours = String(f.olderThanHours);
  return out;
}

/**
 * A day picked in the browser ("2026-10-10") as the instant its local day
 * starts or ends, so "to 10 Oct" includes all of 10 Oct in the user's zone.
 * Anything else (a full timestamp) passes through.
 */
export function dayBoundary(v: string, edge: 'start' | 'end'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return v;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return v;
  if (edge === 'end') d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/** Query string for the API (the backend reads the same keys). */
export function filtersToApiParams(f: SrFilters): Record<string, string> {
  const q = filtersToQuery(f);
  if (q.assignee === 'any') delete q.assignee;
  if (q.createdFrom) q.createdFrom = dayBoundary(q.createdFrom, 'start');
  if (q.updatedFrom) q.updatedFrom = dayBoundary(q.updatedFrom, 'start');
  if (q.createdTo) q.createdTo = dayBoundary(q.createdTo, 'end');
  if (q.updatedTo) q.updatedTo = dayBoundary(q.updatedTo, 'end');
  return q;
}

/** How many filters differ from "nothing" (for the "Filters (3)" badge). */
export function activeFilterCount(f: SrFilters): number {
  let n = 0;
  for (const k of LIST_KEYS) {
    const v = ((f as any)[k] as string[]) || [];
    // "any" assignee is the same as no assignee filter
    if (v.length && !(k === 'assignee' && v.every((x) => x === 'any'))) n++;
  }
  for (const k of TEXT_KEYS) if ((f as any)[k]) n++;
  if (f.emergency) n++;
  if (f.olderThanHours) n++;
  return n;
}

export interface CardLike {
  id: string;
  stageId: string;
  priority?: string;
  emergency?: boolean;
  assigneeId?: string | null;
  botId?: string | null;
  channel?: string | null;
  source?: string;
  tags?: string[];
  contactId?: string | null;
  stage?: { category?: string };
}

/**
 * Does a pushed card belong in the current view? `null` = cannot tell on
 * the client (search, dates, age): keep it if already shown, never add it.
 */
export function matchesFilters(card: CardLike, f: SrFilters, me?: string): boolean | null {
  const a = f.assignee || [];
  if (a.length && !a.includes('any')) {
    const ok = a.some((x) => (x === 'unassigned' ? !card.assigneeId : x === 'me' ? !!me && card.assigneeId === me : card.assigneeId === x));
    if (!ok) return false;
  }
  if (f.stageId.length && !f.stageId.includes(card.stageId)) return false;
  if (f.category.length && !f.category.includes(String(card.stage?.category ?? ''))) return false;
  if (f.priority.length && !f.priority.includes(String(card.priority ?? ''))) return false;
  if (f.emergency && !card.emergency) return false;
  if (f.botId.length && !f.botId.includes(String(card.botId ?? ''))) return false;
  if (f.channel.length && !f.channel.includes(String(card.channel ?? ''))) return false;
  if (f.source.length && !f.source.includes(String(card.source ?? ''))) return false;
  if (f.tags.length && !(card.tags || []).some((t) => f.tags.includes(t))) return false;
  if (f.contactId && card.contactId !== f.contactId) return false;
  if (f.q || f.createdFrom || f.createdTo || f.updatedFrom || f.updatedTo || f.olderThanHours) return null;
  return true;
}

export const CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'widget', label: 'Website chat' },
  { value: 'whatsapp', label: 'WhatsApp Business' },
  { value: 'whatsapp_web', label: 'WhatsApp Web' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'facebook', label: 'Messenger' },
];

export const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'chat', label: 'From chat' },
  { value: 'dashboard', label: 'Added by the team' },
  { value: 'api', label: 'API' },
];

export const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'DONE', label: 'Done' },
];

export const AGE_OPTIONS: { value: number; label: string }[] = [
  { value: 4, label: 'Older than 4 hours' },
  { value: 24, label: 'Older than 1 day' },
  { value: 72, label: 'Older than 3 days' },
  { value: 168, label: 'Older than 1 week' },
];

export const channelLabel = (c?: string | null) => CHANNEL_OPTIONS.find((o) => o.value === c)?.label ?? c ?? '—';

export const priorityColor = (p?: string): 'error' | 'warning' | 'info' | 'secondary' =>
  p === 'CRITICAL' ? 'error' : p === 'HIGH' ? 'warning' : p === 'MEDIUM' ? 'info' : 'secondary';

/** "3h", "2d" — age since creation for cards. */
export function ageLabel(createdAt: string | Date | undefined, now = Date.now()): string {
  if (!createdAt) return '';
  const ms = Math.max(0, now - new Date(createdAt).getTime());
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** The placeholder first name the backend gives an anonymous contact. */
const ANON_FIRST = /^(anonymous( visitor)?|visitor)?$/i;

/**
 * Name shown for a request's contact. An anonymous contact keeps its flag
 * until an email or phone arrives, but once the visitor has told us a name
 * it is shown (it used to say "Anonymous visitor" regardless).
 */
export const contactName = (c?: { firstName?: string; lastName?: string | null; isAnonymous?: boolean } | null) => {
  if (!c) return null;
  const n = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  if (c.isAnonymous) return ANON_FIRST.test((c.firstName || '').trim()) ? 'Anonymous visitor' : n;
  return n || 'Unnamed contact';
};
