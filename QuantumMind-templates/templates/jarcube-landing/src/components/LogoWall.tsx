import React from 'react';
import { permittedLogos } from '../content/logos';
import { flags } from '../content/flags';

/**
 * Customer logo wall.
 *
 * Two independent gates before anything renders: the feature flag, and the
 * per-entry permission field. If nothing clears both, the section returns null
 * rather than leaving an empty band on the page.
 */
const LogoWall: React.FC = () => {
  if (!flags.logoWall) return null;

  const entries = permittedLogos();
  if (entries.length === 0) return null;

  return (
    <section
      className="jc-section jc-section--tight jc-section--sunken"
      aria-labelledby="jc-logos-heading"
    >
      <div className="jc-container">
        <h2 id="jc-logos-heading" className="jc-logos__heading">
          Trusted by teams across India
        </h2>
        <ul className="jc-logos">
          {entries.map((logo) => (
            <li
              key={logo.name}
              className={`jc-logos__item${
                logo.needsLightBacking ? ' jc-logos__item--backed' : ''
              }`}
            >
              <img
                src={logo.src}
                alt={logo.name}
                width={140}
                height={44}
                loading="lazy"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default LogoWall;
