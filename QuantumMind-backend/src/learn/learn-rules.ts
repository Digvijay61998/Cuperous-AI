/**
 * Auto-learn rules (crm-incident-handover R21, R12.2, R12.9). Pure.
 *
 * Input to the AI is masked here (emails, phones, the contact's name, ticket
 * refs). The AI's output is checked again before anything is stored: a learned
 * entry is shown to every visitor of the org, so a false reject (one entry
 * not learned) is far cheaper than a leak.
 */
import { maskPii } from "src/common/pii/mask";

export const QUESTION_MIN = 10;
export const QUESTION_MAX = 500;
export const ANSWER_MIN = 10;
export const ANSWER_MAX = 2000;
/** R10.1: a resolution note is 10 to 2000 characters. */
export const NOTE_MIN = 10;
/** R21.3: at or above this cosine similarity, update instead of adding. */
export const DEDUPE_THRESHOLD = 0.9;
export const KNOWLEDGE_SOURCE_PREFIX = "incident:";

/** Platform ticket refs (`generateId("SR", 6)` -> "SR_xxxxxx") and any given ref. */
const TICKET_RE = /\bSR[_-][A-Za-z0-9_-]{4,}/gi;
const PLACEHOLDER_RE = /\[(?:email|phone|secure|name|ref)\]/i;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface Sensitive {
  /** The contact's first / last name; parts under 3 letters are ignored. */
  names?: (string | null | undefined)[];
  ticketRefs?: (string | null | undefined)[];
}

function nameParts(names: Sensitive["names"]): string[] {
  const out = new Set<string>();
  for (const n of names || []) {
    for (const part of String(n || "").split(/\s+/)) {
      const p = part.replace(/[^\p{L}'-]/gu, "");
      if (p.length >= 3 && !/^anonymous$|^visitor$/i.test(p)) out.add(p);
    }
  }
  return [...out];
}

const nameRe = (p: string) => new RegExp(`(?<![\\p{L}])${escape(p)}(?![\\p{L}])`, "giu");

/** What the AI sees: no email, phone, name or ticket ref (R12.2). */
export function maskForLearning(text: string, s: Sensitive = {}): string {
  let out = maskPii(String(text ?? ""));
  for (const ref of s.ticketRefs || []) if (ref) out = out.replace(new RegExp(escape(ref), "gi"), "[ref]");
  out = out.replace(TICKET_RE, "[ref]");
  for (const p of nameParts(s.names)) out = out.replace(nameRe(p), "[name]");
  return out.replace(/\s+/g, " ").trim();
}

/** Why the AI's question/answer cannot be published, or null. */
export function unsafeReason(text: string, s: Sensitive = {}): string | null {
  const t = String(text ?? "");
  if (maskPii(t) !== t) return "contains an email address or phone number";
  if (TICKET_RE.test(t)) {
    TICKET_RE.lastIndex = 0;
    return "contains a ticket reference";
  }
  TICKET_RE.lastIndex = 0;
  for (const ref of s.ticketRefs || []) if (ref && t.toLowerCase().includes(ref.toLowerCase())) return "contains a ticket reference";
  for (const p of nameParts(s.names)) if (nameRe(p).test(t)) return "contains the contact's name";
  if (PLACEHOLDER_RE.test(t)) return "contains a hidden-data placeholder";
  return null;
}

export type CandidateCheck = { ok: true; question: string; answer: string } | { ok: false; reason: string };

/** Lengths (R12.2) and the personal-data guard on both fields. */
export function checkCandidate(raw: unknown, s: Sensitive = {}): CandidateCheck {
  const r: any = raw && typeof raw === "object" ? raw : {};
  const question = typeof r.question === "string" ? r.question.replace(/\s+/g, " ").trim() : "";
  const answer = typeof r.answer === "string" ? r.answer.replace(/\s+/g, " ").trim() : "";
  if (question.length < QUESTION_MIN || question.length > QUESTION_MAX) return { ok: false, reason: "question length out of range" };
  if (answer.length < ANSWER_MIN || answer.length > ANSWER_MAX) return { ok: false, reason: "answer length out of range" };
  for (const [label, text] of [["question", question], ["answer", answer]] as const) {
    const why = unsafeReason(text, s);
    if (why) return { ok: false, reason: `${label} ${why}` };
  }
  return { ok: true, question, answer };
}

/** The text ingested into the knowledge base for one entry. */
export function knowledgeText(question: string, answers: string[]): string {
  const a = (answers || []).filter((x) => typeof x === "string" && x.trim());
  return `Q: ${question}\nA: ${a.join("\n")}`;
}

/** Only an agent resolution with a real note teaches the bot (R21.1). */
export function shouldLearn(ev: { outcome?: string; resolutionNote?: string | null } | null | undefined): boolean {
  return ev?.outcome === "resolved_by_agent" && typeof ev.resolutionNote === "string" && ev.resolutionNote.trim().length >= NOTE_MIN;
}
