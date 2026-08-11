export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  images?: string[];
  rating: number;
  reviewCount?: number;
  sizes?: string[];
  colors?: string[];
  deliveryEstimate?: string;
}

export interface Labels {
  intro_tagline: string;
  intro_subtitle: string;
  get_started: string;
  search_placeholder: string;
  no_products: string;
  no_search_results: string;
  add_to_cart: string;
  go_to_cart: string;
  buy_now: string;
  size_label: string;
  product_details: string;
  delivery_in: string;
  shopping_list: string;
  subtotal_label: string;
  delivery_fee_label: string;
  total_label: string;
  proceed_to_payment: string;
  order_error: string;
  full_name: string;
  phone_number: string;
  success_heading: string;
  back: string;
  continue: string;
  items_in_cart: string;
  free: string;
  [key: string]: string;
}

export interface EcommerceConfig {
  // Branding
  brand_name: string;
  brand_logo: string;
  hero_image: string;
  tagline: string;
  subtitle: string;

  // Theme
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  font_family: string;
  dark_mode: boolean;

  // Catalog data
  categories: Category[];
  products: Product[];

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

export interface CartEntry {
  productId: string;
  size: string;
  quantity: number;
}

export interface OrderPayload {
  items: {
    productId: string;
    name: string;
    size: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  customerPhone: string;
  currency: string;
}

export type EcomStep = 'intro' | 'browse' | 'detail' | 'checkout' | 'confirmation';

export type TransitionDirection = 'forward' | 'backward';
