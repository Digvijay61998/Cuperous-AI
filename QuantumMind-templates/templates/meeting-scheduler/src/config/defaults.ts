import type { MeetingConfig, MeetingLabels } from '../types';

// Default UI labels (English). Every user-facing string resolves through here.
export const DEFAULT_LABELS: MeetingLabels = {
  confirm_heading: 'Confirm Your Booking',
  name_label: 'Name',
  name_placeholder: 'Enter your name',
  email_label: 'Email',
  email_placeholder: 'Enter your email',
  phone_label: 'Phone (optional)',
  phone_placeholder: 'Enter your phone number',
  confirm_button: 'Confirm Booking',
  back: 'Back',
  next: 'Next',
  no_availability: 'No available times for this date',
  booking_error: 'Booking could not be completed. Please try again.',
  close_instruction: 'You may close this window',
};

// Complete default config used for Demo Mode and as the merge baseline.
// Covers every key in the manifest templateConfig schema so the flow is
// fully navigable without a backend.
export const DEFAULT_CONFIG: MeetingConfig = {
  // Branding
  business_name: 'Acme Corp',
  business_logo: '',
  meeting_title: 'Book a Meeting',
  meeting_subtitle: 'Schedule a time that works for you.',
  meeting_description:
    'Pick a date and time to connect with our team. We look forward to speaking with you.',
  meeting_duration: 30,

  // Theme
  primary_color: '#0060E6',
  text_color: '#1A1D29',
  background_color: '#FFFFFF',
  font_family: 'Inter',
  dark_mode: false,

  // Scheduling
  working_hours: {
    monday: { open: '09:00', close: '17:00' },
    tuesday: { open: '09:00', close: '17:00' },
    wednesday: { open: '09:00', close: '17:00' },
    thursday: { open: '09:00', close: '17:00' },
    friday: { open: '09:00', close: '17:00' },
    saturday: null,
    sunday: null,
  },
  slot_duration: 30,
  advance_booking_days: 30,

  // Form behavior
  show_phone_field: true,

  // Post-booking
  success_message: 'Your meeting has been scheduled!',
  auto_close_delay: 3,

  // Messages & labels
  labels: DEFAULT_LABELS,
};

/**
 * Merges a partial/fetched config with the full defaults so that every key
 * resolves to either the fetched value or the default value — never undefined.
 * Nested objects (labels) are merged one level deep.
 */
export const mergeConfig = (
  fetched: Partial<MeetingConfig> | null | undefined,
  defaults: MeetingConfig = DEFAULT_CONFIG,
): MeetingConfig => {
  const f = (fetched || {}) as Partial<MeetingConfig>;

  const isEmpty = (v: unknown) =>
    v === undefined ||
    v === null ||
    v === '' ||
    (Array.isArray(v) && v.length === 0);

  const pick = <K extends keyof MeetingConfig>(key: K): MeetingConfig[K] =>
    isEmpty(f[key]) ? defaults[key] : (f[key] as MeetingConfig[K]);

  return {
    business_name: pick('business_name'),
    business_logo: isEmpty(f.business_logo)
      ? defaults.business_logo
      : (f.business_logo as string),
    meeting_title: pick('meeting_title'),
    meeting_subtitle: pick('meeting_subtitle'),
    meeting_description: pick('meeting_description'),
    meeting_duration:
      typeof f.meeting_duration === 'number' && f.meeting_duration > 0
        ? f.meeting_duration
        : defaults.meeting_duration,

    primary_color: pick('primary_color'),
    text_color: pick('text_color'),
    background_color: pick('background_color'),
    font_family: isEmpty(f.font_family)
      ? defaults.font_family
      : (f.font_family as string),
    dark_mode:
      typeof f.dark_mode === 'boolean' ? f.dark_mode : defaults.dark_mode,

    working_hours: isEmpty(f.working_hours)
      ? defaults.working_hours
      : (f.working_hours as MeetingConfig['working_hours']),
    slot_duration:
      typeof f.slot_duration === 'number' && f.slot_duration > 0
        ? f.slot_duration
        : defaults.slot_duration,
    advance_booking_days:
      typeof f.advance_booking_days === 'number' &&
      f.advance_booking_days > 0
        ? f.advance_booking_days
        : defaults.advance_booking_days,

    show_phone_field:
      typeof f.show_phone_field === 'boolean'
        ? f.show_phone_field
        : defaults.show_phone_field,

    success_message: pick('success_message'),
    auto_close_delay:
      typeof f.auto_close_delay === 'number' && f.auto_close_delay >= 0
        ? f.auto_close_delay
        : defaults.auto_close_delay,

    labels: {
      ...defaults.labels,
      ...(f.labels || {}),
    },
  };
};
