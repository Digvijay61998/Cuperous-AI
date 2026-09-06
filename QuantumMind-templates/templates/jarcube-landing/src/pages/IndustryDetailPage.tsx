import React from 'react';
import PageShell from '../components/PageShell';
import BookACallSection from '../components/BookACallSection';
import Icon from '../components/Icon';
import { industryBySlug } from '../content/industries';
import { site } from '../content/site';
import { buildWhatsAppLink, composeLeadMessage, messageTemplates } from '../utils/whatsapp';

/**
 * One implementation serving all eight industry detail routes.
 *
 * Each route's entry point passes its slug; content comes from the shared
 * industry module. Structural changes therefore apply to all eight at once,
 * rather than needing eight edits that can drift apart.
 */
interface IndustryDetailPageProps {
  slug: string;
}

const IndustryDetailPage: React.FC<IndustryDetailPageProps> = ({ slug }) => {
  const industry = industryBySlug(slug);

  // Guard against a route entry referencing a slug with no content behind it.
  if (!industry) {
    return (
      <PageShell currentPath={`/industry/${slug}`}>
        <section className="jc-section jc-page-head">
          <div className="jc-container jc-container--narrow">
            <h1>Industry not found</h1>
            <p className="jc-lead">
              We could not find that industry. Browse the full list instead.
            </p>
            <a className="jc-btn jc-btn--primary" href="/industry">
              All industries
            </a>
          </div>
        </section>
      </PageShell>
    );
  }

  const ctaHref = buildWhatsAppLink(
    site.whatsappNumber,
    composeLeadMessage(messageTemplates.industry, { industry: industry.name }),
  );

  return (
    <PageShell currentPath={`/industry/${industry.slug}`}>
      {/* Hero */}
      <section className="jc-section jc-page-head" aria-labelledby="jc-ind-heading">
        <div className="jc-container">
          <nav className="jc-breadcrumb" aria-label="Breadcrumb">
            <a href="/industry">Industries</a>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{industry.name}</span>
          </nav>

          <div className="jc-split">
            <div>
              <span className="jc-eyebrow">{industry.name}</span>
              <h1 id="jc-ind-heading">
                WhatsApp automation for {industry.name.toLowerCase()}
              </h1>
              <p className="jc-lead">{industry.painPoint}</p>
              <div className="jc-row jc-row--wrap jc-hero__actions">
                <a className="jc-btn jc-btn--primary jc-btn--lg" href={ctaHref}>
                  Talk to us about {industry.name.toLowerCase()}
                </a>
              </div>
            </div>

            <div className="jc-ind-glyph" aria-hidden="true">
              <Icon name={industry.icon} className="jc-ind-glyph__icon" />
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section
        className="jc-section jc-section--sunken"
        aria-labelledby="jc-ind-uses-heading"
      >
        <div className="jc-container">
          <div className="jc-section-head">
            <span className="jc-eyebrow">What gets handled</span>
            <h2 id="jc-ind-uses-heading">
              Work that stops needing a person
            </h2>
            <p className="jc-lead">
              These run on their own once set up, leaving your team the
              conversations that genuinely need judgement.
            </p>
          </div>

          <ul className="jc-usecases">
            {industry.useCases.map((useCase) => (
              <li className="jc-card jc-usecase" key={useCase}>
                <span className="jc-usecase__tick">
                  <Icon name="check" />
                </span>
                <p>{useCase}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <BookACallSection industry={industry.name} />
    </PageShell>
  );
};

export default IndustryDetailPage;
