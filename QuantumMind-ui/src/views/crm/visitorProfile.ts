// Visitor_Profile view helpers (crm-incident-handover R18.8, R18.12).
// Pure so they are unit-tested; mirrors QuantumMind-backend/src/profile/profile-schema.ts.

export type FactKey = 'facts.interests' | 'facts.products' | 'facts.preferences' | 'facts.language';

export const FACT_FIELDS: { key: FactKey; label: string; list: boolean }[] = [
  { key: 'facts.interests', label: 'Interests', list: true },
  { key: 'facts.products', label: 'Products / equipment', list: true },
  { key: 'facts.preferences', label: 'Preferences', list: true },
  { key: 'facts.language', label: 'Language', list: false },
];

const OUTCOME_LABELS: Record<string, string> = {
  answered: 'Answered',
  info: 'Information',
  unresolved: 'Unresolved',
  follow_up_ticket: 'Follow-up ticket',
  resolved_by_agent: 'Resolved by agent',
  resolved_by_bot: 'Resolved by bot',
  abandoned: 'Abandoned',
  closed_unresolved: 'Closed unresolved',
  unknown: 'Unknown',
};

export const outcomeLabel = (o?: string | null): string =>
  !o ? 'Not available' : OUTCOME_LABELS[o] ?? o.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Same key the backend's DELETE /entries/:key expects. */
export function entryKey(e: { conversationId?: string; at?: string; summary?: string }): string {
  return e?.conversationId ? `c:${e.conversationId}` : `t:${e?.at}|${(e?.summary || '').slice(0, 40)}`;
}

/** The entry's own local time as written in the org zone (no re-conversion). */
export function entryDate(at?: string | null): string {
  if (!at || typeof at !== 'string') return 'Not available';
  const m = at.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return 'Not available';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[Number(m[2]) - 1];
  if (!month) return 'Not available';
  return `${m[3]} ${month} ${m[1]}${m[4] ? `, ${m[4]}:${m[5]}` : ''}`;
}

/** "a, b ,, c" -> ["a", "b", "c"], deduplicated, at most 20 items of 100 characters. */
export function parseFactInput(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of (text || '').split(/[,\n]/)) {
    const v = raw.replace(/\s+/g, ' ').trim().slice(0, 100);
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
    if (out.length >= 20) break;
  }
  return out;
}

export interface ProfileEntryView {
  key: string;
  date: string;
  summary: string;
  outcome: string;
  tags: string[];
  ticketRef?: string;
  agent?: string;
  problem?: string;
  resolution?: string;
  bot?: string;
  channel?: string;
  ai: boolean;
}

export interface ProfileView {
  empty: boolean;
  facts: { key: FactKey; label: string; values: string[]; overridden: boolean }[];
  openIssues: { text: string; ticketRef?: string; since?: string }[];
  entries: ProfileEntryView[];
  earlier: { range: string; summary: string; count: number; refs: string[] } | null;
}

const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : []);

/** Tolerant: a missing or malformed profile is an empty view, never a crash. */
export function profileView(profile: any): ProfileView {
  const p = profile && typeof profile === 'object' ? profile : {};
  const f = p.facts && typeof p.facts === 'object' ? p.facts : {};
  const o = p.adminOverrides && typeof p.adminOverrides === 'object' ? p.adminOverrides : {};
  const facts = FACT_FIELDS.map(({ key, label, list: isList }) => {
    const name = key.slice('facts.'.length);
    const values = isList ? list(f[name]) : typeof f[name] === 'string' && f[name] ? [f[name]] : [];
    return { key, label, values, overridden: key in o };
  });
  const openIssues = (Array.isArray(f.openIssues) ? f.openIssues : [])
    .filter((i: any) => i && typeof i.text === 'string' && i.text.trim())
    .map((i: any) => ({ text: i.text, ticketRef: i.ticketRef || undefined, since: i.since || undefined }));
  const entries: ProfileEntryView[] = (Array.isArray(p.entries) ? p.entries : [])
    .filter((e: any) => e && typeof e.summary === 'string')
    .sort((a: any, b: any) => (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0))
    .map((e: any) => ({
      key: entryKey(e),
      date: entryDate(e.at),
      summary: e.summary,
      outcome: outcomeLabel(e.outcome),
      tags: list(e.tags),
      ticketRef: e.ticketRef || undefined,
      agent: e.agent || undefined,
      problem: e.problem || undefined,
      resolution: e.resolution || undefined,
      bot: e.bot || undefined,
      channel: e.channel || undefined,
      ai: e.ai !== false,
    }));
  const er = p.earlier && typeof p.earlier === 'object' ? p.earlier : null;
  const earlier =
    er && (er.summary || er.count)
      ? {
          range: [entryDate(er.from), entryDate(er.to)].filter((d) => d !== 'Not available').join(' – ') || 'Earlier',
          summary: typeof er.summary === 'string' ? er.summary : '',
          count: Number(er.count) || 0,
          refs: list(er.incidentRefs),
        }
      : null;
  const empty = !entries.length && !earlier && !openIssues.length && facts.every((x) => !x.values.length);
  return { empty, facts, openIssues, entries, earlier };
}
