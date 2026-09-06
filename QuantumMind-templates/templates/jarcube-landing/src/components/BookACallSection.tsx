import React from 'react';
import { site } from '../content/site';
import { buildWhatsAppLink, composeLeadMessage, messageTemplates } from '../utils/whatsapp';

/**
 * Closing call-to-action band, shared by /, /industry, the eight industry
 * detail routes and /partner.
 *
 * `industry` lets a detail page pre-fill the message with its own sector, so
 * the conversation starts with context rather than a blank "hi".
 */
interface BookACallSectionProps {
  /** Industry name, when rendered on an industry detail route. */
  industry?: string;
}

const BookACallSection: React.FC<BookACallSectionProps> = ({ industry }) => {
  const href = industry
    ? buildWhatsAppLink(
        site.whatsappNumber,
        composeLeadMessage(messageTemplates.industry, { industry }),
      )
    : buildWhatsAppLink(site.whatsappNumber, messageTemplates.general);

  return (
    <section className="jc-section jc-cta-band" aria-labelledby="jc-cta-heading">
      <div className="jc-container">
        <div className="jc-cta-band__inner">
          <span className="jc-eyebrow jc-cta-band__eyebrow">Talk to us</span>
          <h2 id="jc-cta-heading">
            Tell us what you are trying to automate
          </h2>
          <p className="jc-lead jc-cta-band__lead">
            Describe how your customer conversations run today and we will tell you
            what JarCube would change — plainly, and without a sales script.
          </p>
          <div className="jc-row jc-row--wrap jc-cta-band__actions">
            <a className="jc-btn jc-btn--primary jc-btn--lg" href={href}>
              Message us on WhatsApp
            </a>
            <a className="jc-btn jc-btn--secondary jc-btn--lg" href="/contact">
              Other ways to reach us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookACallSection;
