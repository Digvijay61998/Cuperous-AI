/**
 * Visitor_Profile rules (crm-incident-handover R18, design §9, Property 6).
 *
 * Pure. Used to validate what the AI returns before it is written, to build
 * the deterministic fallback entry, to rebase a merge onto a profile that
 * changed meanwhile, and to apply admin edits. Mirrors the AI service's
 * models in QuantumMind-ai/app/schemas.py (keep the field names in sync).
 *
 * Size is measured as `JSON.stringify(profile).length`, the stored form.
 */
import type {
  VisitorProfile,
  VisitorProfileEarlier,
  VisitorProfileEntry,
  VisitorProfileOpenIssue,
} from "src/ai/ai-crm.types";

export type { VisitorProfile, VisitorProfileEntry, VisitorProfileEarlier };

export const PROFILE_MAX_CHARS = 8000;
export const ENTRY_SUMMARY_MAX = 300;
export const ENTRY_TAGS_MAX = 10;
/** Facts plus this many newest entries go to the AI answer prompt (R18.8). */
export const PROFILE_CONTEXT_ENTRIES = 5;
const EARLIER_SUMMARY_MAX = 800;
const FACT_LIST_KEYS = ["interests", "products", "preferences"] as const;
export type FactListKey = (typeof FACT_LIST_KEYS)[number];
/** Admin-editable fact keys (R18.12). */
export const OVERRIDE_KEYS = ["facts.interests", "facts.products", "facts.preferences", "facts.language"] as const;
export type OverrideKey = (typeof OVERRIDE_KEYS)[number];

export class ProfileInvalidError extends Error {}

const str = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : undefined;
};
const strList = (v: unknown, max: number, each = 100): string[] => {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of v) {
    const s = str(x, each);
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
    if (out.length >= max) break;
  }
  return out;
};
const time = (at: string): number => {
  const t = Date.parse(at);
  return Number.isFinite(t) ? t : 0;
};

export const emptyProfile = (): VisitorProfile => ({ v: 1, facts: {}, adminOverrides: {}, entries: [], earlier: null });

/** Stable key for one entry: its conversation, else its time and text. */
export function entryKey(e: Pick<VisitorProfileEntry, "conversationId" | "at" | "summary">): string {
  return e.conversationId ? `c:${e.conversationId}` : `t:${e.at}|${(e.summary || "").slice(0, 40)}`;
}

export function profileSize(p: VisitorProfile | null | undefined): number {
  return p ? JSON.stringify(p).length : 0;
}

function parseEntry(raw: any, strict: boolean): VisitorProfileEntry | null {
  if (!raw || typeof raw !== "object") {
    if (strict) throw new ProfileInvalidError("entry is not an object");
    return null;
  }
  const at = str(raw.at, 40);
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
  if (!at || !Number.isFinite(Date.parse(at))) {
    if (strict) throw new ProfileInvalidError("entry has no valid date");
    return null;
  }
  if (!summary || summary.length > ENTRY_SUMMARY_MAX) {
    if (strict) throw new ProfileInvalidError("entry summary must be 1 to 300 characters");
    if (!summary) return null;
  }
  if (Array.isArray(raw.tags) && raw.tags.length > ENTRY_TAGS_MAX && strict) {
    throw new ProfileInvalidError("entry has more than 10 tags");
  }
  const e: VisitorProfileEntry = { at, summary: summary.slice(0, ENTRY_SUMMARY_MAX) };
  const opt = (k: keyof VisitorProfileEntry, max: number) => {
    const v = str(raw[k], max);
    if (v) (e as any)[k] = v;
  };
  opt("conversationId", 64);
  opt("tz", 64);
  opt("bot", 100);
  opt("channel", 30);
  opt("outcome", 40);
  opt("incidentId", 64);
  opt("ticketRef", 64);
  opt("agent", 100);
  opt("problem", 300);
  opt("resolution", 500);
  const tags = strList(raw.tags, ENTRY_TAGS_MAX, 40);
  if (tags.length) e.tags = tags;
  if (raw.ai === false) e.ai = false;
  else e.ai = true;
  return e;
}

function parseEarlier(raw: any): VisitorProfileEarlier | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    from: str(raw.from, 40),
    to: str(raw.to, 40),
    summary: str(raw.summary, EARLIER_SUMMARY_MAX) ?? "",
    count: Number.isInteger(raw.count) && raw.count > 0 ? raw.count : 0,
    incidentRefs: strList(raw.incidentRefs, 10_000, 64),
    incidentIds: strList(raw.incidentIds, 10_000, 64),
  };
}

function parseIssue(raw: any): VisitorProfileOpenIssue | null {
  const text = str(raw?.text, 300);
  if (!text) return null;
  const i: VisitorProfileOpenIssue = { text };
  for (const k of ["since", "incidentId", "ticketRef"] as const) {
    const v = str(raw?.[k], 64);
    if (v) i[k] = v;
  }
  return i;
}

