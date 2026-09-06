import React from 'react';
import { industries, landingIndustrySlugs } from '../content/industries';
import Icon from './Icon';

/**
 * Landing-page industry cards.
 *
 * Shows a subset of the full eight, chosen by `landingIndustrySlugs`, with a
 * link through to the complete index. Cards read from the same industry content
 * module the detail pages use, so names and framing stay identical across the
 * site.
 */
const IndustryDemos: React.FC = () => {
  const shown = landingIndustrySlugs
    .map((slug) => industries.find((i) => i.slug === slug))
    .filter((i): i is (typeof industries)[number] => Boolean(i));

  if (shown.length === 0) return null;

  return (
    <section className="jc-section" aria-labelledby="jc-industries-heading">
      <div className="jc-container">
        <div className="jc-section-head jc-section-head--center">
          <span className="jc-eyebrow">By industry</span>
          <h2 id="jc-industries-heading">Built for how your business runs</h2>
          <p className="jc-lead">
            The manual work differs by sector. Find yours and see what gets
            handled automatically.
          </p>
        </div>

        <div className="jc-grid jc-grid--3">
          {shown.map((industry) => (
            <a
              key={industry.slug}
              className="jc-card jc-card--interactive jc-industry-card"
              href={`/industry/${industry.slug}`}
            >
              <span className="jc-icon-tile">
                <Icon name={industry.icon} className="jc-icon jc-icon--lg" />
              </span>
              <h3 className="jc-industry-card__name">{industry.name}</h3>
              <p className="jc-industry-card__question">{industry.question}</p>
              <p className="jc-industry-card__outcome">
                {industry.useCases[0]}
              </p>
              <span className="jc-industry-card__more" aria-hidden="true">
                See {industry.name} →
              </span>
            </a>
          ))}
        </div>

        <div className="jc-industry-demos__foot">
          <a className="jc-btn jc-btn--secondary" href="/industry">
            View all industries
          </a>
        </div>
      </div>
    </section>
  );
};

export default IndustryDemos;
