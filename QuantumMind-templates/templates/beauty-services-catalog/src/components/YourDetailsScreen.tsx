import React from 'react';
import { BeautyConfig, Service } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { computeTotalPrice } from '../utils/services';

interface YourDetailsScreenProps {
  config: BeautyConfig;
  locale: string;
  selectedServices: Service[];
  date: string;
  slot: string;
  name: string;
  phone: string;
  notes: string;
  submitting: boolean;
  error: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onConfirm: () => void;
}

const YourDetailsScreen: React.FC<YourDetailsScreenProps> = ({
  config,
  locale,
  selectedServices,
  date,
  slot,
  name,
  phone,
  notes,
  submitting,
  error,
  onNameChange,
  onPhoneChange,
  onNotesChange,
  onConfirm,
}) => {
  const total = computeTotalPrice(selectedServices);
  const canConfirm = name.trim().length > 0 && phone.trim().length > 0 && !submitting;

  return (
    <section className="details-screen" aria-label="Your details">
      <h2 className="details-screen__heading">{config.labels.your_details}</h2>

      <form
        className="details-screen__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (canConfirm) onConfirm();
        }}
      >
        <div className="details-screen__field">
          <label htmlFor="bsc-name">{config.labels.full_name}</label>
          <input
            id="bsc-name"
            type="text"
            maxLength={100}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={config.labels.full_name}
            required
          />
        </div>

        <div className="details-screen__field">
          <label htmlFor="bsc-phone">{config.labels.phone_number}</label>
          <input
            id="bsc-phone"
            type="tel"
            maxLength={20}
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={config.labels.phone_number}
            required
          />
        </div>

        <div className="details-screen__field">
          <label htmlFor="bsc-notes">{config.labels.notes}</label>
          <textarea
            id="bsc-notes"
            maxLength={500}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={config.labels.notes}
            rows={3}
          />
        </div>
      </form>

      <div className="details-screen__summary">
        <h3>Booking Summary</h3>
        <ul className="details-screen__services-list">
          {selectedServices.map((s) => (
            <li key={s.id}>
              <span>{s.name}</span>
              <span>{formatCurrency(s.price, config.currency, locale)}</span>
            </li>
          ))}
        </ul>
        <div className="details-screen__meta">
          <span>{formatDate(date, locale)}</span>
          <span>{slot}</span>
        </div>
        <div className="details-screen__total">
          <strong>{config.labels.total}</strong>
          <strong>{formatCurrency(total, config.currency, locale)}</strong>
        </div>
      </div>

      {error && <p className="details-screen__error" role="alert">{error}</p>}

      <button
        className="details-screen__confirm"
        onClick={onConfirm}
        disabled={!canConfirm}
        type="button"
      >
        {submitting ? '...' : config.labels.confirm_booking}
      </button>
    </section>
  );
};

export default YourDetailsScreen;
