import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  computeTotalPrice,
  filterServicesByCategory,
  toggleService,
} from '../../utils/services';
import { truncate } from '../../utils/format';
import type { Service } from '../../types';

// Feature: salon-booking-template
// Property 3: Service filtering by category
// Property 4: Service name truncation
// Property 5: Service selection mode enforcement
// Property 7: Total price computation
// Validates: Requirements 5.2, 5.3, 5.5, 5.6, 8.5

const serviceArb = (): fc.Arbitrary<Service> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string(),
    category: fc.constantFrom('a', 'b', 'c'),
    price: fc.double({ min: 0, max: 1000, noNaN: true }),
    duration: fc.integer({ min: 5, max: 240 }),
  });

describe('Property 3: Service filtering by category', () => {
  it('returns exactly the services matching the category', () => {
    fc.assert(
      fc.property(
        fc.array(serviceArb(), { maxLength: 40 }),
        fc.constantFrom('a', 'b', 'c'),
        (services, category) => {
          const result = filterServicesByCategory(services, category);
          // Only matching services.
          expect(result.every((s) => s.category === category)).toBe(true);
          // All matching services present.
          const expected = services.filter((s) => s.category === category);
          expect(result.length).toBe(expected.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('Property 4: Service name truncation', () => {
  it('leaves names <=60 chars unchanged, truncates longer with ellipsis', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (name) => {
        const out = truncate(name, 60);
        if (name.length <= 60) {
          expect(out).toBe(name);
        } else {
          expect(out.length).toBe(61); // 60 chars + ellipsis
          expect(out.endsWith('…')).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('Property 5: Service selection mode enforcement', () => {
  it('single mode holds at most 1; multi mode holds at most 10', () => {
    fc.assert(
      fc.property(
        fc.array(serviceArb(), { minLength: 1, maxLength: 30 }),
        fc.boolean(),
        (services, allowMultiple) => {
          let selected: Service[] = [];
          // Apply a sequence of toggles across all services twice.
          for (const s of [...services, ...services]) {
            selected = toggleService(selected, s, allowMultiple, 10);
            if (allowMultiple) {
              expect(selected.length).toBeLessThanOrEqual(10);
            } else {
              expect(selected.length).toBeLessThanOrEqual(1);
            }
            // No duplicates ever.
            const ids = new Set(selected.map((x) => x.id));
            expect(ids.size).toBe(selected.length);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('single mode: selecting a new service replaces the previous', () => {
    fc.assert(
      fc.property(
        serviceArb(),
        serviceArb(),
        (a, b) => {
          fc.pre(a.id !== b.id);
          let selected = toggleService([], a, false);
          expect(selected).toEqual([a]);
          selected = toggleService(selected, b, false);
          expect(selected).toEqual([b]);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Property 7: Total price computation', () => {
  it('equals the sum of prices rounded to 2 decimals', () => {
    fc.assert(
      fc.property(fc.array(serviceArb(), { maxLength: 20 }), (services) => {
        const total = computeTotalPrice(services);
        const expected =
          Math.round(services.reduce((a, s) => a + s.price, 0) * 100) / 100;
        expect(total).toBeCloseTo(expected, 2);
      }),
      { numRuns: 200 },
    );
  });
});
