import React from 'react';
import { FoodOrderConfig } from '../types';

interface ConfirmationScreenProps {
  config: FoodOrderConfig;
  onClose: () => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ config, onClose }) => {
  return (
    <section className="confirmation-screen" aria-labelledby="confirm-heading">
      <div className="confirmation-screen__checkmark" aria-hidden="true">
        <svg
          className="confirmation-screen__check-svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline className="check-path" points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 id="confirm-heading" className="confirmation-screen__heading">
        {config.labels.success_heading}
      </h2>
      <p className="confirmation-screen__message">
        {config.success_message}
      </p>
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
