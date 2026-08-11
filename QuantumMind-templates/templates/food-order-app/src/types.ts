export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  image?: string;
  rating: number;
  description?: string;
  deliveryTime?: string;
}

export interface Labels {
  // Intro
  intro_tagline: string;
  get_started: string;
  // Browse
  home_greeting: string;
  search_placeholder: string;
  no_items: string;
  no_search_results: string;
  // Checkout
  order_summary: string;
  subtotal_label: string;
  tax_label: string;
  delivery_label: string;
  total_label: string;
  delivery_time_label: string;
  place_order: string;
  order_error: string;
  full_name: string;
  phone_number: string;
  notes: string;
  // Confirmation
  success_heading: string;
  // Navigation
  back: string;
  continue: string;
  // General
  add: string;
  remove: string;
  items_in_cart: string;
  [key: string]: string;
}

export interface FoodOrderConfig {
  // Branding
  brand_name: string;
  brand_logo: string;
  hero_image: string;

  // Theme
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  font_family: string;
  dark_mode: boolean;

  // Menu data
  categories: Category[];
  menu_items: MenuItem[];

  // Pricing / Delivery
  delivery_fee: number;
  tax_rate: number;
  estimated_delivery_time: string;
  currency: string;

  // Content
  success_message: string;
  success_cta_text: string;
  labels: Labels;
}

export interface OrderPayload {
  items: {
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  currency: string;
}

export type FoodStep = 'intro' | 'browse_menu' | 'checkout' | 'confirmation';

export type TransitionDirection = 'forward' | 'backward';

export type Cart = Map<string, number>;
