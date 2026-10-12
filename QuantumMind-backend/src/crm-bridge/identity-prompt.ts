/** Pure helpers for identity questions and "ask once" (R16, R17). No I/O. */
import {
  Conflict,
  ContactMapping,
  DEFAULT_CONTACT_MAPPING,
  maskEmailForDisplay,
  maskTail,
  NAME_ALIASES,
} from "./identity";

/** Button values. Text replies are matched too, case-insensitively. */
export const IDENTITY_CHOICES = {
  keep_existing: "Keep existing",
  use_new: "Use new",
  keep_both: "Keep both",
} as const;
export type IdentityChoice = keyof typeof IDENTITY_CHOICES;

export const CONFIRM_YES = "Yes";
export const CONFIRM_UPDATE = "Update details";

/** Unanswered after this many visitor turns -> propose and move on (R17.5). */
export const IDENTITY_PROMPT_MAX_TURNS = 2;

export interface PendingIdentity {
  field: "email" | "phone";
  newValue: string;
  contactId: string;
  askedAt: number;
  turns: number;
}

export type KnownField = "name" | "email" | "phone";
export interface KnownDetails {
  name?: string;
  email?: string;
  phone?: string;
}

/** Map a visitor reply to a choice, or null if it is not an answer. */
export function parseIdentityChoice(text: unknown): IdentityChoice | null {
  if (typeof text !== "string") return null;
  const t = text.trim().toLowerCase();
  for (const [k, label] of Object.entries(IDENTITY_CHOICES)) {
    if (t === label.toLowerCase() || t === k) return k as IdentityChoice;
  }
  if (/^keep (the )?(old|existing|current)( one)?$/.test(t)) return "keep_existing";
  if (/^(use (the )?new( one)?|new( one)?|update( it)?)$/.test(t)) return "use_new";
  if (/^(keep )?both$/.test(t)) return "keep_both";
  return null;
}

export function conflictQuestion(c: Pick<Conflict, "field" | "existingMasked">): string {
  const tail = c.existingMasked.replace(/^•+/, "");
  return `We have a different ${c.field} on file ending ${tail}. Which should we use?`;
}

/**
 * The "we already have your details" confirm (R16.2; crm-plugins-service-desk
 * R23): "We'll follow up with you at Raj Kumar, r•••@x.com. Is that right?"
 * Email and phone are masked: the chat may be on a shared screen.
 */
export function confirmMessage(known: KnownDetails, fields: KnownField[]): string {
  const parts: string[] = [];
  if (fields.includes("name") && known.name) parts.push(known.name);
  if (fields.includes("email") && known.email) parts.push(maskEmailForDisplay(known.email));
  if (fields.includes("phone") && known.phone) parts.push(maskTail(known.phone));
  return `We'll follow up with you at ${parts.join(", ")}. Is that right? Tap "Update details" to change them.`;
}

/** Which contact field an alias is, under the bot's mapping (R16.1). */
export function aliasField(alias: string | undefined, mapping?: ContactMapping | null): KnownField | null {
  if (!alias) return null;
  const m = mapping && (mapping.name || mapping.email || mapping.phone) ? mapping : DEFAULT_CONTACT_MAPPING;
  if (alias === m.name) return "name";
  if (alias === m.email) return "email";
  if (alias === m.phone) return "phone";
  return null;
}

/**
 * Which contact field a question asks for: the mapped alias, else its
 * validation type (email / phone), else a common name alias. Secure
 * questions are never contact fields (crm-plugins-service-desk R3, R23).
 */
export function contactFieldOf(
  element: { alias?: string; entity?: string; secure?: boolean } | null | undefined,
  mapping?: ContactMapping | null,
): KnownField | null {
  if (!element || element.secure) return null;
  const byAlias = aliasField(element.alias, mapping);
  if (byAlias) return byAlias;
  if (element.entity === "jarcube.email") return "email";
  if (element.entity === "jarcube.phone_number") return "phone";
  if (element.alias && (NAME_ALIASES as readonly string[]).includes(element.alias)) return "name";
  return null;
}
