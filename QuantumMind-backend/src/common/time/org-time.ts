import { COUNTRY_DEFAULT_ZONE } from "./country-zones";

export interface OrgTimeSettings {
  country?: string | null;
  timeZone?: string | null;
}

/**
 * True when the runtime can format in `zone`.
 *
 * Deliberately NOT `Intl.supportedValuesOf('timeZone')`: that list holds
 * ICU's canonical spellings (e.g. "Asia/Calcutta"), so it would reject the
 * current IANA names ("Asia/Kolkata") that the formatter accepts fine.
 */
export function isValidTimeZone(zone: unknown): zone is string {
  if (typeof zone !== "string" || !zone.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Default zone for an ISO 3166-1 alpha-2 country code, or undefined. */
export function defaultZoneForCountry(country?: string | null): string | undefined {
  if (!country) return undefined;
  return COUNTRY_DEFAULT_ZONE[country.trim().toUpperCase()];
}

/**
 * The zone an organization's dates are shown in (R22.1): its explicit zone
 * when valid, else its country's default, else UTC.
 */
export function resolveOrgTimeZone(org?: OrgTimeSettings | null): string {
  if (isValidTimeZone(org?.timeZone)) return org!.timeZone as string;
  const fromCountry = defaultZoneForCountry(org?.country);
  if (fromCountry && isValidTimeZone(fromCountry)) return fromCountry;
  return "UTC";
}

/**
 * Format a date for visitors, summaries and emails in the org's zone, with a
 * zone label (R22.2), e.g. "07 Oct 2026, 21:12 GMT+5:30".
 */
export function formatInOrgTz(
  date: Date | string | number,
  org?: OrgTimeSettings | null,
  locale = "en-GB",
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    timeZone: resolveOrgTimeZone(org),
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(d);
}
