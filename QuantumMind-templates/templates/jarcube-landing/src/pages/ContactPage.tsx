import React from 'react';
import PageShell from '../components/PageShell';
import FaqSection from '../components/FaqSection';
import LeadForm from '../components/LeadForm';
import Icon from '../components/Icon';
import { site } from '../content/site';
import { buildWhatsAppLink, messageTemplates } from '../utils/whatsapp';

/**
 * Contact page.
 *
 * Every detail rendered here comes from site.ts. The office block omits itself
 * when no address is configured, so an empty `offices` array leaves a coherent
 * page rather than a heading over nothing.
 */
const ContactPage: React.FC = () => (
  <PageShell currentPath="/contact">
    <section className="jc-section jc-page-head" aria-labelledby="jc-contact-heading">
      <div className="jc-container">
        <div className="jc-split">
          <div>
            <span className="jc-eyebrow">Get in touch</span>
            <h1 id="jc-contact-heading">Let's talk about your setup</h1>
            <p className="jc-lead">
              Questions about how JarCube would fit the way you already work? Send
              us the details and we will give you a straight answer.
            </p>

            <ul className="jc-contact-list">
              <li>
                <span className="jc-icon-tile">
                  <Icon name="inbox" className="jc-icon jc-icon--lg" />
                </span>
                <div>
                  <h2 className="jc-contact-list__label">WhatsApp</h2>
                  {site.phones.map((phone) => (
                    <a
                      key={phone.e164}
                      className="jc-contact-list__value"
                      href={buildWhatsAppLink(phone.e164, messageTemplates.general)}
                    >
                      {phone.display}
                    </a>
                  ))}
                </div>
              </li>

              <li>
                <span className="jc-icon-tile">
                  <Icon name="clock" className="jc-icon jc-icon--lg" />
                </span>
                <div>
                  <h2 className="jc-contact-list__label">Call us</h2>
                  {site.phones.map((phone) => (
                    <a
                      key={phone.e164}
                      className="jc-contact-list__value"
                      href={`tel:+${phone.e164}`}
                    >
                      {phone.display}
                    </a>
                  ))}
                  <p className="jc-subtle">{site.officeHours}</p>
                </div>
              </li>

              <li>
                <span className="jc-icon-tile">
                  <Icon name="users" className="jc-icon jc-icon--lg" />
                </span>
                <div>
                  <h2 className="jc-contact-list__label">Email</h2>
                  {site.emails.map((email) => (
                    <a
                      key={email.address}
                      className="jc-contact-list__value"
                      href={`mailto:${email.address}`}
                    >
                      {email.address}
                    </a>
                  ))}
                </div>
              </li>
            </ul>

            <div className="jc-contact-social">
              <h2 className="jc-contact-list__label">Find us online</h2>
              <ul className="jc-row jc-row--wrap">
                {site.socials.map((s) => (
                  <li key={s.url}>
                    <a
                      className="jc-btn jc-btn--secondary"
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {s.platform}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="jc-card jc-form-card">
            <h2 className="jc-form-card__title">Send us a message</h2>
            <p className="jc-subtle jc-form-card__sub">
              Fill this in and it opens WhatsApp with your details ready to send.
            </p>
            <LeadForm
              template={messageTemplates.contact}
              fields={['name', 'business', 'phone', 'message']}
              submitLabel="Send message"
            />
          </div>
        </div>
      </div>
    </section>

    {site.offices.length > 0 ? (
      <section
        className="jc-section jc-section--sunken jc-section--tight"
        aria-labelledby="jc-offices-heading"
      >
        <div className="jc-container">
          <h2 id="jc-offices-heading" className="jc-offices__heading">
            Where we are
          </h2>
          <div className="jc-grid jc-grid--2">
            {site.offices.map((office) => (
              <div className="jc-card jc-office" key={office.label}>
                <h3>{office.label}</h3>
                <address>{office.address}</address>
              </div>
            ))}
          </div>
        </div>
      </section>
    ) : null}

    <FaqSection />
  </PageShell>
);

export default ContactPage;
