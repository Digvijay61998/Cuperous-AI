import { BeautyConfig } from '../types';

export const defaultConfig: BeautyConfig = {
  business_name: 'Glow Beauty Studio',
  business_logo: '',
  hero_image: '',
  hero_title: 'Book Your Beauty Experience',
  hero_subtitle:
    'Choose from our premium beauty services and book your appointment in minutes.',
  primary_color: '#E91E63',
  secondary_color: '#9C27B0',
  accent_color: '#FF5722',
  text_color: '#1A1A2E',
  background_color: '#FAFAFA',
  font_family: 'system-ui, -apple-system, sans-serif',
  dark_mode: false,
  categories: [
    { id: 'haircut', name: 'Haircut', icon: '💇', color: '#E91E63' },
    { id: 'facial', name: 'Facial', icon: '🧖', color: '#9C27B0' },
    { id: 'manicure', name: 'Manicure', icon: '💅', color: '#FF5722' },
    { id: 'pedicure', name: 'Pedicure', icon: '🦶', color: '#4CAF50' },
    { id: 'massage', name: 'Massage', icon: '💆', color: '#2196F3' },
    { id: 'waxing', name: 'Waxing', icon: '✨', color: '#FFC107' },
  ],
  services: [
    {
      id: 'haircut-women',
      categoryId: 'haircut',
      name: "Women's Haircut & Style",
      duration: 45,
      price: 55,
    },
    {
      id: 'haircut-men',
      categoryId: 'haircut',
      name: "Men's Haircut",
      duration: 30,
      price: 35,
    },
    {
      id: 'facial-classic',
      categoryId: 'facial',
      name: 'Classic Facial Treatment',
      duration: 60,
      price: 75,
    },
    {
      id: 'facial-deep',
      categoryId: 'facial',
      name: 'Deep Cleansing Facial',
      duration: 90,
      price: 95,
    },
    {
      id: 'manicure-classic',
      categoryId: 'manicure',
      name: 'Classic Manicure',
      duration: 30,
      price: 30,
    },
    {
      id: 'manicure-gel',
      categoryId: 'manicure',
      name: 'Gel Manicure',
      duration: 45,
      price: 45,
    },
    {
      id: 'pedicure-classic',
      categoryId: 'pedicure',
      name: 'Classic Pedicure',
      duration: 45,
      price: 40,
    },
    {
      id: 'pedicure-spa',
      categoryId: 'pedicure',
      name: 'Spa Pedicure',
      duration: 60,
      price: 60,
    },
    {
      id: 'massage-swedish',
      categoryId: 'massage',
      name: 'Swedish Massage',
      duration: 60,
      price: 80,
    },
    {
      id: 'massage-deep',
      categoryId: 'massage',
      name: 'Deep Tissue Massage',
      duration: 60,
      price: 90,
    },
    {
      id: 'waxing-full-legs',
      categoryId: 'waxing',
      name: 'Full Legs Waxing',
      duration: 45,
      price: 50,
    },
    {
      id: 'waxing-arms',
      categoryId: 'waxing',
      name: 'Full Arms Waxing',
      duration: 30,
      price: 35,
    },
  ],
  working_hours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '18:00' },
    sunday: null,
  },
  time_slot_interval: 30,
  advance_booking_days: 14,
  currency: 'USD',
  success_message: 'Your appointment is confirmed!',
  success_cta_text: 'Return to Chat',
  labels: {
    start_booking: 'Start Booking',
    browse_services: 'Browse Services',
    select_date_time: 'Select Date & Time',
    your_details: 'Your Details',
    confirmation: 'Confirmation',
    back: 'Back',
    continue: 'Continue',
    add: 'Add',
    remove: 'Remove',
    full_name: 'Full Name',
    phone_number: 'Phone Number',
    notes: 'Notes (optional)',
    confirm_booking: 'Confirm Booking',
    no_services: 'No services available in this category',
    no_availability: 'No availability for this date',
    booking_error: 'Booking could not be completed. Please try again.',
    services_selected: '{count} services',
    total: 'Total',
    retry: 'Retry',
    select_different_date: 'Please select a different date',
  },
};

/**
 * Deep-merges a partial config fetched from the backend with the full defaults,
 * ensuring every key resolves to either the fetched value or its default.
 */
export function mergeConfig(
  partial: Partial<BeautyConfig>,
  defaults: BeautyConfig = defaultConfig,
): BeautyConfig {
  const merged = { ...defaults };

  for (const key of Object.keys(defaults) as (keyof BeautyConfig)[]) {
    const fetched = partial[key];
    if (fetched === undefined || fetched === null) continue;

    if (key === 'labels') {
      const partialLabels = fetched as Record<string, string | undefined>;
      const cleanLabels: Record<string, string> = {};
      for (const [k, v] of Object.entries(partialLabels)) {
        if (v !== undefined) cleanLabels[k] = v;
      }
      merged.labels = { ...defaults.labels, ...cleanLabels };
    } else if (key === 'working_hours') {
      merged.working_hours = { ...defaults.working_hours, ...(fetched as typeof defaults.working_hours) };
    } else {
      (merged as any)[key] = fetched;
    }
  }

  return merged;
}