/**
 * Normalise a stored or returned profile. `strict` (AI output) rejects bad
 * entries; lenient (stored data, admin-edited) drops them. Null for no profile.
 */
export function parseProfile(raw: unknown, opts: { strict?: boolean } = {}): VisitorProfile | null {
  if (raw == null) return null;
  let obj: any = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      if (opts.strict) throw new ProfileInvalidError("profile is not JSON");
      return null;
    }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    if (opts.strict) throw new ProfileInvalidError("profile is not an object");
    return null;
  }
  if (opts.strict && obj.v !== 1) throw new ProfileInvalidError("unknown profile version");
  if (opts.strict && !Array.isArray(obj.entries)) throw new ProfileInvalidError("entries missing");
  const f = obj.facts && typeof obj.facts === "object" ? obj.facts : {};
  const facts: VisitorProfile["facts"] = {};
  for (const k of FACT_LIST_KEYS) {
    const l = strList(f[k], 20);
    if (l.length) facts[k] = l;
  }
  const issues = (Array.isArray(f.openIssues) ? f.openIssues : []).map(parseIssue).filter(Boolean) as VisitorProfileOpenIssue[];
  if (issues.length) facts.openIssues = issues.slice(0, 10);
  const lang = str(f.language, 20);
  if (lang) facts.language = lang;
  const entries = (Array.isArray(obj.entries) ? obj.entries : [])
    .map((e: any) => parseEntry(e, !!opts.strict))
    .filter(Boolean) as VisitorProfileEntry[];
  const overrides = obj.adminOverrides && typeof obj.adminOverrides === "object" && !Array.isArray(obj.adminOverrides)
    ? sanitizeOverrides(obj.adminOverrides)
    : {};
  return {
    v: 1,
    facts,
    adminOverrides: overrides,
    entries: sortEntries(entries),
    earlier: parseEarlier(obj.earlier),
  };
}

function sanitizeOverrides(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of OVERRIDE_KEYS) {
    if (!(k in o)) continue;
    if (k === "facts.language") {
      const v = o[k];
      out[k] = v === null ? null : str(v, 20) ?? null;
    } else {
      out[k] = strList(o[k], 20);
    }
  }
  return out;
}

export function sortEntries(entries: VisitorProfileEntry[]): VisitorProfileEntry[] {
  return [...entries].sort((a, b) => time(b.at) - time(a.at));
}

/** Every incident id and ticket ref the profile still carries (Property 6). */
export function profileRefs(p: VisitorProfile | null | undefined): { tickets: Set<string>; incidents: Set<string> } {
  const tickets = new Set<string>();
  const incidents = new Set<string>();
  for (const e of p?.entries ?? []) {
    if (e.ticketRef) tickets.add(e.ticketRef);
    if (e.incidentId) incidents.add(e.incidentId);
  }
  for (const r of p?.earlier?.incidentRefs ?? []) tickets.add(r);
  for (const r of p?.earlier?.incidentIds ?? []) incidents.add(r);
  return { tickets, incidents };
}

/** Entries ever merged: current entries plus those folded into `earlier`. */
export function entryCount(p: VisitorProfile | null | undefined): number {
  return (p?.entries?.length ?? 0) + (p?.earlier?.count ?? 0);
}

/** Admin corrections win (R18.12). */
export function applyOverrides(p: VisitorProfile): VisitorProfile {
  const o = p.adminOverrides || {};
  const facts = { ...(p.facts || {}) } as any;
  for (const k of OVERRIDE_KEYS) {
    if (!(k in o)) continue;
    const name = k.slice("facts.".length);
    const v = o[k];
    if (name === "language") {
      if (v == null) delete facts.language;
      else facts.language = v;
    } else facts[name] = v;
  }
  return { ...p, facts };
}

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

export type MergeCheck =
  | { ok: true; profile: VisitorProfile }
  | { ok: false; reason: string; tooBig?: boolean };

/**
 * Accept the AI's merged profile only if (R18.2, R18.9, R18.12, Property 6):
 * - it has exactly one entry for this conversation and exactly one more
 *   entry overall (counting entries folded into `earlier`);
 * - every incident id and ticket ref of `prev` is still present;
 * - `adminOverrides` is unchanged and its values are applied;
 * - it is at most 8000 characters (`tooBig` asks for a compress retry).
 */
