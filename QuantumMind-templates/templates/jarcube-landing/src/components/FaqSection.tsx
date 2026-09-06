import React, { useId, useState } from 'react';
import { faq } from '../content/faq';
import { site } from '../content/site';
import { buildWhatsAppLink, messageTemplates } from '../utils/whatsapp';

/**
 * FAQ accordion, shared by /, /partner and /contact.
 *
 * Answers are present in the initial HTML rather than fetched, so they are
 * indexable and readable with JavaScript off. Collapsing is done with a
 * `hidden` attribute on the answer region — the text exists either way.
 */
const FaqSection: React.FC = () => {
  const uid = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faq.length === 0) return null;

  return (
    <section className="jc-section" aria-labelledby={`${uid}-heading`}>
      <div className="jc-container">
        <div className="jc-faq">
          <div className="jc-faq__aside">
            <span className="jc-eyebrow">FAQs</span>
            <h2 id={`${uid}-heading`}>Questions we get asked a lot</h2>
            <p className="jc-lead">
              If your question is not here, ask it directly — we will give you a
              straight answer.
            </p>
            <a
              className="jc-btn jc-btn--secondary"
              href={buildWhatsAppLink(site.whatsappNumber, messageTemplates.general)}
            >
              Ask us on WhatsApp
            </a>
          </div>

          <ul className="jc-faq__list">
            {faq.map((entry, index) => {
              const isOpen = openIndex === index;
              const btnId = `${uid}-q-${index}`;
              const panelId = `${uid}-a-${index}`;

              return (
                <li className="jc-faq__item" key={entry.question}>
                  <h3 className="jc-faq__question-wrap">
                    <button
                      type="button"
                      id={btnId}
                      className="jc-faq__question"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                    >
                      <span>{entry.question}</span>
                      <svg
                        className="jc-faq__chevron"
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d={isOpen ? 'M5 12h14' : 'M12 5v14M5 12h14'} />
                      </svg>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    className="jc-faq__answer"
                    hidden={!isOpen}
                  >
                    <p>{entry.answer}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
