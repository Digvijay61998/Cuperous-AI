import React from 'react';
import PageShell from '../components/PageShell';
import { site } from '../content/site';

/**
 * Legal page scaffold, shared by the privacy policy and terms routes.
 *
 * The body text here is a plain-language starting point covering what the site
 * and platform actually do. It is deliberately not lifted from another company's
 * policy — a policy has to describe your real data handling to be worth
 * anything, and copying one produces a document that misdescribes your business.
 *
 * Have your own counsel review and extend this before launch.
 */
interface LegalPageProps {
  kind: 'privacy' | 'terms';
}

const lastUpdated = 'February 2026';

const privacySections: { heading: string; body: string[] }[] = [
  {
    heading: 'What this covers',
    body: [
      `This policy explains what information ${site.brandName} collects when you use this website or the ${site.brandName} platform, why we collect it, and what choices you have.`,
    ],
  },
  {
    heading: 'Information you give us',
    body: [
      'When you submit an enquiry form on this site, the details you type are used to compose a WhatsApp message that you then choose to send. The form itself does not transmit anything to our servers — the message goes directly from your device to WhatsApp.',
      'If you go on to become a customer, we collect the account details needed to run the service: your name, business name, contact details and billing information.',
    ],
  },
  {
    heading: 'Information we collect automatically',
    body: [
      'Like most websites, we may record basic technical information such as your browser type, approximate location and the pages you visit, to understand how the site is used and where it can be improved.',
    ],
  },
  {
    heading: 'Customer conversation data',
    body: [
      `Where you use ${site.brandName} to manage WhatsApp conversations, we process the messages and contact records in your account so the platform can function. That data belongs to you. We do not sell it, and we do not use it to train models for other customers.`,
    ],
  },
  {
    heading: 'Third parties',
    body: [
      'WhatsApp messaging is delivered through Meta, and their handling of message data is governed by their own terms. We also use service providers for hosting, analytics and payment processing, each with access limited to what their function requires.',
    ],
  },
  {
    heading: 'Retention and security',
    body: [
      'We keep information for as long as your account is active, or as long as needed to meet legal and accounting obligations. We apply access controls and encryption in transit to protect it.',
    ],
  },
  {
    heading: 'Your choices',
    body: [
      'You can ask us what we hold about you, request a correction, or ask us to delete it. Get in touch and we will act on it.',
    ],
  },
];

const termsSections: { heading: string; body: string[] }[] = [
  {
    heading: 'Agreement',
    body: [
      `By using this website or the ${site.brandName} platform you agree to these terms. If you are agreeing on behalf of a business, you confirm you have authority to do so.`,
    ],
  },
  {
    heading: 'The service',
    body: [
      `${site.brandName} provides a platform for managing WhatsApp Business conversations, including a shared inbox, automation, AI assistance and campaign tools. Which capabilities you can access depends on your plan.`,
    ],
  },
  {
    heading: 'Your responsibilities',
    body: [
      'You are responsible for the content of the messages you send and for having a lawful basis to contact the people you message. You must comply with WhatsApp and Meta platform policies, and with applicable marketing and data protection law in your jurisdiction.',
      'You are responsible for keeping your account credentials secure and for activity carried out under your account.',
    ],
  },
  {
    heading: 'Fees and messaging charges',
    body: [
      'Subscription fees are payable in advance for the billing period you select. WhatsApp per-message charges are set by Meta and billed to you separately — your subscription covers the platform, automation, AI and team features only.',
    ],
  },
  {
    heading: 'Availability',
    body: [
      'We work to keep the service available and will give notice of planned maintenance where we can. Parts of the service depend on WhatsApp infrastructure that is outside our control.',
    ],
  },
  {
    heading: 'Suspension',
    body: [
      'We may suspend an account that breaches these terms, puts platform access at risk, or is used to send unlawful or abusive messages.',
    ],
  },
  {
    heading: 'Changes',
    body: [
      'We may update these terms as the service develops. Material changes will be communicated before they take effect.',
    ],
  },
];

const LegalPage: React.FC<LegalPageProps> = ({ kind }) => {
  const isPrivacy = kind === 'privacy';
  const title = isPrivacy ? 'Privacy policy' : 'Terms of service';
  const sections = isPrivacy ? privacySections : termsSections;
  const path = isPrivacy ? '/legal/privacy-policy' : '/legal/terms-of-service';

  return (
    <PageShell currentPath={path}>
      <section className="jc-section jc-page-head" aria-labelledby="jc-legal-heading">
        <div className="jc-container jc-container--narrow">
          <span className="jc-eyebrow">Legal</span>
          <h1 id="jc-legal-heading">{title}</h1>
          <p className="jc-subtle">Last updated {lastUpdated}</p>

          <div className="jc-prose jc-legal">
            {sections.map((section) => (
              <article className="jc-prose__block" key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body.map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
              </article>
            ))}

            <article className="jc-prose__block">
              <h2>Contact</h2>
              <p>
                Questions about this {isPrivacy ? 'policy' : 'agreement'}? Reach us
                at{' '}
                <a href={`mailto:${site.emails[0]?.address}`}>
                  {site.emails[0]?.address}
                </a>
                .
              </p>
            </article>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default LegalPage;
