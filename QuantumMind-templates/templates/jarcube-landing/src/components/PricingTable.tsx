import React, { useId, useState } from 'react';
import type { BillingPeriod, PricingTier } from '../types';
import { pricing } from '../content/pricing';
import { site } from '../content/site';
import Icon from './Icon';
import MetaChargesNote from './MetaChargesNote';
import {
  computeAdvertisedSavingsPct,
  formatAnnualSavings,
  formatTierPrice,
  tierPriceSuffix,
} from '../utils/pricing';
import { resolveTierCtaHref } from '../utils/whatsapp';

/**
 * Billing period toggle.
 *
 * Implemented as a radiogroup rather than a checkbox or a pair of buttons: two
 * mutually-exclusive named options is exactly what radio semantics describe, so
 * screen readers announce both the choice and which one is active without any
 * extra live-region plumbing.
 */
const BillingToggle: React.FC<{
  value: BillingPeriod;
  onChange: (next: BillingPeriod) => void;
  savingsPct: number | null;
}> = ({ value, onChange, savingsPct }) => {
  const uid = useId();

  const options: { id: BillingPeriod; label: string }[] = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'annual', label: 'Annual' },
  ];

  return (
    <div className="jc-billing">
      <div
        className="jc-billing__group"
        role="radiogroup"
        aria-label="Billing period"
      >
        {options.map((opt) => {
          const checked = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={checked}
              id={`${uid}-${opt.id}`}
              className={`jc-billing__opt${checked ? ' jc-billing__opt--on' : ''}`}
              onClick={() => onChange(opt.id)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {savingsPct !== null && savingsPct > 0 ? (
        <span className="jc-badge jc-badge--accent jc-billing__save">
          Save ~{savingsPct}% annually
        </span>
      ) : null}
    </div>
  );
};

const TierCard: React.FC<{ tier: PricingTier; period: BillingPeriod }> = ({
  tier,
  period,
}) => {
  const price = formatTierPrice(tier, period, pricing.currencySymbol);
  const suffix = tierPriceSuffix(tier, period);
  const annualSaving = period === 'annual'
    ? formatAnnualSavings(tier, pricing.currencySymbol)
    : null;

  const href = resolveTierCtaHref(
    tier.cta.kind,
    tier.name,
    site.whatsappNumber,
    site.signupUrl,
  );

  const limits = [
    tier.limits.agents,
    tier.limits.contacts,
    tier.limits.messages,
    tier.limits.flows,
    tier.limits.numbers,
  ];

  return (
    <div
      className={`jc-card jc-tier${tier.mostPopular ? ' jc-tier--popular' : ''}`}
    >
      {tier.mostPopular ? (
        <span className="jc-badge jc-badge--accent jc-tier__flag">
          Most popular
        </span>
      ) : null}

      <h3 className="jc-tier__name">{tier.name}</h3>
      <p className="jc-tier__positioning">{tier.positioning}</p>

      <p className="jc-tier__price">
        <span className="jc-tier__amount">{price}</span>
        {suffix ? <span className="jc-tier__suffix">{suffix}</span> : null}
      </p>

      {/* Reserve the line either way so cards stay aligned across the row. */}
      <p className="jc-tier__saving">{annualSaving ?? '\u00A0'}</p>

      <a
        className={`jc-btn jc-btn--block ${
          tier.mostPopular ? 'jc-btn--primary' : 'jc-btn--secondary'
        }`}
        href={href}
      >
        {tier.cta.label}
      </a>

      <ul className="jc-tier__limits">
        {limits.map((limit) => (
          <li key={limit}>{limit}</li>
        ))}
      </ul>

      <div className="jc-tier__features">
        <p className="jc-tier__inherits">
          {tier.inheritsFrom
            ? `Everything in ${tier.inheritsFrom}, plus:`
            : 'Includes:'}
        </p>
        <ul>
          {tier.features.map((feature) => (
            <li key={feature}>
              <Icon name="check" className="jc-icon jc-tier__tick" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/**
 * Full pricing table for /pricing.
 *
 * The advertised saving is derived from the tier prices themselves rather than
 * printed from a marketing constant, so the headline percentage cannot end up
 * contradicting the numbers directly beneath it.
 */
const PricingTable: React.FC = () => {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const savingsPct = computeAdvertisedSavingsPct(pricing.tiers);

  return (
    <>
      <BillingToggle value={period} onChange={setPeriod} savingsPct={savingsPct} />

      <div className="jc-tiers">
        {pricing.tiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} period={period} />
        ))}
      </div>

      <MetaChargesNote withAllowanceNote />
    </>
  );
};

export default PricingTable;
