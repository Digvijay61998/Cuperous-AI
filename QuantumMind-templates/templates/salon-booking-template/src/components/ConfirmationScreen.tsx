import type { SalonConfig, Service, Staff } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { computeTotalPrice } from '../utils/services';

interface ConfirmationScreenProps {
  config: SalonConfig;
  locale: string;
  selectedServices: Service[];
  selectedStaff: Staff | null;
  selectedDate: string;
  selectedSlot: string;
  failed: boolean;
  onClose: () => void;
}

export function ConfirmationScreen({
  config,
  locale,
  selectedServices,
  selectedStaff,
  selectedDate,
  selectedSlot,
  failed,
  onClose,
}: ConfirmationScreenProps) {
  const { labels, currency } = config;
  const total = computeTotalPrice(selectedServices);

  return (
    <section className="success" aria-labelledby="confirm-title">
      <div className="success__check" aria-hidden="true">
        ✓
      </div>
      <h2 id="confirm-title">{config.success_message}</h2>

      <div className="success__card">
        {selectedServices.map((s) => (
          <div className="summary__row" key={s.id}>
            <span>{s.name}</span>
            <strong>{formatCurrency(s.price, currency, locale)}</strong>
          </div>
        ))}
        {selectedStaff && (
          <div className="summary__row">
            <span>Specialist</span>
            <strong>{selectedStaff.name}</strong>
          </div>
        )}
        <div className="summary__row">
          <span>Date</span>
          <strong>{formatDate(selectedDate, locale)}</strong>
        </div>
        <div className="summary__row">
          <span>Time</span>
          <strong>{selectedSlot}</strong>
        </div>
        <div className="summary__row summary__row--total">
          <span>{labels.total}</span>
          <strong>{formatCurrency(total, currency, locale)}</strong>
        </div>
      </div>

      {failed && (
        <p className="notice" role="alert">
          {labels.booking_error}
        </p>
      )}

      <button className="btn btn--primary" onClick={onClose}>
        {config.success_cta_text}
      </button>
      <p className="success__hint">
        You can close this window and return to your chat.
      </p>
    </section>
  );
}
