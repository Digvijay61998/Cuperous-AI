import { EcommerceConfig } from '../types';

export const defaultConfig: EcommerceConfig = {
  // Branding
  brand_name: 'Stylish',
  brand_logo: '',
  hero_image: '',
  tagline: 'You want Authentic, here you go!',
  subtitle: 'Find it here, buy it now!',

  // Theme — light
  primary_color: '#F83758',
  secondary_color: '#FF4B6E',
  accent_color: '#F83758',
  text_color: '#000000',
  background_color: '#FFFFFF',
  font_family: 'system-ui, -apple-system, sans-serif',
  dark_mode: false,

  // Catalog data
  categories: [
    { id: 'all', name: 'All' },
    { id: 'womens-fashion', name: "Women's Fashion" },
    { id: 'mens-fashion', name: "Men's Fashion" },
    { id: 'accessories', name: 'Accessories' },
  ],
  products: [
    {
      id: 'womens-heel-01',
      categoryId: 'womens-fashion',
      name: 'Women Printed Kurta',
      description: 'Neque porro quisquam est qui dolorem ipsum ouia',
      price: 1500,
      originalPrice: 2999,
      discount: 50,
      rating: 4.5,
      reviewCount: 56890,
      sizes: ['6 UK', '7 UK', '8 UK', '9 UK', '10 UK'],
    },
    {
      id: 'womens-dress-02',
      categoryId: 'womens-fashion',
      name: 'HRX by Hrithik Roshan',
      description: 'Neque porro quisquam est qui dolorem ipsum quia',
      price: 2499,
      originalPrice: 4999,
      discount: 50,
      rating: 4.7,
      reviewCount: 34567,
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      id: 'mens-sneaker-01',
      categoryId: 'mens-fashion',
      name: 'Nike Sneakers',
      description: 'Vision Alta Men\'s Shoes Size (All Colours)',
      price: 1500,
      originalPrice: 2999,
      discount: 50,
      rating: 4.8,
      reviewCount: 56890,
      sizes: ['6 UK', '7 UK', '8 UK', '9 UK', '10 UK'],
    },
    {
      id: 'mens-tshirt-02',
      categoryId: 'mens-fashion',
      name: 'IWC Schaffhausen',
      description: '2021 Pilot\'s Watch "PLAYS OF COLOR"',
      price: 3500,
      originalPrice: 7000,
      discount: 50,
      rating: 4.6,
      reviewCount: 12345,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      id: 'acc-bag-01',
      categoryId: 'accessories',
      name: 'Black Winter Bag',
      description: 'Stylish winter bag for daily use',
      price: 999,
      originalPrice: 1999,
      discount: 50,
      rating: 4.3,
      reviewCount: 8900,
      sizes: ['One Size'],
    },
    {
      id: 'acc-watch-02',
      categoryId: 'accessories',
      name: 'Elegant Wrist Watch',
      description: 'Premium analog watch with leather strap',
      price: 2500,
      originalPrice: 5000,
      discount: 50,
      rating: 4.9,
      reviewCount: 23456,
      sizes: ['One Size'],
    },
  ],

  // Pricing / Delivery
  delivery_fee: 30,
  tax_rate: 0,
  estimated_delivery_time: '1 within Hour',
  currency: 'INR',

  // Content
  success_message: 'Payment done successfully.',
  success_cta_text: 'Continue',
  labels: {
    intro_tagline: 'You want Authentic, here you go!',
    intro_subtitle: 'Find it here, buy it now!',
    get_started: 'Get Started',
    search_placeholder: 'Search any Product..',
    no_products: 'No products available',
    no_search_results: 'No products match your search',
    add_to_cart: 'Add to Cart',
    go_to_cart: 'Go to cart',
    buy_now: 'Buy Now',
    size_label: 'Size:',
    product_details: 'Product Details',
    delivery_in: 'Delivery in',
    shopping_list: 'Shopping List',
    subtotal_label: 'Subtotal',
    delivery_fee_label: 'Delivery Fee',
    total_label: 'Order Total',
    proceed_to_payment: 'Proceed to Payment',
    order_error: 'Order could not be placed. Please try again.',
    full_name: 'Full Name',
    phone_number: 'Phone Number',
    success_heading: 'Success!',
    back: 'Back',
    continue: 'Continue',
    items_in_cart: '{count} items',
    free: 'Free',
  },
};

/**
 * Deep-merges a partial config fetched from the backend with the full defaults,
 * ensuring every key resolves to either the fetched value or its default.
 */
export function mergeConfig(
  partial: Partial<EcommerceConfig>,
  defaults: EcommerceConfig = defaultConfig,
): EcommerceConfig {
  const merged = { ...defaults };

  for (const key of Object.keys(defaults) as (keyof EcommerceConfig)[]) {
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
