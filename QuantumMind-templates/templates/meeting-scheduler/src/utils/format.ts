/**
 * Date formatting utilities using Intl APIs.
 */

/**
 * Format a date for display in the summary card.
 * Output: "Wednesday, January 15, 2025"
 *
 * @param isoDate - ISO date string (e.g. "2025-01-15")
 * @param locale - BCP 47 locale string (defaults to 'en-US')
 * @returns Formatted long-form date string, or the raw isoDate if parsing fails
 */
export function formatDateLong(isoDate: string, locale: string = 'en-US'): string {
  try {
    const date = new Date(isoDate + 'T00:00:00');
    if (isNaN(date.getTime())) {
      return isoDate;
    }
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
    return formatter.format(date);
  } catch {
    return isoDate;
  }
}
