import { WorkingHours } from '../types';

const DAYS: (keyof WorkingHours)[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Compute available time slots for a given date.
 * @param date ISO YYYY-MM-DD
 * @param workingHours Full working hours config
 * @param intervalMinutes Slot interval in minutes (default 30)
 * @param excludePastSlots If true, exclude slots before current time (use when date is today)
 * @returns Array of time strings in HH:MM 24h format
 */
export function computeTimeSlots(
  date: string,
  workingHours: WorkingHours,
  intervalMinutes: number = 30,
  excludePastSlots: boolean = false,
): string[] {
  const d = new Date(date + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const dayKey = DAYS[dayOfWeek];
  const hours = workingHours[dayKey];

  if (!hours) return [];

  const { open, close } = hours;
  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (openMinutes >= closeMinutes) return [];

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: string[] = [];
  for (let m = openMinutes; m + intervalMinutes <= closeMinutes; m += intervalMinutes) {
    if (excludePastSlots && m < nowMinutes) continue;
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }

  return slots;
}
