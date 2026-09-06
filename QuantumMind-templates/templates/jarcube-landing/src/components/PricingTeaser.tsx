import React from 'react';
import { pricing } from '../content/pricing';
import { flags } from '../content/flags';
import { formatTierPrice, tierPriceSuffix } from '../utils/pricing';
import MetaChargesNote from './MetaChargesNote';

/**
 * Condensed pricing summary for the landing page.
 *
 * Reads the same pricing module /pricing uses, so the two surfaces cannot show
 * contradicting figures. Gated by two flags: the site-wide pricing flag, and a
 * teaser-specific one for hiding it from the landing page while leaving the
 * pricing page live.
 */
const PricingTeaser: React.FC = () => {
  if (!flags.pricing || !flags.pricingTeaser) return null;

  return (
    <section className="jc-section" aria-labelledby="jc-pricing-teaser-heading">
      <div className="jc-container">
        <div className="jc-section-head jc-section-head--center">
          <span className="jc-eyebrow">Pricing</span>
          <h2 id="jc-pricing-teaser-heading">Plans that grow with you</h2>
          <p className="jc-lead">
            Start small and move up when the volume justifies it. Every plan
            includes the shared inbox and automation.
          </p>
        </div>

        <div className="jc-grid jc-grid--4 jc-teaser-grid">
          {pricing.tiers.map((tier) => (
            <div
              key={tier.id}
              className={`jc-card jc-teaser${
                tier.mostPopular ? ' jc-teaser--popular' : ''
              }`}
            >
              {tier.mostPopular ? (
                <span className="jc-badge jc-badge--accent jc-teaser__flag">
                  Most popular
                </span>
              ) : null}
              <h3 className="jc-teaser__name">{tier.name}</h3>
              <p className="jc-teaser__price">
                <span className="jc-teaser__amount">
                  {formatTierPrice(tier, 'monthly', pricing.currencySymbol)}
                </span>
                <span className="jc-teaser__suffix">
                  {tierPriceSuffix(tier, 'monthly')}
                </span>
              </p>
              <p className="jc-teaser__limits">{tier.headlineLimits}</p>
            </div>
          ))}
        </div>

        <div className="jc-teaser-foot">
          <a className="jc-btn jc-btn--primary jc-btn--lg" href="/pricing">
            Compare all plans
          </a>
        </div>

        <MetaChargesNote />
      </div>
    </section>
  );
};

export default PricingTeaser;
