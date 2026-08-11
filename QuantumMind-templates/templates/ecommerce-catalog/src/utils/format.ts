/**
 * Format a number as currency with exactly 2 decimal places.
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for invalid locale/currency
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a rating as a numeric value with 1 decimal place followed by ★.
 */
export function formatRating(rating: number): string {
  return `${rating.toFixed(1)} ★`;
}
