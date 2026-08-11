import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { isCustomerValid } from '../../utils/services';

// Feature: salon-booking-template
// Property 8: Form validation for booking confirmation
// Validates: Requirements 8.6

describe('Property 8: Form validation for booking confirmation', () => {
  it('valid iff both name and phone have a non-whitespace char', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (name, phone) => {
        const expected =
          name.trim().length > 0 && phone.trim().length > 0;
        expect(isCustomerValid(name, phone)).toBe(expected);
      }),
      { numRuns: 300 },
    );
  });

  it('whitespace-only strings are invalid', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { maxLength: 10 }),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (blank, real) => {
          expect(isCustomerValid(blank, real)).toBe(false);
          expect(isCustomerValid(real, blank)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
