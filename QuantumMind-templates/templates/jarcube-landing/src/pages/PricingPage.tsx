import React from 'react';
import PageShell from '../components/PageShell';
import PricingTable from '../components/PricingTable';
import FaqSection from '../components/FaqSection';
import BookACallSection from '../components/BookACallSection';
import { flags } from '../content/flags';
import { site } from '../content/site';
import { buildWhatsAppLink, messageTemplates } from '../utils/whatsapp';

/**
 * Pricing page.
 *
 * When the pricing flag is off this renders a contact-sales panel instead of the
 * tier cards. Combined with the nav and footer omitting their pricing links, the
 * route stays reachable by direct URL but never advertises figures that are not
 * meant to be public yet.
 */
const PricingPage: React.FC = () => (
  <PageShell currentPath="/pricing">
    <section className="jc-section jc-page-head" aria-labelledby="jc-pricing-heading">
      <div className="jc-container">
        <div className="jc-section-head jc-section-head--center">
          <span className="jc-eyebrow">Pricing</span>
          <h1 id="jc-pricing-heading">
            {flags.pricing
              ? 'Straightforward plans, no surprises'
              : "Let's find the right fit for your business"}
          </h1>
          <p className="jc-lead">
            {flags.pricing
              ? 'Pick the plan that matches your team size and conversation volume. Move up whenever you outgrow it.'
              : 'Tell us your team size, conversation volume and what you need automated, and we will put together a plan that fits.'}
          </p>
        </div>

        {flags.pricing ? (
          <PricingTable />
        ) : (
          <div className="jc-row jc-row--wrap jc-pricing-fallback">
            <a
              className="jc-btn jc-btn--primary jc-btn--lg"
              href={buildWhatsAppLink(site.whatsappNumber, messageTemplates.general)}
            >
              Talk to sales on WhatsApp
            </a>
            <a className="jc-btn jc-btn--secondary jc-btn--lg" href="/contact">
              Send an enquiry
            </a>
          </div>
        )}
      </div>
    </section>

    <FaqSection />
    <BookACallSection />
  </PageShell>
);

export default PricingPage;
