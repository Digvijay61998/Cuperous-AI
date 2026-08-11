import { SummaryCard } from './SummaryCard';
import { BookingForm } from './BookingForm';
import { SuccessBanner } from './SuccessBanner';
import type { MeetingConfig } from '../types';

interface ConfirmationScreenProps {
  config: MeetingConfig;
  selectedDate: string;
  selectedSlot: string;
  selectedTimezone: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  submitting: boolean;
  error: string;
  success: boolean;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function ConfirmationScreen({
  config,
  selectedDate,
  selectedSlot,
  selectedTimezone,
  customerName,
  customerEmail,
  customerPhone,
  submitting,
  error,
  success,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onConfirm,
  onBack,
}: ConfirmationScreenProps) {
  return (
    <section className="confirmation-screen" aria-label="Confirm booking">
      {/* Back button */}
      {!success && (
        <button type="button" className="back-btn" onClick={onBack}>
          <svg className="back-btn__icon" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {config.labels.back}
        </button>
      )}

      {/* Heading */}
      <h2 className="confirmation-screen__heading">{config.labels.confirm_heading}</h2>

      {/* Summary card */}
      <SummaryCard
        date={selectedDate}
        slot={selectedSlot}
        timezone={selectedTimezone}
      />

      {/* Form or Success banner */}
      {success ? (
        <SuccessBanner
          message={config.success_message}
          autoCloseDelay={config.auto_close_delay}
          closeInstruction={config.labels.close_instruction}
        />
      ) : (
        <BookingForm
          config={config}
          name={customerName}
          email={customerEmail}
          phone={customerPhone}
          submitting={submitting}
          error={error}
          onNameChange={onNameChange}
          onEmailChange={onEmailChange}
          onPhoneChange={onPhoneChange}
          onSubmit={onConfirm}
        />
      )}
    </section>
  );
}
