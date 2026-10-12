const MAX_PHRASES = 50;
const MAX_PHRASE_LENGTH = 100;

/** Trim, lowercase, collapse whitespace, strip leading/trailing punctuation. */
export function normalizeIntentText(text: string): string {
  return String(text ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu, "");
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * True when `message` contains one of `phrases` as a whole-word sequence
 * (so "human" matches "a human please" but not "humanity").
 * Invalid phrases (empty or > 100 chars) are ignored; at most 50 are used.
 */
export function matchesAgentIntent(
  message: unknown,
  phrases: unknown,
): boolean {
  if (typeof message !== "string" || !Array.isArray(phrases)) return false;
  const text = normalizeIntentText(message);
  if (!text) return false;
  return phrases
    .slice(0, MAX_PHRASES)
    .map((p) => (typeof p === "string" ? normalizeIntentText(p) : ""))
    .filter((p) => p.length > 0 && p.length <= MAX_PHRASE_LENGTH)
    .some((p) =>
      new RegExp(
        `(^|[^\\p{L}\\p{N}])${escapeRegExp(p).replace(/ /g, "\\s+")}($|[^\\p{L}\\p{N}])`,
        "u",
      ).test(text),
    );
}
