import React from 'react';
import { features } from '../content/features';
import Icon from './Icon';

/**
 * Landing feature grid.
 *
 * Each card is one anchor wrapping its whole content rather than a div with a
 * "read more" link inside it — a single focusable target per card, so keyboard
 * users tab through five stops instead of ten.
 */
const FeatureGrid: React.FC = () => (
  <section className="jc-section" aria-labelledby="jc-features-heading">
    <div className="jc-container">
      <div className="jc-section-head jc-section-head--center">
        <span className="jc-eyebrow">The platform</span>
        <h2 id="jc-features-heading">Everything you need on one number</h2>
        <p className="jc-lead">
          Five parts that work together. Use the ones you need now and turn on the
          rest when you get to them.
        </p>
      </div>

      <div className="jc-grid jc-grid--3">
        {features.map((feature) => (
          <a
            key={feature.slug}
            className="jc-card jc-card--interactive jc-feature-card"
            href={`/features/${feature.slug}`}
          >
            <span className="jc-icon-tile">
              <Icon name={feature.icon} className="jc-icon jc-icon--lg" />
            </span>
            <h3 className="jc-feature-card__title">{feature.cardTitle}</h3>
            <p className="jc-feature-card__body">{feature.cardSummary}</p>
            <span className="jc-feature-card__more" aria-hidden="true">
              Learn more →
            </span>
          </a>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureGrid;
