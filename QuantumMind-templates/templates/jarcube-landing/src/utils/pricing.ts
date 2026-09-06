import type { BillingPeriod, PricingTier } from '../types';

/**
 * Pricing display helpers.
 *
 * Both /pricing and the landing-page teaser call these, which is what keeps
 * the two surfaces from ever showing contradicting figures.
 */

/** Label shown where a tier has no fixed price (Enterprise). */
export const CUSTOM_PRICE_LABEL = 'Custom';

/** Indian digit grouping, no decimals — prices here are whole rupees. */
const groupDigits = (value: number): string =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);

/**
 * Format a tier's price for the given billing period.
 *
 * A null price for the selected period yields the custom label rather than a
 * numeric string, so Enterprise never renders as "₹0".
 */
export function formatTierPrice(
  tier: PricingTier,
  period: BillingPeriod,
  currencySymbol: string,
): string {
  const amount = period === 'monthly' ? tier.monthly : tier.annual;
  if (amount === null) return CUSTOM_PRICE_LABEL;
  return `${currencySymbol}${groupDigits(amount)}`;
}

/** Suffix beside the price. Empty for custom-priced tiers. */
export function tierPriceSuffix(
  tier: PricingTier,
  period: BillingPeriod,
): string {
  const amount = period === 'monthly' ? tier.monthly : tier.annual;
  if (amount === null) return '';
  return period === 'monthly' ? '/month' : '/year';
}

/** True when this tier shows a real figure for the selected period. */
export function hasNumericPrice(
  tier: PricingTier,
  period: BillingPeriod,
): boolean {
  return (period === 'monthly' ? tier.monthly : tier.annual) !== null;
}

/**
 * Actual annual saving against paying monthly for twelve months.
 *
 * Derived from the prices themselves rather than trusting a hard-coded
 * marketing figure — so the displayed discount cannot drift out of step with
 * the listed prices. Returns null when either price is absent.
 */
export function computeAnnualSavingsPct(
  monthly: number | null,
  annual: number | null,
): number | null {
  if (monthly === null || annual === null) return null;
  if (monthly <= 0) return null;

  const fullYear = monthly * 12;
  if (annual >= fullYear) return 0;

  return Math.round(((fullYear - annual) / fullYear) * 100);
}

/**
 * Saving to advertise across the range.
 *
 * Uses the smallest real saving among tiers rather than the largest, so the
 * headline claim is true of every tier it appears above rather than only the
 * best case.
 */
export function computeAdvertisedSavingsPct(
  tiers: PricingTier[],
): number | null {
  const savings = tiers
    .map((t) => computeAnnualSavingsPct(t.monthly, t.annual))
    .filter((s): s is number => s !== null && s > 0);

  if (savings.length === 0) return null;
  return Math.min(...savings);
}

/** Money saved in absolute terms, for a per-tier annual note. */
export function computeAnnualSavingsAmount(
  monthly: number | null,
  annual: number | null,
): number | null {
  if (monthly === null || annual === null) return null;
  const diff = monthly * 12 - annual;
  return diff > 0 ? diff : null;
}

/** Formatted absolute annual saving, or null when there is none. */
export function formatAnnualSavings(
  tier: PricingTier,
  currencySymbol: string,
): string | null {
  const amount = computeAnnualSavingsAmount(tier.monthly, tier.annual);
  if (amount === null) return null;
  return `Save ${currencySymbol}${groupDigits(amount)}`;
}

/** The tier flagged most popular, if any. */
export function findMostPopular(tiers: PricingTier[]): PricingTier | undefined {
  return tiers.find((t) => t.mostPopular);
}
