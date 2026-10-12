/**
 * Pure identity rules for chat-captured contact details (R2, R16, R17, R20).
 * No I/O, so every edge case is unit-testable.
 */

export const NAME_PART_MAX = 100;
export const ANONYMOUS_FIRST_NAME = "Anonymous visitor";
export const DEFAULT_CONTACT_MAPPING = {
  name: "contact_name",
  email: "contact_email",
  phone: "contact_phone",
} as const;

export interface ContactMapping {
  name?: string;
  email?: string;
  phone?: string;
}

/** Platform account ids we can follow up on (crm-plugins-service-desk R22). */
export type ChannelKind = "TELEGRAM" | "FACEBOOK" | "WHATSAPP_LID";
export const CHANNEL_KINDS: readonly ChannelKind[] = ["TELEGRAM", "FACEBOOK", "WHATSAPP_LID"];

export interface ChannelIdentity {
  kind: ChannelKind;
  /** Telegram numeric user id, Messenger PSID, or a WhatsApp `…@lid` jid. */
  value: string;
}

export interface RawDetails {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  channel?: unknown;
  /** The name is a guess (free text, platform display name), not stated. */
  weakName?: boolean;
}

export interface CleanDetails {
  name?: string;
  email?: string;
  /** Normalised: digits with an optional leading "+", 7–15 digits. */
  phone?: string;
  channel?: ChannelIdentity;
  /** See RawDetails.weakName: only fills a blank or placeholder name. */
  weakName?: boolean;
}

/**
 * Attributes read as the visitor's name when the mapped name alias has no
 * value (R3.3), so a detail question saved as `name` still names the contact.
 */
export const NAME_ALIASES = [
  "contact_name",
  "name",
  "full_name",
  "fullname",
  "your_name",
  "visitor_name",
  "customer_name",
] as const;

const CHANNEL_VALUE_RE = /^[A-Za-z0-9_.:@-]{1,128}$/;

/** A platform id is kept only when its kind is known and its value is id-shaped. */
export function cleanChannel(value: unknown): ChannelIdentity | undefined {
  const v: any = value;
  if (!v || typeof v !== "object") return undefined;
  if (!CHANNEL_KINDS.includes(v.kind)) return undefined;
  const id = typeof v.value === "number" ? String(v.value) : typeof v.value === "string" ? v.value.trim() : "";
  if (!CHANNEL_VALUE_RE.test(id)) return undefined;
  if (v.kind === "WHATSAPP_LID" && !id.endsWith("@lid")) return undefined;
  if (v.kind === "TELEGRAM" && !/^\d{1,20}$/.test(id)) return undefined;
  return { kind: v.kind, value: id };
}

/**
 * R2.1: after trimming, at most 254 characters, no whitespace, exactly one
 * "@", non-empty local part, and a domain with a "." that has characters on
 * both sides.
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v || v.length > 254 || /\s/.test(v)) return false;
  const parts = v.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local) return false;
  const dot = domain.indexOf(".");
  if (dot <= 0) return false;
  // Every label non-empty: rejects "a@b..c" and "a@b.c." too.
  return domain.split(".").every((label) => label.length > 0);
}

/**
 * Values the platform invents for visitors who gave nothing
 * (VisitorService.createVisitor): `<id>@nomemail.com`, `0000000000`. They
 * must never reach the CRM or count as "known" details.
 */
const PLACEHOLDER_EMAIL_DOMAINS = new Set(["nomemail.com"]);
export function isPlaceholderEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && PLACEHOLDER_EMAIL_DOMAINS.has(domain);
}
export function isPlaceholderPhone(digits: string): boolean {
  return /^0+$/.test(digits) || /^(\d)\1+$/.test(digits);
}

export function normalizeEmail(value: unknown): string | undefined {
  if (!isValidEmail(value)) return undefined;
  const email = value.trim().toLowerCase();
  return isPlaceholderEmail(email) ? undefined : email;
}

/**
 * Digits with an optional leading "+", 7–15 digits (E.164 length). Rejects
 * anything that is not phone-shaped (letters, a second "+", an email), so
 * "Lift 2, floor 12345678" is not a phone.
 */
export function normalizePhone(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const v = String(value).trim();
  if (!v || !/^\+?[\d\s().\-/]+$/.test(v)) return undefined;
  const digits = v.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return undefined;
  if (isPlaceholderPhone(digits)) return undefined;
  return (v.startsWith("+") ? "+" : "") + digits;
}

/** Key used to compare phones: digits only, so "+91…" and "91…" match. */
export function phoneKey(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? digits : undefined;
}

const cleanName = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

/**
 * R2.3 and R2.5: first name up to the first space, last name the rest, each
 * cut to 100 characters. An empty or "Anonymous" name falls back to the
 * email's local part, else "Visitor", with no last name.
 */
