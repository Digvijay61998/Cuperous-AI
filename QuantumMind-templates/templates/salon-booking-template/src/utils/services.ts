import type { Service } from '../types';

/** Returns only services whose category matches the given category id. */
export const filterServicesByCategory = (
  services: Service[],
  categoryId: string,
): Service[] => services.filter((s) => s.category === categoryId);

/**
 * Toggles a service in the selected set, enforcing the selection mode.
 * - Single mode (allowMultiple=false): selecting replaces the set with the
 *   one service; tapping the selected service clears the set.
 * - Multi mode (allowMultiple=true): toggles membership, capped at `max`.
 */
export const toggleService = (
  selected: Service[],
  service: Service,
  allowMultiple: boolean,
  max = 10,
): Service[] => {
  const isSelected = selected.some((s) => s.id === service.id);

  if (!allowMultiple) {
    return isSelected ? [] : [service];
  }

  if (isSelected) {
    return selected.filter((s) => s.id !== service.id);
  }
  if (selected.length >= max) {
    return selected; // cap reached, no change
  }
  return [...selected, service];
};

/** Sum of selected service prices, rounded to 2 decimal places. */
export const computeTotalPrice = (services: Service[]): number => {
  const sum = services.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  return Math.round(sum * 100) / 100;
};

/** True when both name and phone contain at least one non-whitespace char. */
export const isCustomerValid = (name: string, phone: string): boolean =>
  name.trim().length > 0 && phone.trim().length > 0;
