export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  duration: number;
  price: number;
  image?: string;
  description?: string;
}

export interface WorkingHours {
  monday?: { open: string; close: string } | null;
  tuesday?: { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?: { open: string; close: string } | null;
  friday?: { open: string; close: string } | null;
  saturday?: { open: string; close: string } | null;
  sunday?: { open: string; close: string } | null;
}

export interface Labels {
  start_booking: string;
  browse_services: string;
  select_date_time: string;
  your_details: string;
  confirmation: string;
  back: string;
  continue: string;
  add: string;
  remove: string;
  full_name: string;
  phone_number: string;
  notes: string;
  confirm_booking: string;
  no_services: string;
  no_availability: string;
  booking_error: string;
  services_selected: string;
  total: string;
  retry: string;
  select_different_date: string;
  [key: string]: string;
}

export interface BeautyConfig {
  business_name: string;
  business_logo: string;
  hero_image: string;
  hero_title: string;
  hero_subtitle: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  font_family: string;
  dark_mode: boolean;
  categories: Category[];
  services: Service[];
  working_hours: WorkingHours;
  time_slot_interval: number;
  advance_booking_days: number;
  currency: string;
  success_message: string;
  success_cta_text: string;
  labels: Labels;
}

export interface BookingPayload {
  services: { id: string; name: string; price: number; duration: number }[];
  date: string;
  slot: string;
  name: string;
  phone: string;
  notes?: string;
  totalPrice: number;
}

export type BeautyStep =
  | 'welcome'
  | 'browse_services'
  | 'date_time'
  | 'your_details'
  | 'confirmation';

export type TransitionDirection = 'forward' | 'backward';
