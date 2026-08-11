import { FoodOrderConfig } from '../types';

export const defaultConfig: FoodOrderConfig = {
  // Branding
  brand_name: 'Foodgo',
  brand_logo: '',
  hero_image: '',

  // Theme
  primary_color: '#FF6B00',
  secondary_color: '#FF8C42',
  accent_color: '#FF6B00',
  text_color: '#FFFFFF',
  background_color: '#2D2D3A',
  font_family: 'system-ui, -apple-system, sans-serif',
  dark_mode: true,

  // Menu data
  categories: [
    { id: 'all', name: 'All' },
    { id: 'combos', name: 'Combos' },
    { id: 'burgers', name: 'Burgers' },
    { id: 'sides', name: 'Sides' },
  ],
  menu_items: [
    {
      id: 'combo-classic',
      categoryId: 'combos',
      name: 'Classic Burger Combo',
      price: 18,
      rating: 4.8,
      description: 'Juicy beef patty with fries and a drink',
      deliveryTime: '24-32 mins',
    },
    {
      id: 'combo-chicken',
      categoryId: 'combos',
      name: 'Chicken Burger Combo',
      price: 16,
      rating: 4.7,
      description: 'Crispy chicken burger with fries and a drink',
      deliveryTime: '22-30 mins',
    },
    {
      id: 'burger-double',
      categoryId: 'burgers',
      name: 'Double Smash Burger',
      price: 22,
      rating: 4.9,
      description: 'Two smashed patties with cheese and special sauce',
      deliveryTime: '26-38 mins',
    },
    {
      id: 'burger-spicy',
      categoryId: 'burgers',
      name: 'Spicy Jalapeño Burger',
      price: 27,
      rating: 4.6,
      description: 'Beef patty with jalapeños, pepper jack, and hot sauce',
      deliveryTime: '28-42 mins',
    },
    {
      id: 'sides-fries',
      categoryId: 'sides',
      name: 'Loaded Cheese Fries',
      price: 8,
      rating: 4.5,
      description: 'Crispy fries topped with melted cheese and bacon bits',
      deliveryTime: '14-20 mins',
    },
    {
      id: 'sides-wings',
      categoryId: 'sides',
      name: 'BBQ Chicken Wings',
      price: 12,
      rating: 4.7,
      description: 'Smoky BBQ glazed chicken wings with ranch dip',
      deliveryTime: '18-28 mins',
    },
  ],

  // Pricing / Delivery
  delivery_fee: 1.5,
  tax_rate: 0.1,
  estimated_delivery_time: '24 mins',
  currency: 'USD',

  // Content
  success_message: 'Your order has been placed successfully!',
  success_cta_text: 'Go Back',
  labels: {
    intro_tagline: 'Delicious food delivered to your door',
    get_started: 'Order Now',
    home_greeting: 'Order your favourite food!',
    search_placeholder: 'Search food...',
    no_items: 'No menu items available',
    no_search_results: 'No items match your search',
    order_summary: 'Order Summary',
    subtotal_label: 'Subtotal',
    tax_label: 'Tax',
    delivery_label: 'Delivery Fee',
    total_label: 'Total',
    delivery_time_label: 'Estimated Delivery',
    place_order: 'Place Order',
    order_error: 'Order could not be placed. Please try again.',
    full_name: 'Full Name',
    phone_number: 'Phone Number',
    notes: 'Notes (optional)',
    success_heading: 'Success!',
    back: 'Back',
    continue: 'Continue',
    add: 'Add',
    remove: 'Remove',
    items_in_cart: '{count} items',
  },
};

/**
 * Deep-merges a partial config fetched from the backend with the full defaults,
 * ensuring every key resolves to either the fetched value or its default.
 */
export function mergeConfig(
  partial: Partial<FoodOrderConfig>,
  defaults: FoodOrderConfig = defaultConfig,
): FoodOrderConfig {
  const merged = { ...defaults };

  for (const key of Object.keys(defaults) as (keyof FoodOrderConfig)[]) {
    const fetched = partial[key];
    if (fetched === undefined || fetched === null) continue;

    if (key === 'labels') {
      const partialLabels = fetched as Record<string, string | undefined>;
      const cleanLabels: Record<string, string> = {};
      for (const [k, v] of Object.entries(partialLabels)) {
        if (v !== undefined && v !== null) cleanLabels[k] = v;
      }
      merged.labels = { ...defaults.labels, ...cleanLabels };
    } else {
      (merged as any)[key] = fetched;
    }
  }

  return merged;
}
