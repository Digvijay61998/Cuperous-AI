import React from 'react';
import { site } from '../content/site';
import { buildWhatsAppLink, messageTemplates } from '../utils/whatsapp';
import Icon from './Icon';

/**
 * Landing hero.
 *
 * The product visual is a stylised chat thread built from divs and SVG rather
 * than a screenshot — it stays crisp at any density, themes with the tokens,
 * and adds nothing to the image payload.
 */
const Hero: React.FC = () => (
  <section className="jc-hero" aria-labelledby="jc-hero-heading">
    <div className="jc-container">
      <div className="jc-split jc-split--wide-start">
        <div className="jc-hero__copy">
          <span className="jc-eyebrow">WhatsApp Business platform</span>

          <h1 id="jc-hero-heading">
            Every customer conversation, handled
          </h1>

          <p className="jc-lead jc-hero__lead">
            Your customers already message you on WhatsApp. JarCube makes sure
            somebody — or something — always answers: a shared inbox for your
            team, an AI assistant trained on your own material, and flows that
            carry people from first question to booked or paid.
          </p>

          <div className="jc-row jc-row--wrap jc-hero__actions">
            <a
              className="jc-btn jc-btn--primary jc-btn--lg"
              href={buildWhatsAppLink(site.whatsappNumber, messageTemplates.general)}
            >
              Start on WhatsApp
            </a>
            <a className="jc-btn jc-btn--secondary jc-btn--lg" href="/contact">
              Book a demo
            </a>
          </div>

          <ul className="jc-hero__proof">
            <li>
              <Icon name="check" /> No code required
            </li>
            <li>
              <Icon name="check" /> Keep your existing number
            </li>
            <li>
              <Icon name="check" /> No markup on Meta rates
            </li>
          </ul>
        </div>

        <div className="jc-hero__visual" aria-hidden="true">
          <div className="jc-chat">
            <div className="jc-chat__bar">
              <span className="jc-chat__avatar">
                <Icon name="robot" className="jc-icon" />
              </span>
              <span className="jc-chat__meta">
                <strong>{site.brandName} Assistant</strong>
                <em>online</em>
              </span>
            </div>

            <div className="jc-chat__body">
              <p className="jc-bubble jc-bubble--in">
                Hi! Do you have a slot free on Thursday afternoon?
              </p>
              <p className="jc-bubble jc-bubble--out">
                We do — 2:30pm and 4:00pm are open. Which suits you?
              </p>
              <div className="jc-chat__choices">
                <span className="jc-chat__choice">2:30pm</span>
                <span className="jc-chat__choice">4:00pm</span>
              </div>
              <p className="jc-bubble jc-bubble--in jc-bubble--short">2:30pm</p>
              <p className="jc-bubble jc-bubble--out">
                Booked for Thursday 2:30pm. I have sent a reminder for Wednesday
                evening.
              </p>
            </div>

            <div className="jc-chat__foot">
              <span className="jc-chat__pill">
                <Icon name="flow" /> Booking flow
              </span>
              <span className="jc-chat__pill">
                <Icon name="clock" /> Replied in 2s
              </span>
            </div>
          </div>

          {/* Floating stat cards, offset from the thread for depth */}
          <div className="jc-hero__stat jc-hero__stat--a">
            <strong>24/7</strong>
            <span>always answering</span>
          </div>
          <div className="jc-hero__stat jc-hero__stat--b">
            <strong>One number</strong>
            <span>your whole team</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