export function splitName(
  name: unknown,
  email?: string,
): { firstName: string; lastName: string | null } {
  const n = cleanName(name);
  if (!n || n.toLowerCase() === "anonymous") {
    const local = email?.split("@")[0]?.trim();
    return { firstName: (local || "Visitor").slice(0, NAME_PART_MAX), lastName: null };
  }
  const space = n.indexOf(" ");
  if (space === -1) return { firstName: n.slice(0, NAME_PART_MAX), lastName: null };
  const last = n.slice(space + 1).trim();
  return {
    firstName: n.slice(0, space).slice(0, NAME_PART_MAX),
    lastName: last ? last.slice(0, NAME_PART_MAX) : null,
  };
}

/** Read name/email/phone from attributes via the bot's mapping (R2.9). */
/** The bot's mapping when it defines any alias, else the defaults (R2.9). */
export function effectiveMapping(mapping?: ContactMapping | null): ContactMapping {
  return mapping && (mapping.name || mapping.email || mapping.phone) ? mapping : DEFAULT_CONTACT_MAPPING;
}

export function readDetails(
  attributes: Record<string, unknown> | null | undefined,
  mapping?: ContactMapping | null,
): RawDetails {
  const m = effectiveMapping(mapping);
  const mappedName = m.name ? attributes?.[m.name] : undefined;
  const mapped = cleanName(mappedName);
  return {
    name: mapped && mapped.toLowerCase() !== "anonymous" ? mappedName : fallbackName(attributes),
    email: m.email ? attributes?.[m.email] : undefined,
    phone: m.phone ? attributes?.[m.phone] : undefined,
  };
}

/** First non-empty, non-"Anonymous" value among NAME_ALIASES (R3.3). */
function fallbackName(attributes: Record<string, unknown> | null | undefined): unknown {
  for (const alias of NAME_ALIASES) {
    const n = cleanName(attributes?.[alias]);
    if (n && n.toLowerCase() !== "anonymous") return n;
  }
  return undefined;
}

/** Every attribute that may hold a contact detail, for the listener's pre-filter. */
export function contactAliases(mapping?: ContactMapping | null): Set<string> {
  const m = effectiveMapping(mapping);
  return new Set([m.name, m.email, m.phone, ...NAME_ALIASES].filter(Boolean) as string[]);
}

/** Validate and normalise; invalid identifiers are dropped (R2.11, R2.12). */
export function cleanDetails(raw: RawDetails): CleanDetails {
  const out: CleanDetails = {};
  const name = cleanName(raw.name);
  if (name && name.toLowerCase() !== "anonymous") out.name = name.slice(0, 2 * NAME_PART_MAX + 1);
  const email = normalizeEmail(raw.email);
  if (email) out.email = email;
  const phone = normalizePhone(raw.phone);
  if (phone) out.phone = phone;
  const channel = cleanChannel(raw.channel);
  if (channel) out.channel = channel;
  if (out.name && raw.weakName) out.weakName = true;
  return out;
}

export const hasIdentifier = (d: CleanDetails) => !!(d.email || d.phone || d.channel);

const blank = (v: unknown) => v == null || (typeof v === "string" && !v.trim());

/** Who last set each contact field. Absent = a person (fail safe, R17.6). */
export type FieldSource = "chat" | "human";

export interface ContactRow {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  isAnonymous?: boolean;
  /** Name is a placeholder chat may replace (anonymous or platform display name). */
  namePlaceholder?: boolean;
  fieldSources?: Record<string, FieldSource> | null;
}

export interface FillPlan {
  data: Record<string, string | null>;
  fieldSources: Record<string, FieldSource>;
  /** Values not written because a person owns the field (R17.6). */
  proposals: { field: "name" | "email" | "phone"; value: string }[];
}

/**
 * What a capture writes onto a matched contact.
 *
 * - Name: the newest stated name wins (crm-plugins-service-desk D11). A
 *   guessed name (`weakName`) only replaces a blank or placeholder name
 *   (anonymous, or a platform display name).
 * - Email and phone: the newest given value becomes Current
 *   (crm-plugins-service-desk R21.2, D8). The previous value is not lost: the
 *   resolver keeps it as an earlier ContactIdentifier before replacing it.
 */
