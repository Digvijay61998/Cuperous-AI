import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { computeTimeSlots } from '../../utils/time-slots';
import type { WorkingHours } from '../../types';

// Feature: salon-booking-template
// Property 6: Time slot computation
// Validates: Requirements 7.4, 7.5

const toMinutes = (label: string): number => {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(label)!;
  let h = Number(m[1]) % 12;
  if (m[3] === 'PM') h += 12;
  return h * 60 + Number(m[2]);
};

// A fixed non-today weekday date (well in the future) to avoid past-slot exclusion.
const FUTURE_MONDAY = '2999-01-04'; // a Monday

describe('Property 6: Time slot computation', () => {
  it('produces evenly-spaced slots strictly within working hours', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }), // open hour
        fc.integer({ min: 1, max: 12 }), // duration in hours added to open
        fc.constantFrom(15, 30, 45, 60), // interval
        (openHour, spanHours, interval) => {
          const closeHour = Math.min(23, openHour + spanHours);
          fc.pre(closeHour > openHour);

          const open = `${String(openHour).padStart(2, '0')}:00`;
          const close = `${String(closeHour).padStart(2, '0')}:00`;
          const wh: WorkingHours = { monday: { open, close } };

          const openM = openHour * 60;
          const closeM = closeHour * 60;

          const slots = computeTimeSlots(FUTURE_MONDAY, wh, interval, false);
          const mins = slots.map(toMinutes);

          // (a) every slot at/after open, (b) start + interval <= close
          for (const m of mins) {
            expect(m).toBeGreaterThanOrEqual(openM);
            expect(m + interval).toBeLessThanOrEqual(closeM);
          }
          // (c) evenly spaced by interval
          for (let i = 1; i < mins.length; i++) {
            expect(mins[i] - mins[i - 1]).toBe(interval);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('returns empty array when the day has no working hours', () => {
    fc.assert(
      fc.property(fc.constantFrom(15, 30, 45, 60), (interval) => {
        const wh: WorkingHours = { monday: null };
        expect(computeTimeSlots(FUTURE_MONDAY, wh, interval, false)).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });

  it('excludes past slots for today', () => {
    fc.assert(
      fc.property(fc.constantFrom(15, 30, 60), (interval) => {
        // Full-day working hours so there is always something to exclude.
        const wh: WorkingHours = { monday: null };
        const now = new Date();
        const dayKeys = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ] as const;
        wh[dayKeys[now.getDay()]] = { open: '00:00', close: '23:59' };

        const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        const slots = computeTimeSlots(todayYmd, wh, interval, true, now);
        for (const s of slots) {
          expect(toMinutes(s)).toBeGreaterThan(nowMinutes);
        }
      }),
      { numRuns: 100 },
    );
  });
});
