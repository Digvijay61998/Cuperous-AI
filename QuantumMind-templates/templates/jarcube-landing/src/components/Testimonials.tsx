import React, { useState } from 'react';
import { testimonials } from '../content/testimonials';
import { flags } from '../content/flags';

/**
 * Customer testimonials carousel.
 *
 * Renders only real quotes supplied by the named customer. While the content
 * module is empty the section omits itself, so the landing page reads coherently
 * without it rather than showing placeholder praise.
 */
const Testimonials: React.FC = () => {
  const [index, setIndex] = useState(0);

  if (!flags.testimonials) return null;
  if (testimonials.length === 0) return null;

  const current = testimonials[index];
  const many = testimonials.length > 1;

  const go = (delta: number) => {
    setIndex((prev) => (prev + delta + testimonials.length) % testimonials.length);
  };

  return (
    <section className="jc-section" aria-labelledby="jc-testimonials-heading">
      <div className="jc-container">
        <div className="jc-section-head jc-section-head--center">
          <span className="jc-eyebrow">Testimonials</span>
          <h2 id="jc-testimonials-heading">What customers say</h2>
        </div>

        <figure className="jc-card jc-quote">
          {current.metric ? (
            <p className="jc-quote__metric">{current.metric}</p>
          ) : null}
          <blockquote className="jc-quote__text">
            <p>{current.quote}</p>
          </blockquote>
          <figcaption className="jc-quote__cite">
            <strong>{current.attribution}</strong>
            <span>{current.organisation}</span>
          </figcaption>
        </figure>

        {many ? (
          <div className="jc-quote__controls">
            <button
              type="button"
              className="jc-btn jc-btn--secondary jc-quote__nav"
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
            >
              ←
            </button>
            <p className="jc-quote__count" aria-live="polite">
              {index + 1} of {testimonials.length}
            </p>
            <button
              type="button"
              className="jc-btn jc-btn--secondary jc-quote__nav"
              onClick={() => go(1)}
              aria-label="Next testimonial"
            >
              →
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Testimonials;
