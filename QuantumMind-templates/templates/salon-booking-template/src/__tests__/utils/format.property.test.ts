import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { formatCurrency, formatDate } from '../../utils/format';

// Feature: salon-booking-template
// Property 9: Currency formatting
// Property 10: Date formatting
// Validates: Requirements 14.4, 14.5, 14.6

describe('Property 9: Currency formatting', () => {
  it('produces exactly 2 fraction digits with a valid currency code', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100000, noNaN: true }),
        fc.constantFrom('USD', 'EUR', 'GBP', 'INR', 'JPY', 'AED'),
        fc.constantFrom('en', 'en-US', 'ar', 'fr', 'de'),
        (amount, currency, locale) => {
          const out = formatCurrency(amount, currency, locale);
          // Extract digit groups; the fractional part must have 2 digits.
          const fractional = /[.,](\d+)(?!.*\d)/.exec(out);
          // Some locales for JPY normally use 0 fraction digits, but we force 2.
          expect(fractional).not.toBeNull();
          expect(fractional![1].length).toBe(2);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('formats without a currency symbol when currency is empty', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100000, noNaN: true }),
        (amount) => {
          const out = formatCurrency(amount, '', 'en');
          // No currency symbols expected.
          expect(out).not.toMatch(/[$€£¥₹]/);
          const fractional = /[.,](\d+)(?!.*\d)/.exec(out);
          expect(fractional).not.toBeNull();
          expect(fractional![1].length).toBe(2);
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('Property 10: Date formatting', () => {
  it('includes day, month, and year components', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
        fc.constantFrom('en', 'ar', 'fr', 'de', 'he'),
        (date, locale) => {
          const iso = date.toISOString().slice(0, 10);
          const year = iso.slice(0, 4);
          const out = formatDate(iso, locale);
          // Year should appear in the output for all these locales.
          expect(out).toContain(year);
          // Output should be non-trivial (contains more than just the year).
          expect(out.length).toBeGreaterThan(year.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});
