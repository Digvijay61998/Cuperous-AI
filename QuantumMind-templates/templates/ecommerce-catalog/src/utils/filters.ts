import { Product } from '../types';

/**
 * Filters products by category.
 * Returns all products if categoryId is "all", otherwise returns only products matching the categoryId.
 */
export function filterByCategory(products: Product[], categoryId: string): Product[] {
  if (categoryId === 'all') {
    return products;
  }
  return products.filter((product) => product.categoryId === categoryId);
}

/**
 * Filters products by search query (case-insensitive name match).
 * Returns all products if query is an empty string.
 */
export function filterBySearch(products: Product[], query: string): Product[] {
  if (query === '') {
    return products;
  }
  const lowerQuery = query.toLowerCase();
  return products.filter((product) => product.name.toLowerCase().includes(lowerQuery));
}
