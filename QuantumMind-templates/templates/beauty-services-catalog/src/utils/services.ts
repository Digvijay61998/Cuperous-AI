import { Service } from '../types';

/**
 * Filter services by category ID.
 */
export function filterByCategory(services: Service[], categoryId: string): Service[] {
  return services.filter((s) => s.categoryId === categoryId);
}

/**
 * Truncate a service name to maxLength characters.
 * If the name exceeds maxLength, returns prefix + "…" (at most maxLength + 1 for ellipsis character).
 */
export function truncateName(name: string, maxLength: number = 50): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + '…';
}

/**
 * Compute total price of selected services, rounded to 2 decimal places.
 */
export function computeTotalPrice(services: Service[]): number {
  const sum = services.reduce((acc, s) => acc + s.price, 0);
  return Math.round(sum * 100) / 100;
}

/**
 * Check if at least one service is selected.
 */
export function isSelectionValid(services: Service[]): boolean {
  return services.length >= 1;
}
