import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { DEFAULT_CONFIG, mergeConfig } from '../../config/defaults';
import type { SalonConfig } from '../../types';

// Feature: salon-booking-template
// Property 1: Config merging produces complete configuration
// Validates: Requirements 2.4, 2.6

const REQUIRED_KEYS: (keyof SalonConfig)[] = [
  'business_name',
  'business_logo',
  'hero_image',
  'hero_title',
  'hero_subtitle',
  'primary_color',
  'secondary_color',
  'text_color',
  'background_color',
  'font_family',
  'dark_mode',
  'services',
  'staff',
  'categories',
  'working_hours',
  'time_slot_interval',
  'show_staff_selection',
  'show_reviews',
  'reviews',
  'booking_settings',
  'success_message',
  'success_cta_text',
  'currency',
  'labels',
];

describe('Property 1: Config merging produces complete configuration', () => {
  it('every key resolves to a defined value for any partial config', () => {
    const partialArb = fc.record(
      {
        business_name: fc.string(),
        hero_title: fc.string(),
        primary_color: fc.string(),
        time_slot_interval: fc.integer({ min: 1, max: 120 }),
        dark_mode: fc.boolean(),
        show_reviews: fc.boolean(),
        currency: fc.constantFrom('USD', 'EUR', 'INR', ''),
        booking_settings: fc.record({
          allow_multiple_services: fc.boolean(),
          require_notes: fc.boolean(),
          advance_booking_days: fc.integer({ min: 1, max: 60 }),
        }),
        labels: fc.dictionary(fc.string(), fc.string()),
      },
      { requiredKeys: [] },
    );

    fc.assert(
      fc.property(partialArb, (partial) => {
        const merged = mergeConfig(partial as Partial<SalonConfig>);
        for (const key of REQUIRED_KEYS) {
          expect(merged[key]).toBeDefined();
          expect(merged[key]).not.toBeNull();
        }
        // booking_settings and labels always fully populated
        expect(merged.booking_settings.advance_booking_days).toBeTypeOf('number');
        expect(merged.labels.cta_book_now).toBeTruthy();
      }),
      { numRuns: 200 },
    );
  });

  it('uses fetched value when present, default when absent/empty', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (name) => {
          const merged = mergeConfig({ business_name: name });
          expect(merged.business_name).toBe(name);
          // An unspecified key falls back to default.
          expect(merged.hero_title).toBe(DEFAULT_CONFIG.hero_title);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('null or empty partial yields full defaults', () => {
    expect(mergeConfig(null)).toEqual(DEFAULT_CONFIG);
    expect(mergeConfig(undefined)).toEqual(DEFAULT_CONFIG);
    expect(mergeConfig({})).toEqual(DEFAULT_CONFIG);
  });
});
