// Shared TypeScript interfaces for the Salon Booking Template.
// These mirror the design document data model exactly.

export type BookingStep =
  | 'landing'
  | 'services'
  | 'schedule'
  | 'review'
  | 'confirmation';

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // minutes
  image?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  rating: number; // 1.0–5.0
  experience: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Review {
  author: string;
  rating: number;
  text: string;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "18:00"
}

export interface WorkingHours {
  monday?: DayHours | null;
  tuesday?: DayHours | null;
  wednesday?: DayHours | null;
  thursday?: DayHours | null;
  friday?: DayHours | null;
  saturday?: DayHours | null;
  sunday?: DayHours | null;
  [day: string]: DayHours | null | undefined;
}

export interface BookingSettings {
  allow_multiple_services: boolean;
  require_notes: boolean;
  advance_booking_days: number; // default 14
}

export interface Labels {
  cta_book_now: string;
  select_service: string;
  select_staff: string;
  select_date_time: string;
  your_details: string;
  confirm_booking: string;
  back: string;
  continue: string;
  full_name: string;
  phone_number: string;
  notes: string;
  no_services: string;
  no_availability: string;
  booking_error: string;
  retry: string;
  booking_summary: string;
  total: string;
  [key: string]: string;
}

export interface SalonConfig {
  // Branding
  business_name: string;
  business_logo: string;
  hero_image: string;
  hero_title: string;
  hero_subtitle: string;

  // Theme
  primary_color: string;
  secondary_color: string;
  text_color: string;
  background_color: string;
  font_family: string;
  dark_mode: boolean;

  // Services & Staff
  services: Service[];
  staff: Staff[];
  categories: Category[];

  // Scheduling
  working_hours: WorkingHours;
  time_slot_interval: number; // minutes

  // Feature toggles
  show_staff_selection: boolean;
  show_reviews: boolean;
  reviews: Review[];

  // Booking behavior
  booking_settings: BookingSettings;

  // Messages & labels
  success_message: string;
  success_cta_text: string;
  currency: string;
  labels: Labels;
}

export interface BookingPayload {
  services: { id: string; name: string; price: number; duration: number }[];
  staff?: { id: string; name: string };
  date: string; // ISO YYYY-MM-DD
  slot: string; // e.g. "10:30 AM"
  name: string;
  phone: string;
  notes?: string;
  totalPrice: number;
}
