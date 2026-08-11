import type { DayHours, WorkingHours } from '../types';

const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/** Parse "HH:MM" into minutes since midnight. Returns null if malformed. */
const parseTime = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

/** Format minutes-since-midnight into a 12-hour "h:MM AM/PM" label. */
const formatSlotLabel = (minutes: number): string => {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
};

/** Resolve the working-hours entry for a given ISO date. */
const hoursForDate = (
  isoDate: string,
  workingHours: WorkingHours,
): DayHours | null => {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const key = DAY_KEYS[d.getDay()];
  return (workingHours?.[key] as DayHours | null | undefined) ?? null;
};

/**
 * Computes bookable time slots for a date.
 *
 * - Slots are evenly spaced by `intervalMinutes`, starting at the open time.
 * - A slot is included only if start + interval <= close time.
 * - When `excludePastSlots` is true (date is today), slots whose start time
 *   has already passed relative to `now` are excluded.
 * - Returns an empty array when the day has no working hours or inputs are
 *   invalid.
 */
export const computeTimeSlots = (
  isoDate: string,
  workingHours: WorkingHours,
  intervalMinutes = 30,
  excludePastSlots = false,
  now: Date = new Date(),
): string[] => {
  if (!intervalMinutes || intervalMinutes <= 0) return [];

  const hours = hoursForDate(isoDate, workingHours);
  if (!hours) return [];

  const open = parseTime(hours.open);
  const close = parseTime(hours.close);
  if (open === null || close === null || open >= close) return [];

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: string[] = [];
  for (let start = open; start + intervalMinutes <= close; start += intervalMinutes) {
    if (excludePastSlots && start <= nowMinutes) continue;
    slots.push(formatSlotLabel(start));
  }
  return slots;
};