export function checkMerged(prev: VisitorProfile | null, raw: unknown, conversationId: string): MergeCheck {
  let next: VisitorProfile | null;
  try {
    next = parseProfile(raw, { strict: true });
  } catch (e: any) {
    return { ok: false, reason: e?.message || "invalid profile" };
  }
  if (!next) return { ok: false, reason: "empty profile" };
  const base = prev ?? emptyProfile();
  const mine = next.entries.filter((e) => e.conversationId === conversationId);
  if (mine.length !== 1) return { ok: false, reason: `expected 1 entry for the conversation, got ${mine.length}` };
  if (entryCount(next) !== entryCount(base) + 1) {
    return { ok: false, reason: `entry count ${entryCount(next)} is not ${entryCount(base) + 1}` };
  }
  const before = profileRefs(base);
  const after = profileRefs(next);
  for (const r of before.tickets) if (!after.tickets.has(r)) return { ok: false, reason: `ticket ref ${r} lost` };
  for (const r of before.incidents) if (!after.incidents.has(r)) return { ok: false, reason: `incident ${r} lost` };
  if (!sameJson(next.adminOverrides, base.adminOverrides)) return { ok: false, reason: "admin overrides changed" };
  next = applyOverrides(next);
  if (profileSize(next) > PROFILE_MAX_CHARS) return { ok: false, reason: "profile is over 8000 characters", tooBig: true };
  return { ok: true, profile: next };
}

// ------------------------------------------------------------- fallback

export interface FallbackFacts {
  conversationId: string;
  at: string;
  tz?: string;
  bot?: string;
  channel?: string;
  messageCount?: number;
  incident?: {
    id?: string;
    ticketRef?: string;
    problem?: string;
    resolution?: string;
    agent?: string;
    outcome?: string;
  } | null;
}

/** Deterministic entry when the AI cannot be used (R11.7). Marked `ai: false`. */
export function fallbackEntry(f: FallbackFacts): VisitorProfileEntry {
  const inc = f.incident;
  const outcome = inc?.outcome || "unknown";
  const summary = inc?.problem
    ? `Asked for help: ${inc.problem}`.slice(0, 220) + (inc.ticketRef ? ` (${inc.ticketRef})` : "") + `. Outcome: ${outcome.replace(/_/g, " ")}.`
    : `Chat with ${f.messageCount ?? 0} message${f.messageCount === 1 ? "" : "s"}. No AI summary available.`;
  const e: VisitorProfileEntry = {
    conversationId: f.conversationId,
    at: f.at,
    summary: summary.slice(0, ENTRY_SUMMARY_MAX),
    outcome,
    ai: false,
  };
  if (f.tz) e.tz = f.tz;
  if (f.bot) e.bot = f.bot.slice(0, 100);
  if (f.channel) e.channel = f.channel;
  if (inc?.id) e.incidentId = inc.id;
  if (inc?.ticketRef) e.ticketRef = inc.ticketRef;
  if (inc?.agent) e.agent = inc.agent.slice(0, 100);
  if (inc?.problem) e.problem = inc.problem.slice(0, 300);
  if (inc?.resolution) e.resolution = inc.resolution.slice(0, 500);
  return e;
}

/**
 * Fold the oldest entries into `earlier` until the profile fits (R18.9),
 * without the AI: refs are kept, the summary is a dated digest. Never folds
 * `keepKey`. Used for the fallback, rebases and admin-free merges.
 */
export function fitProfile(p: VisitorProfile, keepKey?: string): VisitorProfile {
  let out = { ...p, entries: sortEntries(p.entries) };
  for (let i = 0; i < 12 && profileSize(out) > PROFILE_MAX_CHARS - 200; i++) {
    const candidates = out.entries.filter((e) => entryKey(e) !== keepKey);
    if (!candidates.length || out.entries.length <= 1) break;
    const n = Math.max(1, Math.floor(candidates.length / 2));
    const fold = [...candidates].sort((a, b) => time(a.at) - time(b.at)).slice(0, n);
    const foldKeys = new Set(fold.map(entryKey));
    out = {
      ...out,
      entries: out.entries.filter((e) => !foldKeys.has(entryKey(e))),
      earlier: foldInto(out.earlier ?? null, fold),
    };
  }
  if (profileSize(out) > PROFILE_MAX_CHARS && out.earlier) {
    out = { ...out, earlier: { ...out.earlier, summary: out.earlier.summary.slice(0, 200) } };
  }
  if (profileSize(out) > PROFILE_MAX_CHARS) {
    const facts: any = { ...out.facts };
    for (const k of FACT_LIST_KEYS) if (facts[k]) facts[k] = facts[k].slice(0, 5);
    if (facts.openIssues) facts.openIssues = facts.openIssues.slice(0, 5);
    out = applyOverrides({ ...out, facts });
  }
  return out;
}

