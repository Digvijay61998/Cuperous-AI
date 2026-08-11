import type { SalonConfig, Service, Staff } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { computeTotalPrice, isCustomerValid } from '../utils/services';

interface ReviewScreenProps {
  config: SalonConfig;
  locale: string;
  selectedServices: Service[];
  selectedStaff: Staff | null;
  selectedDate: string;
  selectedSlot: string;
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

export function ReviewScreen({
  config,
  locale,
  selectedServices,
  selectedStaff,
  selectedDate,
  selectedSlot,
  name,
  phone,
  notes,
  submitting,
  error,
  onNameChange,
  onPhoneChange,
  onNotesChange,
  onConfirm,
}: ReviewScreenProps) {
  const { labels, currency, booking_settings } = config;
  const total = computeTotalPrice(selectedServices);
  const valid = isCustomerValid(name, phone);

  return (
    <section className="stack" aria-labelledby="review-title">
      <h2 id="review-title" className="section-title">
        {labels.your_details}
      </h2>

      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !submitting) onConfirm();
        }}
      >
        <label className="field">
          <span>{labels.full_name}</span>
          <input
            value={name}
            maxLength={100}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Alex Morgan"
            autoComplete="name"
          />
        </label>
        <label className="field">
          <span>{labels.phone_number}</span>
          <input
            value={phone}
            maxLength={20}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="WhatsApp number"
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
        <label className="field">
          <span>
            {labels.notes}
            {!booking_settings.require_notes ? ' (optional)' : ''}
          </span>
          <textarea
            value={notes}
            maxLength={500}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Anything we should know?"
            rows={3}
            required={booking_settings.require_notes}
          />
        </label>

        <h2 className="section-title">{labels.booking_summary}</h2>
        <div className="summary">
          {selectedServices.map((s) => (
            <div className="summary__row" key={s.id}>
              <span>
                {s.name} · {s.duration} min
              </span>
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
            <span>When</span>
            <strong>
              {formatDate(selectedDate, locale)} · {selectedSlot}
            </strong>
          </div>
          <div className="summary__row summary__row--total">
            <span>{labels.total}</span>
            <strong>{formatCurrency(total, currency, locale)}</strong>
          </div>
        </div>

        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={!valid || submitting}
        >
          {submitting
            ? '…'
            : error
              ? labels.retry
              : labels.confirm_booking}
        </button>
      </form>
    </section>
  );
}
