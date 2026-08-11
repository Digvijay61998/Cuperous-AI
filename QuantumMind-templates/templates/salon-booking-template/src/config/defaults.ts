import type { Labels, SalonConfig } from '../types';

// Default UI labels (English). Every user-facing string resolves through here.
export const DEFAULT_LABELS: Labels = {
  cta_book_now: 'Book Now',
  select_service: 'Select a service',
  select_staff: 'Choose a specialist',
  select_date_time: 'Pick a date & time',
  your_details: 'Your details',
  confirm_booking: 'Confirm booking',
  back: 'Back',
  continue: 'Continue',
  full_name: 'Full name',
  phone_number: 'Phone number',
  notes: 'Notes',
  no_services: 'No services available in this category.',
  no_availability: 'No availability on this day. Please pick another date.',
  booking_error:
    'We could not complete your booking. Please try again.',
  retry: 'Retry',
  booking_summary: 'Booking summary',
  total: 'Total',
};

// Complete default config used for Demo Mode and as the merge baseline.
// Covers every key in the manifest templateConfig schema so the flow is
// fully navigable without a backend.
export const DEFAULT_CONFIG: SalonConfig = {
  business_name: 'Glow Beauty Studio',
  business_logo: '',
  hero_image: '',
  hero_title: 'Book your appointment',
  hero_subtitle: "Pick a service, choose a time, and you're all set.",

  primary_color: '#7A5CFF',
  secondary_color: '#FF6BA8',
  text_color: '#1A1D29',
  background_color: '#F5F6FA',
  font_family: '',
  dark_mode: false,

  categories: [
    { id: 'hair', name: 'Hair' },
    { id: 'skin', name: 'Skin' },
    { id: 'nails', name: 'Nails' },
  ],

  services: [
    {
      id: 'haircut',
      name: 'Haircut & Styling',
      category: 'hair',
      price: 35,
      duration: 45,
    },
    {
      id: 'color',
      name: 'Hair Coloring',
      category: 'hair',
      price: 80,
      duration: 90,
    },
    {
      id: 'facial',
      name: 'Signature Facial',
      category: 'skin',
      price: 60,
      duration: 60,
    },
    {
      id: 'cleanup',
      name: 'Express Clean-up',
      category: 'skin',
      price: 30,
      duration: 30,
    },
    {
      id: 'manicure',
      name: 'Classic Manicure',
      category: 'nails',
      price: 25,
      duration: 30,
    },
    {
      id: 'pedicure',
      name: 'Spa Pedicure',
      category: 'nails',
      price: 40,
      duration: 45,
    },
  ],

  staff: [
    {
      id: 'ava',
      name: 'Ava Bennett',
      role: 'Senior Stylist',
      rating: 4.9,
      experience: '10 yrs',
    },
    {
      id: 'maya',
      name: 'Maya Rodriguez',
      role: 'Beauty Therapist',
      rating: 4.8,
      experience: '7 yrs',
    },
    {
      id: 'leah',
      name: 'Leah Chen',
      role: 'Nail Artist',
      rating: 4.7,
      experience: '5 yrs',
    },
  ],

  working_hours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '20:00' },
    saturday: { open: '10:00', close: '16:00' },
    sunday: null,
  },
  time_slot_interval: 30,

  show_staff_selection: true,
  show_reviews: true,
  reviews: [
    {
      author: 'Priya S.',
      rating: 5,
      text: 'Amazing service, my hair has never looked better!',
    },
    {
      author: 'Jordan M.',
      rating: 5,
      text: 'Friendly staff and super easy to book.',
    },
    {
      author: 'Fatima A.',
      rating: 4,
      text: 'Great experience, will definitely return.',
    },
  ],

  booking_settings: {
    allow_multiple_services: true,
    require_notes: false,
    advance_booking_days: 14,
  },

  success_message: 'Your appointment is confirmed!',
  success_cta_text: 'Return to chat',
  currency: 'USD',
  labels: DEFAULT_LABELS,
};

/**
 * Merges a partial/fetched config with the full defaults so that every key
 * resolves to either the fetched value or the default value — never undefined.
 * Nested objects (booking_settings, labels) are merged one level deep.
 */
export const mergeConfig = (
  fetched: Partial<SalonConfig> | null | undefined,
  defaults: SalonConfig = DEFAULT_CONFIG,
): SalonConfig => {
  const f = (fetched || {}) as Partial<SalonConfig>;

  const isEmpty = (v: unknown) =>
    v === undefined ||
    v === null ||
    v === '' ||
    (Array.isArray(v) && v.length === 0);

  const pick = <K extends keyof SalonConfig>(key: K): SalonConfig[K] =>
    isEmpty(f[key]) ? defaults[key] : (f[key] as SalonConfig[K]);

  return {
    business_name: pick('business_name'),
    business_logo: isEmpty(f.business_logo)
      ? defaults.business_logo
      : (f.business_logo as string),
    hero_image: isEmpty(f.hero_image)
      ? defaults.hero_image
      : (f.hero_image as string),
    hero_title: pick('hero_title'),
    hero_subtitle: pick('hero_subtitle'),

    primary_color: pick('primary_color'),
    secondary_color: pick('secondary_color'),
    text_color: pick('text_color'),
    background_color: pick('background_color'),
    font_family: isEmpty(f.font_family)
      ? defaults.font_family
      : (f.font_family as string),
    dark_mode:
      typeof f.dark_mode === 'boolean' ? f.dark_mode : defaults.dark_mode,

    services: pick('services'),
    staff: pick('staff'),
    categories: pick('categories'),

    working_hours: isEmpty(f.working_hours)
      ? defaults.working_hours
      : (f.working_hours as SalonConfig['working_hours']),
    time_slot_interval:
      typeof f.time_slot_interval === 'number' && f.time_slot_interval > 0
        ? f.time_slot_interval
        : defaults.time_slot_interval,

    show_staff_selection:
      typeof f.show_staff_selection === 'boolean'
        ? f.show_staff_selection
        : defaults.show_staff_selection,
    show_reviews:
      typeof f.show_reviews === 'boolean'
        ? f.show_reviews
        : defaults.show_reviews,
    reviews: pick('reviews'),

    booking_settings: {
      ...defaults.booking_settings,
      ...(f.booking_settings || {}),
    },

    success_message: pick('success_message'),
    success_cta_text: pick('success_cta_text'),
    currency: isEmpty(f.currency)
      ? defaults.currency
      : (f.currency as string),
    labels: {
      ...defaults.labels,
      ...(f.labels || {}),
    },
  };
};
