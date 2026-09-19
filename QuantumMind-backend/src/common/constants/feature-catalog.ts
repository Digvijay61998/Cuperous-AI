/**
 * The fixed catalog of gateable features. Plans and subscription overrides may
 * only reference these keys — arbitrary/free-form keys are rejected so a stored
 * flag always maps to real application behavior.
 *
 * Keys are grouped by convention: `channel.*` gate messaging channels, the rest
 * gate dashboard capabilities.
 */
export const FEATURE_CATALOG = [
  'channel.whatsapp_official',
  'channel.whatsapp_openwa',
  'channel.telegram',
  'channel.facebook',
  'question-bank',
  'advertisements',
  'offers',
] as const;

export type FeatureKey = (typeof FEATURE_CATALOG)[number];

const FEATURE_SET = new Set<string>(FEATURE_CATALOG);

export function isValidFeatureKey(key: string): key is FeatureKey {
  return FEATURE_SET.has(key);
}

/** Throws for any key not in the catalog. Used when persisting overrides. */
export function assertValidFeatureKeys(keys: string[]): void {
  const invalid = keys.filter((k) => !isValidFeatureKey(k));
  if (invalid.length) {
    throw new Error(`Unknown feature key(s): ${invalid.join(', ')}`);
  }
}
