import { MenuItem } from '../types';

/**
 * Filters menu items by category.
 * Returns all items if categoryId is "all", otherwise returns only items matching the categoryId.
 */
export function filterByCategory(items: MenuItem[], categoryId: string): MenuItem[] {
  if (categoryId === 'all') {
    return items;
  }
  return items.filter((item) => item.categoryId === categoryId);
}

/**
 * Filters menu items by search query (case-insensitive name match).
 * Returns all items if query is an empty string.
 */
export function filterBySearch(items: MenuItem[], query: string): MenuItem[] {
  if (query === '') {
    return items;
  }
  const lowerQuery = query.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(lowerQuery));
}
