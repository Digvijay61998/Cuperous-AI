/**
 * PII masking for text sent to the AI service (R11.5, Property 9).
 *
 * Replaces, in this order:
 *   1. caller-supplied secret values (QUESTIONS elements marked `secure`) -> [secure]
 *   2. email addresses                                                     -> [email]
 *   3. phone-like digit runs with 7 or more digits (dates excluded)        -> [phone]
 *
 * Secrets go first so a secret that happens to look like an email or phone
 * is still labelled as a secret, and so masking an email cannot leave part of
 * a secret behind. The masked text is what is persisted in summaries; raw
 * identifiers live only in the CRM contact's own columns.
 */

export const MASK = {
  email: "[email]",
  phone: "[phone]",
  secure: "[secure]",
} as const;

/**
 * RFC 5322 atext in the local part (so "!x@a.io" or "a/b@c.io" cannot slip
 * through, found by the Phase 7 property test), dotted labels in the domain.
 */
const EMAIL_RE = /[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

/**
 * Candidate phone runs: an optional "+", then digits mixed with spaces, dots,
 * dashes and brackets. Validated afterwards by digit count (7–15) so dates,
 * years and short numbers ("order 4471") are left alone.
 */
const PHONE_CANDIDATE_RE = /\+?\(?\d[\d\s().-]{5,}\d/g;

/**
 * A phone has 7 to 15 digits (E.164). Runs above 15 are not one phone but may
 * be several, so they are masked too: over-masking a long number is safer
 * than leaking a phone (Property 9).
 */
const MIN_PHONE_DIGITS = 7;

/** Minimum length for a secret to be masked; avoids masking "a" everywhere. */
const MIN_SECRET_LENGTH = 3;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function maskEmails(text: string): string {
  return text.replace(EMAIL_RE, MASK.email);
}

const digitCount = (s: string) => s.replace(/\D/g, "").length;

/**
 * Mask one candidate run. A run longer than one phone may be several numbers
 * separated by spaces ("82083 23163 020 5550199"); fail safe by masking the
 * whole run rather than leaking either number. Any run with at least 7 digits
 * is masked, so long digit strings never pass through unmasked.
 */
function maskRun(run: string): string {
  const trimmed = run.trim();
  if (digitCount(trimmed) < MIN_PHONE_DIGITS) return run;
  const lead = run.slice(0, run.indexOf(trimmed));
  const trail = run.slice(run.indexOf(trimmed) + trimmed.length);
  return `${lead}${MASK.phone}${trail}`;
}

/**
 * Stand-alone dates ("2026-10-07", "07-10-2026", "07.10.2026"). They are
 * shielded before phone matching so a date next to a number
 * ("2026-10-07 12 people") is not glued into one phone-like run.
 */
const Y = "(?:19|20)\\d{2}";
const M = "(?:0?[1-9]|1[0-2])";
const D = "(?:0?[1-9]|[12]\\d|3[01])";
// Same separator on both sides; only plausible dates are shielded, so a
// phone written like "5550.12.34" is still masked.
const DATE_TOKEN_RE = new RegExp(
  `(?<![\\d+])(?:${Y}([-./])${M}\\1${D}|${D}([-./])${M}\\2${Y})(?!\\d)`,
  "g",
);
/** Private-use sentinels: cannot be typed by a visitor by accident, no digits. */
const DATE_SLOT = (i: number) => `\uE000${String.fromCharCode(0xe100 + i)}\uE001`;
const DATE_SLOT_RE = /\uE000([\uE100-\uEFFF])\uE001/g;

export function maskPhones(text: string): string {
  const dates: string[] = [];
  const shielded = text.replace(DATE_TOKEN_RE, (d) => {
    if (dates.length >= 0xeff) return d; // absurd input: stop shielding, fail safe
    dates.push(d);
    return DATE_SLOT(dates.length - 1);
  });
  const masked = shielded.replace(PHONE_CANDIDATE_RE, maskRun);
  return masked.replace(DATE_SLOT_RE, (_m, c: string) => dates[c.charCodeAt(0) - 0xe100] ?? "");
}

export function maskSecrets(text: string, secrets: Iterable<string> = []): string {
  const list = [...new Set([...secrets].map((s) => String(s ?? "").trim()))]
    .filter((s) => s.length >= MIN_SECRET_LENGTH)
    // Longest first so a secret containing another is masked whole.
    .sort((a, b) => b.length - a.length);
  if (!list.length) return text;
  const re = new RegExp(list.map(escapeRegExp).join("|"), "gi");
  return text.replace(re, MASK.secure);
}

export interface MaskOptions {
  /** Values captured by QUESTIONS elements marked `secure`. */
  secrets?: Iterable<string>;
}

/** Mask secrets, emails and phones in one string. */
export function maskPii(text: string | null | undefined, opts: MaskOptions = {}): string {
  if (text == null) return "";
  let out = String(text);
  out = maskSecrets(out, opts.secrets ?? []);
  out = maskEmails(out);
  out = maskPhones(out);
  return out;
}

/** Mask every string value inside a JSON-like structure (arrays/objects). */
export function maskPiiDeep<T>(value: T, opts: MaskOptions = {}): T {
  if (typeof value === "string") return maskPii(value, opts) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => maskPiiDeep(v, opts)) as unknown as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = maskPiiDeep(v, opts);
    }
    return out as T;
  }
  return value;
}
