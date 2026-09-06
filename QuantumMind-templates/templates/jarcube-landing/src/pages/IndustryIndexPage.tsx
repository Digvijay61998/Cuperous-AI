import React from 'react';
import PageShell from '../components/PageShell';
import BookACallSection from '../components/BookACallSection';
import Icon from '../components/Icon';
import { industries } from '../content/industries';

/**
 * Industry index.
 *
 * Cards read from the shared industry content module, so a name or pain-point
 * edit lands here, on the matching detail page, and on the landing-page demo
 * grid at the same time.
 */
const IndustryIndexPage: React.FC = () => (
  <PageShell currentPath="/industry">
    <section className="jc-section jc-page-head" aria-labelledby="jc-industry-heading">
      <div className="jc-container">
        <div className="jc-section-head jc-section-head--center">
          <span className="jc-eyebrow">Industries</span>
          <h1 id="jc-industry-heading">Find the version built for your sector</h1>
          <p className="jc-lead">
            The repetitive work looks different in every industry. Pick yours to see
            what JarCube takes off your team's hands.
          </p>
        </div>

        <div className="jc-grid jc-grid--3">
          {industries.map((industry) => (
            <a
              key={industry.slug}
              className="jc-card jc-card--interactive jc-industry-card"
              href={`/industry/${industry.slug}`}
            >
              <span className="jc-icon-tile">
                <Icon name={industry.icon} className="jc-icon jc-icon--lg" />
              </span>
              <h2 className="jc-industry-card__name">{industry.name}</h2>
              <p className="jc-industry-card__outcome">{industry.painPoint}</p>
              <span className="jc-industry-card__more" aria-hidden="true">
                See {industry.name} →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>

    <BookACallSection />
  </PageShell>
);

export default IndustryIndexPage;
