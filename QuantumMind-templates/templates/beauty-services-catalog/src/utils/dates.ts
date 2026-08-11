/**
 * Build an array of date objects for the next `count` days starting from today.
 */
export function buildDays(
  count: number,
  locale: string = 'en',
): { iso: string; dayAbbr: string; dayNum: number }[] {
  const days: { iso: string; dayAbbr: string; dayNum: number }[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    let dayAbbr: string;
    try {
      dayAbbr = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
    } catch {
      dayAbbr = d.toLocaleDateString('en', { weekday: 'short' });
    }
    days.push({ iso, dayAbbr, dayNum: d.getDate() });
  }

  return days;
}

/**
 * Get today's date in ISO YYYY-MM-DD format.
 */
export function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}
