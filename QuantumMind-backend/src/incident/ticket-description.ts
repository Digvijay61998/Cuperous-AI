import { NO_PROBLEM_TEXT } from "./constants";

/** Attributes appended under the problem when a TICKET node lists none (R1.1). */
export const DEFAULT_TICKET_ATTRIBUTES = ["ticket_summary", "ticket_reference"];

/** Hard cap so an attribute dump can never make a huge ticket. */
const MAX_DESCRIPTION_LENGTH = 4000;

const asText = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return ""; // objects/arrays (e.g. attachments) are not description text
};

/**
 * Service_Request description (R1.1, R1.6): the problem on the first line
 * (or "No problem description provided"), then each configured attribute that
 * is non-empty and not identical to the problem, in the configured order.
 * Duplicate attribute names are written once.
 */
export function buildTicketDescription(
  problem: string | null | undefined,
  attributes: Record<string, unknown> | null | undefined,
  attributeNames?: string[] | null,
): string {
  const first = asText(problem) || NO_PROBLEM_TEXT;
  const names = (attributeNames?.length ? attributeNames : DEFAULT_TICKET_ATTRIBUTES)
    .map((n) => String(n ?? "").trim())
    .filter(Boolean);
  const lines = [first];
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);
    const value = asText(attributes?.[name]);
    if (!value || value === first) continue;
    lines.push(value);
  }
  return lines.join("\n").slice(0, MAX_DESCRIPTION_LENGTH);
}
