import React from 'react';
import Wordmark from './Wordmark';
import LeadForm from './LeadForm';
import { site } from '../content/site';
import { flags } from '../content/flags';
import { messageTemplates } from '../utils/whatsapp';

/**
 * Site footer.
 *
 * The company column mirrors the nav's flag filtering — pricing is omitted
 * when the flag is off so there is no orphaned link here either.
 */
const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  const companyLinks = [
    ...(flags.pricing ? [{ label: 'Pricing', href: '/pricing' }] : []),
    { label: 'Industries', href: '/industry' },
    { label: 'Become a partner', href: '/partner' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact us', href: '/contact' },
  ];

  const featureLinks = [
    { label: 'Shared inbox', href: '/features/shared-inbox' },
    { label: 'Flow builder', href: '/features/flow-builder' },
    { label: 'AI knowledge base', href: '/features/knowledge-base' },
    { label: 'Campaigns', href: '/features/marketing-campaigns' },
    { label: 'API & webhooks', href: '/features/whatsapp-api-integration' },
  ];

  return (
    <footer className="jc-footer">
      <div className="jc-container">
        <div className="jc-footer__top">
          <div className="jc-footer__brand">
            <a href="/" aria-label={`${site.brandName} home`}>
              <Wordmark />
            </a>
            <p className="jc-footer__tagline">{site.tagline}</p>
          </div>

          <nav className="jc-footer__col" aria-label="Company">
            <h2 className="jc-footer__heading">Company</h2>
            <ul className="jc-footer__list">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <a className="jc-footer__link" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="jc-footer__col" aria-label="Features">
            <h2 className="jc-footer__heading">Platform</h2>
            <ul className="jc-footer__list">
              {featureLinks.map((l) => (
                <li key={l.href}>
                  <a className="jc-footer__link" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="jc-footer__col" aria-label="Social">
            <h2 className="jc-footer__heading">Follow</h2>
            <ul className="jc-footer__list">
              {site.socials.map((s) => (
                <li key={s.url}>
                  <a
                    className="jc-footer__link"
                    href={s.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {s.platform}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="jc-footer__col jc-footer__col--wide">
            <h2 className="jc-footer__heading">Newsletter</h2>
            <p className="jc-footer__note">
              Occasional, practical notes on getting more out of WhatsApp Business.
            </p>
            <LeadForm
              template={messageTemplates.newsletter}
              fields={['email']}
              submitLabel="Subscribe"
              layout="inline"
              className="jc-form--compact"
            />
          </div>
        </div>

        <div className="jc-footer__bottom">
          <p className="jc-footer__copy">
            © {year} {site.legalEntity}. All rights reserved.
          </p>
          <ul className="jc-footer__legal">
            <li>
              <a className="jc-footer__link" href="/legal/privacy-policy">
                Privacy policy
              </a>
            </li>
            <li>
              <a className="jc-footer__link" href="/legal/terms-of-service">
                Terms of service
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
