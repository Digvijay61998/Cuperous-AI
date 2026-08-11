import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { resolveDirection } from '../../utils/format';

// Feature: salon-booking-template
// Property 2: RTL direction determination
// Validates: Requirements 3.6, 14.2, 14.3

const RTL = ['ar', 'he', 'fa', 'ur'];

describe('Property 2: RTL direction determination', () => {
  it('returns rtl only for known RTL codes, ltr otherwise', () => {
    fc.assert(
      fc.property(fc.string(), (lang) => {
        const base = lang.toLowerCase().split('-')[0];
        const expected = RTL.includes(base) ? 'rtl' : 'ltr';
        expect(resolveDirection(lang)).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });

  it('returns rtl for each RTL code and its regional variants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RTL),
        fc.constantFrom('', '-EG', '-IR', '-IL', '-PK'),
        (code, region) => {
          expect(resolveDirection(`${code}${region}`)).toBe('rtl');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('defaults to ltr for empty/undefined input', () => {
    expect(resolveDirection('')).toBe('ltr');
    expect(resolveDirection(undefined)).toBe('ltr');
  });
});
