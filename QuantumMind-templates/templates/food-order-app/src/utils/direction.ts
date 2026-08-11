export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'] as const;

/**
 * Resolve text direction based on language code.
 * Returns 'rtl' for Arabic, Hebrew, Farsi, Urdu; 'ltr' for everything else.
 */
export function resolveDirection(lang: string): 'rtl' | 'ltr' {
  if (!lang) return 'ltr';
  const normalized = lang.toLowerCase().split('-')[0];
  return (RTL_LANGUAGES as readonly string[]).includes(normalized) ? 'rtl' : 'ltr';
}
