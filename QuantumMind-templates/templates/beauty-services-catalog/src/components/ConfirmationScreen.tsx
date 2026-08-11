import React, { useEffect } from 'react';
import { BeautyConfig, Service } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { computeTotalPrice } from '../utils/services';
import { track } from '@quantum/template-sdk';

interface ConfirmationScreenProps {
  config: BeautyConfig;
  locale: string;
  selectedServices: Service[];
  date: string;
  slot: string;
  onClose: () => void;
}

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  config,
  locale,
  selectedServices,
  date,
  slot,
  onClose,
}) => {
  const total = computeTotalPrice(selectedServices);

  useEffect(() => {
    try {
      track('complete', {
        serviceIds: selectedServices.map((s) => s.id),
        date,
        slot,
      });
    } catch {
      // analytics must never break UI
    }
  }, []);

  return (
    <section className="confirmation-screen" aria-label="Booking confirmed">
      <div className="confirmation-screen__checkmark" aria-hidden="true">
        <svg viewBox="0 0 52 52" className="confirmation-screen__check-svg">
          <circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
          <path fill="none" stroke="currentColor" strokeWidth="3" d="M14 27l7 7 16-16" />
        </svg>
      </div>

      <h2 className="confirmation-screen__message">{config.success_message}</h2>

      <div className="confirmation-screen__summary">
        <ul className="confirmation-screen__services-list">
          {selectedServices.map((s) => (
            <li key={s.id}>
              <span>{s.name}</span>
              <span>{formatCurrency(s.price, config.currency, locale)}</span>
            </li>
          ))}
        </ul>
        <div className="confirmation-screen__meta">
          <span>{formatDate(date, locale)}</span>
          <span>{slot}</span>
        </div>
        <div className="confirmation-screen__total">
          <strong>{config.labels.total}</strong>
          <strong>{formatCurrency(total, config.currency, locale)}</strong>
        </div>
      </div>

      <button className="confirmation-screen__cta" onClick={onClose} type="button">
        {config.success_cta_text}
      </button>
    </section>
  );
};

export default ConfirmationScreen;
