import type { CartEntry, Product } from '../types';

/**
 * Build a composite cart key from productId and size.
 */
export function cartKey(productId: string, size: string): string {
  return `${productId}:${size}`;
}

/**
 * Add an item to the cart. Returns a new Map with the entry's quantity incremented by 1.
 */
export function addToCart(
  cart: Map<string, CartEntry>,
  productId: string,
  size: string,
): Map<string, CartEntry> {
  const newCart = new Map(cart);
  const key = cartKey(productId, size);
  const existing = newCart.get(key);
  if (existing) {
    newCart.set(key, { ...existing, quantity: existing.quantity + 1 });
  } else {
    newCart.set(key, { productId, size, quantity: 1 });
  }
  return newCart;
}

/**
 * Remove an item from the cart. Decrements quantity by 1; removes key if quantity reaches 0.
 */
export function removeFromCart(
  cart: Map<string, CartEntry>,
  productId: string,
  size: string,
): Map<string, CartEntry> {
  const newCart = new Map(cart);
  const key = cartKey(productId, size);
  const existing = newCart.get(key);
  if (!existing) return newCart;
  if (existing.quantity <= 1) {
    newCart.delete(key);
  } else {
    newCart.set(key, { ...existing, quantity: existing.quantity - 1 });
  }
  return newCart;
}

/**
 * Get the total number of items in the cart (sum of all quantities).
 */
export function getCartItemCount(cart: Map<string, CartEntry>): number {
  let count = 0;
  for (const entry of cart.values()) {
    count += entry.quantity;
  }
  return count;
}

/**
 * Compute the subtotal for all items in the cart.
 * Sum of (product price × quantity) for each cart entry.
 */
export function computeSubtotal(cart: Map<string, CartEntry>, products: Product[]): number {
  let subtotal = 0;
  for (const entry of cart.values()) {
    const product = products.find((p) => p.id === entry.productId);
    if (product) {
      subtotal += product.price * entry.quantity;
    }
  }
  return subtotal;
}

/**
 * Compute the order total from subtotal and delivery fee.
 */
export function computeTotal(subtotal: number, deliveryFee: number): number {
  return subtotal + deliveryFee;
}
