// Shared TypeScript interfaces for the Meeting Scheduler Template.
// These mirror the design document data model exactly.

export type SchedulerStep = 'calendar' | 'confirmation';

// Internal step state includes success as a sub-state of confirmation
export type InternalStep = 'calendar' | 'confirmation' | 'success';

export interface DayHours {
  open: string; // "09:00" (24h format)
  close: string; // "17:00"
}

export interface WorkingHours {
  monday?: DayHours | null;
  tuesday?: DayHours | null;
  wednesday?: DayHours | null;
  thursday?: DayHours | null;
  friday?: DayHours | null;
  saturday?: DayHours | null;
  sunday?: DayHours | null;
}

export interface MeetingLabels {
  confirm_heading: string; // "Confirm Your Booking"
  name_label: string; // "Name"
  name_placeholder: string; // "Enter your name"
  email_label: string; // "Email"
  email_placeholder: string; // "Enter your email"
  phone_label: string; // "Phone (optional)"
  phone_placeholder: string; // "Enter your phone number"
  confirm_button: string; // "Confirm Booking"
  back: string; // "Back"
  next: string; // "Next"
  no_availability: string; // "No available times for this date"
  booking_error: string; // "Booking could not be completed. Please try again."
  close_instruction: string; // "You may close this window"
  [key: string]: string;
}

export interface MeetingConfig {
  // Branding
  business_name: string;
  business_logo: string; // URL or empty string
  meeting_title: string;
  meeting_subtitle: string;
  meeting_description: string;
  meeting_duration: number; // minutes

  // Theme
  primary_color: string; // default "#0060E6"
  text_color: string;
  background_color: string;
  font_family: string; // default "Inter"
  dark_mode: boolean;

  // Scheduling
  working_hours: WorkingHours;
  slot_duration: number; // minutes, default 30
  advance_booking_days: number; // default 30

  // Form behavior
  show_phone_field: boolean;

  // Post-booking
  success_message: string;
  auto_close_delay: number; // seconds, default 3

  // Messages & labels
  labels: MeetingLabels;
}

export interface MeetingBookingPayload {
  date: string; // ISO YYYY-MM-DD
  slot: string; // e.g. "10:30 AM"
  name: string;
  email: string;
  phone?: string; // included only if show_phone_field && non-empty
  timezone: string; // IANA timezone
  meeting_duration: number; // minutes
}

export interface AppState {
  step: InternalStep;
  config: MeetingConfig;
  loading: boolean;
  selectedDate: string; // ISO YYYY-MM-DD or ''
  selectedSlot: string; // e.g. "10:30 AM" or ''
  selectedTimezone: string; // IANA timezone, e.g. "America/New_York"
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  submitting: boolean;
  error: string;
}
