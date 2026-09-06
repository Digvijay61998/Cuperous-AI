import React from 'react';
import { processSteps } from '../content/process';

/**
 * The six-step story.
 *
 * An ordered list, so the sequence is conveyed to assistive technology rather
 * than living only in the visual numbering. The two-digit ordinal is decorative
 * and hidden — the list already communicates order.
 */
const Process: React.FC = () => (
  <section
    className="jc-section jc-section--sunken"
    aria-labelledby="jc-process-heading"
  >
    <div className="jc-container">
      <div className="jc-section-head">
        <span className="jc-eyebrow">How it works</span>
        <h2 id="jc-process-heading">
          From first message to repeat customer
        </h2>
        <p className="jc-lead">
          The path a customer takes, and what JarCube handles at each stage so
          your team does not have to.
        </p>
      </div>

      <ol className="jc-process">
        {processSteps.map((step, i) => (
          <li className="jc-process__item" key={step.heading}>
            <span className="jc-process__num" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="jc-process__heading">{step.heading}</h3>
            <p className="jc-process__body">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default Process;
