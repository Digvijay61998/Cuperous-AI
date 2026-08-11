const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);

/** Returns 'rtl' for known RTL language codes, 'ltr' otherwise. */
export const resolveDirection = (lang?: string): 'rtl' | 'ltr' => {
  if (!lang) return 'ltr';
  return RTL_LANGS.has(lang.toLowerCase().split('-')[0]) ? 'rtl' : 'ltr';
};

/**
 * Formats a monetary amount to exactly 2 fraction digits.
 * - With a valid currency code: uses Intl currency formatting.
 * - Without a currency code: locale-formatted number, no symbol.
 */
export const formatCurrency = (
  amount: number,
  currency?: string,
  locale = 'en',
): string => {
  const safeLocale = locale || 'en';
  if (currency && currency.trim()) {
    try {
      return new Intl.NumberFormat(safeLocale, {
        style: 'currency',
        currency: currency.trim().toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fall through to plain number formatting on invalid currency code.
    }
  }
  return new Intl.NumberFormat(safeLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats an ISO date (YYYY-MM-DD) with day, month, and year components,
 * localized to the given language.
 */
export const formatDate = (isoDate: string, locale = 'en'): string => {
  const safeLocale = locale || 'en';
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  try {
    return new Intl.DateTimeFormat(safeLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  }
};

/** Truncates a string beyond `max` chars, appending an ellipsis. */
export const truncate = (value: string, max = 60): string =>
  value.length <= max ? value : `${value.slice(0, max)}…`;
