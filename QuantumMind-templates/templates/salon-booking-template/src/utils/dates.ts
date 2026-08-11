export interface DayOption {
  iso: string; // YYYY-MM-DD
  weekday: string; // Mon
  day: string; // 14
  month: string; // Jul
}

/** Builds the next `count` selectable days starting today, localized. */
export const buildDays = (count = 14, locale = 'en'): DayOption[] => {
  const days: DayOption[] = [];
  const today = new Date();
  const safeLocale = locale || 'en';
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push({
      iso: `${year}-${month}-${day}`,
      weekday: d.toLocaleDateString(safeLocale, { weekday: 'short' }),
      day: d.getDate().toString(),
      month: d.toLocaleDateString(safeLocale, { month: 'short' }),
    });
  }
  return days;
};

/** Local ISO date (YYYY-MM-DD) for today. */
export const todayIso = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
