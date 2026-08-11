import type { MenuItem } from '../types';

/**
 * Compute the subtotal for all items in the cart.
 * Sum of (price × quantity) for each cart entry.
 */
export function computeSubtotal(cart: Map<string, number>, menuItems: MenuItem[]): number {
  let subtotal = 0;
  for (const [itemId, quantity] of cart) {
    const item = menuItems.find((mi) => mi.id === itemId);
    if (item) {
      subtotal += item.price * quantity;
    }
  }
  return subtotal;
}

/**
 * Compute tax amount from subtotal and tax rate.
 */
export function computeTax(subtotal: number, taxRate: number): number {
  return subtotal * taxRate;
}

/**
 * Compute the order total from subtotal, tax, and delivery fee.
 */
export function computeTotal(subtotal: number, tax: number, deliveryFee: number): number {
  return subtotal + tax + deliveryFee;
}

/**
 * Get the total number of items in the cart (sum of all quantities).
 */
export function getCartItemCount(cart: Map<string, number>): number {
  let count = 0;
  for (const quantity of cart.values()) {
    count += quantity;
  }
  return count;
}

/**
 * Add an item to the cart. Returns a new Map with the item's quantity incremented by 1.
 * Does not mutate the original cart.
 */
export function addToCart(cart: Map<string, number>, itemId: string): Map<string, number> {
  const newCart = new Map(cart);
  const currentQuantity = newCart.get(itemId) ?? 0;
  newCart.set(itemId, currentQuantity + 1);
  return newCart;
}

/**
 * Remove an item from the cart. Returns a new Map with the item's quantity decremented by 1.
 * If the quantity reaches 0, the key is removed from the map.
 * Does not mutate the original cart.
 */
export function removeFromCart(cart: Map<string, number>, itemId: string): Map<string, number> {
  const newCart = new Map(cart);
  const currentQuantity = newCart.get(itemId) ?? 0;
  if (currentQuantity <= 1) {
    newCart.delete(itemId);
  } else {
    newCart.set(itemId, currentQuantity - 1);
  }
  return newCart;
}
