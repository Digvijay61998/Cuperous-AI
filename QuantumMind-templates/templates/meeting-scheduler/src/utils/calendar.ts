/**
 * Calendar utility functions for the Meeting Scheduler Template.
 * Provides date selectability checks and month grid generation.
 */

/**
 * Determine if a date is selectable (bookable).
 * A date is selectable iff:
 *   1. It is today or in the future (date >= today), AND
 *   2. It is within advanceBookingDays from today (date <= today + advanceBookingDays)
 *
 * @param date - ISO date string (YYYY-MM-DD) to check
 * @param today - ISO date string (YYYY-MM-DD) for "today"
 * @param advanceBookingDays - Max days into the future allowed
 * @returns true if the date is selectable
 */
export function isDateSelectable(
  date: string,
  today: string,
  advanceBookingDays: number
): boolean {
  // Compare date strings directly — ISO YYYY-MM-DD strings are lexicographically orderable
  if (date < today) {
    return false;
  }

  // Calculate the max selectable date (today + advanceBookingDays)
  const todayDate = new Date(today + 'T00:00:00');
  const maxDate = new Date(todayDate);
  maxDate.setDate(maxDate.getDate() + advanceBookingDays);

  // Format maxDate as ISO YYYY-MM-DD for comparison
  const maxDateStr = maxDate.toISOString().slice(0, 10);

  return date <= maxDateStr;
}

/**
 * Generate the grid cells for a given month.
 * Returns a 2D array of week rows, each containing 7 elements.
 * Elements are ISO date strings (YYYY-MM-DD) for days in the month,
 * or null for padding cells before/after the month's days.
 *
 * The grid uses Sunday as the first day of the week (column 0).
 *
 * @param year - Full year (e.g. 2025)
 * @param month - 0-indexed month (0 = January, 11 = December)
 * @returns 2D array of (string | null)[][] representing the calendar grid
 */
export function generateMonthGrid(
  year: number,
  month: number
): (string | null)[][] {
  // Get the first day of the month and total days in the month
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid: (string | null)[][] = [];
  let currentRow: (string | null)[] = [];

  // Add null padding for days before the first day of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    currentRow.push(null);
  }

  // Add date strings for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    currentRow.push(dateStr);

    // Start a new row after Saturday (7 cells)
    if (currentRow.length === 7) {
      grid.push(currentRow);
      currentRow = [];
    }
  }

  // Pad the last row with nulls if it's not complete
  if (currentRow.length > 0) {
    while (currentRow.length < 7) {
      currentRow.push(null);
    }
    grid.push(currentRow);
  }

  return grid;
}