export function foldInto(earlier: VisitorProfileEarlier | null, entries: VisitorProfileEntry[]): VisitorProfileEarlier {
  const dates = [...entries.map((e) => e.at), earlier?.from, earlier?.to].filter(Boolean) as string[];
  dates.sort((a, b) => time(a) - time(b));
  const digest = [...entries]
    .sort((a, b) => time(a.at) - time(b.at))
    .map((e) => `${e.at.slice(0, 10)}: ${e.summary.slice(0, 100)}${e.ticketRef ? ` (${e.ticketRef})` : ""}`)
    .join(" ");
  const summary = [earlier?.summary, digest].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return {
    from: dates[0],
    to: dates[dates.length - 1],
    summary: summary.length > EARLIER_SUMMARY_MAX ? summary.slice(summary.length - EARLIER_SUMMARY_MAX) : summary,
    count: (earlier?.count ?? 0) + entries.length,
    incidentRefs: [...new Set([...(earlier?.incidentRefs ?? []), ...entries.map((e) => e.ticketRef).filter(Boolean)])] as string[],
    incidentIds: [...new Set([...(earlier?.incidentIds ?? []), ...entries.map((e) => e.incidentId).filter(Boolean)])] as string[],
  };
}

/** Add one entry to a profile (fallback path, or a rebase), keeping the size cap. */
export function insertEntry(p: VisitorProfile | null, e: VisitorProfileEntry): VisitorProfile {
  const base = p ?? emptyProfile();
  if (base.entries.some((x) => entryKey(x) === entryKey(e))) return base;
  return fitProfile(applyOverrides({ ...base, entries: sortEntries([e, ...base.entries]) }), entryKey(e));
}

/**
 * The profile changed while the AI was merging (another conversation of the
 * same contact, an admin edit, an anonymous merge). Re-apply this merge on
 * top of the latest version so neither update is lost (R18.11): take the
 * AI's new entry and facts, keep the latest entries, `earlier` and overrides.
 */
export function rebase(latest: VisitorProfile | null, merged: VisitorProfile, conversationId: string): VisitorProfile {
  const base = latest ?? emptyProfile();
  if (base.entries.some((e) => e.conversationId === conversationId)) return base;
  const entry = merged.entries.find((e) => e.conversationId === conversationId);
  if (!entry) return base;
  const withFacts: VisitorProfile = { ...base, facts: { ...merged.facts } };
  // Open issues tied to an incident are kept from the latest version unless
  // the merged one resolved them (it has the newer knowledge for its own ref).
  const keep = (base.facts.openIssues ?? []).filter(
    (i) => (i.ticketRef || i.incidentId) && i.ticketRef !== entry.ticketRef && i.incidentId !== entry.incidentId,
  );
  const issues = [...(merged.facts.openIssues ?? [])];
  for (const i of keep) if (!issues.some((x) => (x.ticketRef && x.ticketRef === i.ticketRef) || (x.incidentId && x.incidentId === i.incidentId))) issues.push(i);
  if (issues.length) withFacts.facts.openIssues = issues.slice(0, 10);
  return insertEntry(withFacts, entry);
}

// ------------------------------------------------------------- admin edits

/** R18.12: an admin corrects a standing fact; the next merge keeps it. */
export function setFactOverride(p: VisitorProfile | null, key: OverrideKey, value: unknown): VisitorProfile {
  if (!(OVERRIDE_KEYS as readonly string[]).includes(key)) throw new ProfileInvalidError("unknown fact");
  const base = p ?? emptyProfile();
  const clean = key === "facts.language" ? (value == null || value === "" ? null : str(value, 20) ?? null) : strList(value, 20);
  return applyOverrides({ ...base, adminOverrides: { ...(base.adminOverrides || {}), [key]: clean } });
}

/** Stop overriding a fact; the AI maintains it again from the next merge. */
export function clearFactOverride(p: VisitorProfile | null, key: OverrideKey): VisitorProfile {
  const base = p ?? emptyProfile();
  const o = { ...(base.adminOverrides || {}) };
  delete o[key];
  return { ...base, adminOverrides: o };
}

/** R18.12: an admin deletes one entry. Returns null when the key is unknown. */
export function deleteEntry(p: VisitorProfile | null, key: string): VisitorProfile | null {
  if (!p) return null;
  const entries = p.entries.filter((e) => entryKey(e) !== key);
  if (entries.length === p.entries.length) return null;
  return { ...p, entries };
}

/** Facts and the newest entries, for the AI answer prompt (R18.8). */
export function profileForAi(p: VisitorProfile | null): Record<string, unknown> | null {
  if (!p) return null;
  const entries = p.entries.slice(0, PROFILE_CONTEXT_ENTRIES).map((e) => ({
    at: e.at,
    summary: e.summary,
    outcome: e.outcome,
    ticketRef: e.ticketRef,
  }));
  const hasFacts = Object.keys(p.facts || {}).length > 0;
  if (!entries.length && !hasFacts) return null;
  return { facts: p.facts, entries };
}