export function planFill(contact: ContactRow, details: CleanDetails): FillPlan {
  const sources: Record<string, FieldSource> = { ...(contact.fieldSources || {}) };
  const data: Record<string, string | null> = {};
  const proposals: FillPlan["proposals"] = [];

  const placeholderName = !!contact.isAnonymous || !!contact.namePlaceholder;
  if (details.name) {
    const { firstName, lastName } = splitName(details.name);
    const current = `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim();
    // A name the visitor states replaces the stored one (a spelling fix is
    // the usual case; no history kept, D11). A guessed name (free text, a
    // platform display name) only fills a blank or placeholder name.
    const replace = placeholderName || blank(contact.firstName) || !details.weakName;
    if (replace && current !== `${firstName} ${lastName ?? ""}`.trim()) {
      data.firstName = firstName;
      data.lastName = lastName;
      sources.firstName = "chat";
      sources.lastName = "chat";
    }
  }
  if (details.email) {
    if (blank(contact.email) || contact.email!.trim().toLowerCase() !== details.email) {
      data.email = details.email;
      sources.email = "chat";
    }
  }
  if (details.phone) {
    if (blank(contact.phone) || phoneKey(contact.phone) !== phoneKey(details.phone)) {
      data.phone = details.phone;
      data.phoneNormalized = details.phone;
      sources.phone = "chat";
    }
  }
  return { data, fieldSources: sources, proposals };
}

export interface Conflict {
  field: "email" | "phone";
  /** Masked existing value, e.g. "•••210" (R17.2: last 3 characters). */
  existingMasked: string;
  newValue: string;
}

/**
 * R17.2: the contact matched on one identifier and has a different value
 * on the other. Blank stored values are not conflicts (they get filled).
 */
export function detectConflict(contact: ContactRow, details: CleanDetails): Conflict | null {
  if (details.phone && contact.phone && phoneKey(contact.phone) !== phoneKey(details.phone)) {
    return { field: "phone", existingMasked: maskTail(contact.phone), newValue: details.phone };
  }
  if (details.email && contact.email && contact.email.toLowerCase() !== details.email) {
    return { field: "email", existingMasked: maskTail(contact.email), newValue: details.email };
  }
  return null;
}

/** Show only the last 3 characters. */
export function maskTail(value: string): string {
  const v = String(value ?? "");
  return v.length <= 3 ? "•••" : `•••${v.slice(-3)}`;
}

/** "r•••@example.com" for confirm messages (R16.2). */
export function maskEmailForDisplay(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return maskTail(email);
  return `${local.slice(0, 1)}•••@${domain}`;
}

/** Stable 6-character id for "Anonymous visitor <id>" (R20.1). */
export function anonymousSuffix(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(-6);
}

/** 64-bit advisory-lock key from org + identifier (pg_advisory_xact_lock). */
export function lockKey(orgId: string, identifier: string): bigint {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const s = `${orgId}|${identifier}`;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519);
  }
  const hi = BigInt(h1 >>> 0) << BigInt(32);
  const v = hi | BigInt(h2 >>> 0);
  // Postgres bigint is signed.
  return BigInt.asIntN(64, v);
}

// ---------------------------------------------------- free text (R16.5)

const EMAIL_IN_TEXT = /[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const PHONE_IN_TEXT = /\+?\(?\d[\d\s().-]{5,}\d/g;
const NAME_IN_TEXT =
  /\b(?:i am|i'm|im|my name is|this is|name:)\s+([A-Za-z][A-Za-z'.-]+(?:\s+[A-Za-z][A-Za-z'.-]+)?)/i;
/** Words after "I'm" that are not names ("I'm looking", "I'm not"). */
const NOT_NAMES = new Set([
  "a", "an", "the", "not", "looking", "trying", "having", "facing", "here", "from",
  "interested", "calling", "writing", "sorry", "fine", "good", "ok", "okay", "still",
  "stuck", "unable", "getting", "going", "waiting", "new", "just", "very", "so",
]);

/** True when a message may carry contact details and is worth extracting. */
export function mayContainContact(text: unknown): boolean {
  if (typeof text !== "string") return false;
  return text.includes("@") || (text.match(/\d/g)?.length ?? 0) >= 7;
}

export interface TextExtraction extends CleanDetails {
  /** More than one candidate for a field, or a name we could not place. */
  ambiguous: boolean;
}

/**
 * Regex pass over free text. Ambiguous when there are several distinct
 * emails or phones, so the AI extractor should decide.
 */
export function extractFromText(text: string): TextExtraction {
  const emails = [...new Set((text.match(EMAIL_IN_TEXT) || []).map((e) => normalizeEmail(e)).filter(Boolean))] as string[];
  const withoutEmails = text.replace(EMAIL_IN_TEXT, " ");
  const phones = [
    ...new Set(
      (withoutEmails.match(PHONE_IN_TEXT) || [])
        .map((p) => normalizePhone(p))
        .filter(Boolean)
        .map((p) => p as string),
    ),
  ];
  const nameMatch = text.match(NAME_IN_TEXT);
  let name: string | undefined;
  if (nameMatch) {
    const words = nameMatch[1].split(/\s+/).filter((w) => !NOT_NAMES.has(w.toLowerCase()));
    if (words.length && !NOT_NAMES.has(nameMatch[1].split(/\s+/)[0].toLowerCase())) {
      name = words.join(" ");
    }
  }
  return {
    email: emails[0],
    phone: phones[0],
    name,
    ambiguous: emails.length > 1 || phones.length > 1,
  };
}
