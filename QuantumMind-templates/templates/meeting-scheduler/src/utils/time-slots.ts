import type { WorkingHours } from '../types';

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

/**
 * Get the day-of-week index (0=Sunday..6=Saturday) for a given ISO date
 * in the specified timezone.
 */
const getDayOfWeekInTimezone = (isoDate: string, timezone: string): number | null => {
  try {
    // Build a date-time at noon in UTC to avoid DST edge cases during parsing
    const dt = new Date(`${isoDate}T12:00:00Z`);
    if (Number.isNaN(dt.getTime())) return null;

    // Use Intl to get the weekday in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    });
    const weekday = formatter.format(dt);

    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return map[weekday] ?? null;
  } catch {
    return null;
  }
};

/**
 * Get current minutes-since-midnight in the given timezone.
 */
const getCurrentMinutesInTimezone = (now: Date, timezone: string): number => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return hour * 60 + minute;
  } catch {
    return now.getHours() * 60 + now.getMinutes();
  }
};

/**
 * Get today's date string (YYYY-MM-DD) in the given timezone.
 */
const getTodayInTimezone = (now: Date, timezone: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    // en-CA locale formats as YYYY-MM-DD
    return formatter.format(now);
  } catch {
    // Fallback to local date
    return now.toISOString().slice(0, 10);
  }
};

/**
 * Compute available time slots for a given date.
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @param workingHours - Weekly schedule from config
 * @param slotDuration - Duration in minutes (default 30)
 * @param timezone - IANA timezone string
 * @param now - Current Date object (for excluding past slots on today)
 * @returns Array of time strings in 12-hour format, e.g. ["9:00 AM", "9:30 AM"]
 */
export const computeTimeSlots = (
  date: string,
  workingHours: WorkingHours,
  slotDuration: number,
  timezone: string,
  now?: Date,
): string[] => {
  // Validate slotDuration
  if (!slotDuration || slotDuration <= 0 || !Number.isFinite(slotDuration)) return [];

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];

  // Get day-of-week in the target timezone
  const dayIndex = getDayOfWeekInTimezone(date, timezone);
  if (dayIndex === null) return [];

  const dayKey = DAY_KEYS[dayIndex];
  const hours = (workingHours?.[dayKey] as { open: string; close: string } | null | undefined) ?? null;
  if (!hours) return [];

  const open = parseTime(hours.open);
  const close = parseTime(hours.close);
  if (open === null || close === null || open >= close) return [];

  // Determine if we need to filter past slots (date is today in the given timezone)
  const referenceNow = now ?? new Date();
  const todayStr = getTodayInTimezone(referenceNow, timezone);
  const isToday = date === todayStr;
  const nowMinutes = isToday ? getCurrentMinutesInTimezone(referenceNow, timezone) : -1;

  const slots: string[] = [];
  for (let start = open; start + slotDuration <= close; start += slotDuration) {
    // Filter past slots: exclude if slot start time has already passed
    if (isToday && start <= nowMinutes) continue;
    slots.push(formatSlotLabel(start));
  }
  return slots;
};
