import React from 'react';
import { EcommerceConfig } from '../types';

interface ConfirmationScreenProps {
  config: EcommerceConfig;
  onClose: () => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ config, onClose }) => {
  return (
    <section className="confirmation-screen" aria-labelledby="confirm-heading">
      <div className="confirmation-screen__celebration" aria-hidden="true">
        <svg className="confirmation-screen__star" viewBox="0 0 80 80" fill="none">
          <path
            d="M40 5 L47 30 L75 30 L52 47 L60 75 L40 58 L20 75 L28 47 L5 30 L33 30 Z"
            stroke="var(--qt-primary)"
            strokeWidth="2"
            fill="none"
          />
          <polyline
            className="check-path"
            points="28 42 36 50 54 32"
            stroke="var(--qt-primary)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="confirmation-screen__stars" aria-hidden="true">
          <span className="confirmation-screen__mini-star">✦</span>
          <span className="confirmation-screen__mini-star">✦</span>
          <span className="confirmation-screen__mini-star">✦</span>
          <span className="confirmation-screen__mini-star">✦</span>
        </div>
      </div>

      <div className="confirmation-screen__card">
        <h2 id="confirm-heading" className="confirmation-screen__heading">
          {config.success_message}
        </h2>
      </div>

      <button
        className="confirmation-screen__cta"
        onClick={onClose}
        type="button"
      >
        {config.success_cta_text}
      </button>
    </section>
  );
};

export default ConfirmationScreen;
