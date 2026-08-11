import { isFormValid } from '../utils/validation';
import type { MeetingConfig } from '../types';

interface BookingFormProps {
  config: MeetingConfig;
  name: string;
  email: string;
  phone: string;
  submitting: boolean;
  error: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSubmit: () => void;
}

export function BookingForm({
  config,
  name,
  email,
  phone,
  submitting,
  error,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onSubmit,
}: BookingFormProps) {
  const valid = isFormValid(name, email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid && !submitting) {
      onSubmit();
    }
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit} noValidate>
      {/* Name field */}
      <div className="booking-form__field">
        <label htmlFor="booking-name" className="booking-form__label">
          {config.labels.name_label}
        </label>
        <input
          id="booking-name"
          type="text"
          className="booking-form__input"
          placeholder={config.labels.name_placeholder}
          maxLength={100}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      {/* Email field */}
      <div className="booking-form__field">
        <label htmlFor="booking-email" className="booking-form__label">
          {config.labels.email_label}
        </label>
        <input
          id="booking-email"
          type="email"
          className="booking-form__input"
          placeholder={config.labels.email_placeholder}
          maxLength={254}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      {/* Phone field (optional) */}
      {config.show_phone_field && (
        <div className="booking-form__field">
          <label htmlFor="booking-phone" className="booking-form__label">
            {config.labels.phone_label}
          </label>
          <input
            id="booking-phone"
            type="tel"
            className="booking-form__input"
            placeholder={config.labels.phone_placeholder}
            maxLength={20}
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            autoComplete="tel"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        className="btn btn--primary btn--full-width"
        disabled={!valid || submitting}
        aria-disabled={!valid || submitting}
      >
        {submitting ? <span className="spinner" aria-label="Loading" /> : config.labels.confirm_button}
      </button>
    </form>
  );
}
