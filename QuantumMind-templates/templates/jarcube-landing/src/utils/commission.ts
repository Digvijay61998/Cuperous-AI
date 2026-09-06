import type { CommissionRow, PartnerConfig } from '../types';

/**
 * Partner commission illustration.
 *
 * Every figure in the rendered table is computed here from the rate and the
 * example sales value in partner.ts. Nothing is hard-coded in markup, so
 * changing `commissionRatePct` updates the whole table at once and the columns
 * cannot silently disagree with each other.
 */

/** Round to whole currency units — these are illustrative rupee figures. */
const roundCurrency = (value: number): number => Math.round(value);

/**
 * Build the month-by-month rows.
 *
 * Each month earns commission on that month's sales; the cumulative column is
 * the running total, reflecting that commission recurs rather than being a
 * one-off on signup. Growth percentage tracks the cumulative position as a
 * multiple of the base rate.
 */
export function computeCommissionRows(
  config: Pick<
    PartnerConfig,
    'commissionRatePct' | 'monthlySalesExample' | 'exampleMonths'
  >,
): CommissionRow[] {
  const { commissionRatePct, monthlySalesExample, exampleMonths } = config;
  const rate = commissionRatePct / 100;

  const rows: CommissionRow[] = [];
  let cumulative = 0;

  for (let month = 1; month <= exampleMonths; month += 1) {
    const commission = roundCurrency(monthlySalesExample * rate);
    cumulative += commission;

    rows.push({
      month,
      sales: monthlySalesExample,
      commission,
      cumulative,
      growthPct: commissionRatePct * month,
    });
  }

  return rows;
}

/** Total commission across the illustrated period. */
export function totalCommission(rows: CommissionRow[]): number {
  return rows.length === 0 ? 0 : rows[rows.length - 1].cumulative;
}

/** Indian digit grouping for the table cells. */
export function formatCurrencyValue(
  value: number,
  currencySymbol: string,
): string {
  const grouped = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value);
  return `${currencySymbol}${grouped}`;
}
