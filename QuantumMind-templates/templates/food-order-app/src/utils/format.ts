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
