/**
 * Timezone utilities for the Meeting Scheduler Template.
 * Handles detection, formatting, offset computation, and listing
 * of IANA timezone identifiers.
 */

/**
 * Detect the user's current timezone from the browser.
 * Falls back to "UTC" if Intl API is unavailable.
 */
export function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Compute UTC offset string for a timezone at a given date.
 * Returns e.g. "-05:00" or "+05:30"
 */
export function getUtcOffset(tz: string, date?: Date): string {
  const refDate = date ?? new Date();
  try {
    // Format a date in the target timezone and in UTC, then compute the difference
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(refDate);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? '0';

    const tzYear = parseInt(get('year'), 10);
    const tzMonth = parseInt(get('month'), 10) - 1;
    const tzDay = parseInt(get('day'), 10);
    let tzHour = parseInt(get('hour'), 10);
    // Intl may return "24" for midnight in some locales
    if (tzHour === 24) tzHour = 0;
    const tzMinute = parseInt(get('minute'), 10);
    const tzSecond = parseInt(get('second'), 10);

    // Build a UTC timestamp representing the local time in the target timezone
    const tzAsUtc = Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute, tzSecond);

    // The offset in minutes: positive means ahead of UTC (e.g. +05:30)
    const utcMs = refDate.getTime();
    const offsetMs = tzAsUtc - utcMs;
    const offsetMinutes = Math.round(offsetMs / 60000);

    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;

    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  } catch {
    return '+00:00';
  }
}

/**
 * Format a timezone for display: "America/New_York (UTC-05:00)"
 */
export function formatTimezone(tz: string): string {
  const offset = getUtcOffset(tz);
  return `${tz} (UTC${offset})`;
}

/**
 * Get a list of common IANA timezone identifiers.
 * Returns at least 50 major timezones covering all UTC offsets.
 */
export function getTimezoneList(): string[] {
  return [
    'Pacific/Midway',
    'Pacific/Honolulu',
    'America/Anchorage',
    'America/Los_Angeles',
    'America/Vancouver',
    'America/Denver',
    'America/Phoenix',
    'America/Chicago',
    'America/Mexico_City',
    'America/New_York',
    'America/Toronto',
    'America/Bogota',
    'America/Lima',
    'America/Halifax',
    'America/Caracas',
    'America/Santiago',
    'America/Sao_Paulo',
    'America/Buenos_Aires',
    'America/St_Johns',
    'Atlantic/Azores',
    'Atlantic/Cape_Verde',
    'UTC',
    'Europe/London',
    'Europe/Lisbon',
    'Africa/Casablanca',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Rome',
    'Europe/Madrid',
    'Africa/Lagos',
    'Europe/Athens',
    'Europe/Istanbul',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Europe/Moscow',
    'Asia/Baghdad',
    'Asia/Riyadh',
    'Africa/Nairobi',
    'Asia/Tehran',
    'Asia/Dubai',
    'Asia/Baku',
    'Asia/Kabul',
    'Asia/Karachi',
    'Asia/Tashkent',
    'Asia/Kolkata',
    'Asia/Kathmandu',
    'Asia/Dhaka',
    'Asia/Almaty',
    'Asia/Yangon',
    'Asia/Bangkok',
    'Asia/Jakarta',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Taipei',
    'Asia/Seoul',
    'Asia/Tokyo',
    'Australia/Darwin',
    'Australia/Adelaide',
    'Australia/Sydney',
    'Australia/Brisbane',
    'Pacific/Guam',
    'Pacific/Noumea',
    'Pacific/Auckland',
    'Pacific/Fiji',
    'Pacific/Tongatapu',
  ];
}
