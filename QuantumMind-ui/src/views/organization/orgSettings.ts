/**
 * Pure helpers for the Organization settings page (country + time zone).
 * Kept free of React so they are unit-testable.
 */

export interface OrgSettingsView {
  country: string | null;
  timeZone: string | null;
  effectiveTimeZone: string;
  countryDefaultTimeZone: string | null;
}

/** Every IANA zone the browser knows, falling back to a short common list. */
export function listTimeZones(): string[] {
  try {
    const fn = (Intl as any).supportedValuesOf;
    if (typeof fn === 'function') {
      const zones: string[] = fn('timeZone');
      if (zones?.length) return zones.includes('UTC') ? zones : ['UTC', ...zones];
    }
  } catch {
    /* older browsers */
  }
  return [
    'UTC',
    'Asia/Kolkata',
    'Europe/Helsinki',
    'Europe/London',
    'America/New_York',
    'Asia/Singapore',
    'Australia/Sydney',
  ];
}

/** ISO 3166-1 alpha-2 codes with display names, sorted by name. */
export function listCountries(locale = 'en'): { code: string; name: string }[] {
  const codes: string[] = [];
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) codes.push(String.fromCharCode(a, b));
  }
  let names: any = null;
  try {
    names = new (Intl as any).DisplayNames([locale], { type: 'region' });
  } catch {
    names = null;
  }
  return codes
    .map((code) => {
      let name: string | undefined;
      try {
        name = names?.of(code);
      } catch {
        name = undefined;
      }
      return { code, name };
    })
    // Intl.DisplayNames echoes back the code for unassigned regions.
    .filter((c): c is { code: string; name: string } => !!c.name && c.name !== c.code)
    .sort((x, y) => x.name.localeCompare(y.name));
}

/**
 * The time zone to save. When the admin leaves the zone on "Use country
 * default", send null so the backend keeps deriving it from the country
 * (and follows a later country change).
 */
export function zoneToSave(selected: string, useCountryDefault: boolean): string | null {
  if (useCountryDefault) return null;
  return selected || null;
}

/** "Wed, 08 Oct 2026, 14:05 GMT+5:30" preview in a zone, or '' if invalid. */
export function previewNow(zone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    }).format(now);
  } catch {
    return '';
  }
}
