import { useMemo, useState } from 'react';
import { MonthGrid } from './MonthGrid';
import { TimeSlotList } from './TimeSlotList';
import { TimezoneSelector } from './TimezoneSelector';
import { computeTimeSlots } from '../utils/time-slots';
import type { MeetingConfig } from '../types';

interface CalendarScreenProps {
  config: MeetingConfig;
  selectedDate: string;
  selectedSlot: string;
  selectedTimezone: string;
  onDateChange: (date: string) => void;
  onSlotChange: (slot: string) => void;
  onTimezoneChange: (tz: string) => void;
  onNext: () => void;
}

function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getMaxDate(advanceBookingDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + advanceBookingDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CalendarScreen({
  config,
  selectedDate,
  selectedSlot,
  selectedTimezone,
  onDateChange,
  onSlotChange,
  onTimezoneChange,
  onNext,
}: CalendarScreenProps) {
  const today = getToday();
  const maxDate = getMaxDate(config.advance_booking_days);

  const [displayedMonth, setDisplayedMonth] = useState(() => new Date().getMonth());
  const [displayedYear, setDisplayedYear] = useState(() => new Date().getFullYear());

  // Compute time slots for selected date
  const slots = useMemo(() => {
    if (!selectedDate) return [];
    return computeTimeSlots(
      selectedDate,
      config.working_hours,
      config.slot_duration,
      selectedTimezone,
    );
  }, [selectedDate, config.working_hours, config.slot_duration, selectedTimezone]);

  // Month navigation
  const handlePrevMonth = () => {
    if (displayedMonth === 0) {
      setDisplayedMonth(11);
      setDisplayedYear(displayedYear - 1);
    } else {
      setDisplayedMonth(displayedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayedMonth === 11) {
      setDisplayedMonth(0);
      setDisplayedYear(displayedYear + 1);
    } else {
      setDisplayedMonth(displayedMonth + 1);
    }
  };

  // Disable prev if the displayed month is entirely before today's month
  const todayYear = parseInt(today.slice(0, 4), 10);
  const todayMonth = parseInt(today.slice(5, 7), 10) - 1;
  const prevDisabled = displayedYear < todayYear || (displayedYear === todayYear && displayedMonth <= todayMonth);

  // Disable next if the displayed month is entirely after maxDate's month
  const maxYear = parseInt(maxDate.slice(0, 4), 10);
  const maxMonth = parseInt(maxDate.slice(5, 7), 10) - 1;
  const nextDisabled = displayedYear > maxYear || (displayedYear === maxYear && displayedMonth >= maxMonth);

  const monthName = new Date(displayedYear, displayedMonth).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const canProceed = Boolean(selectedDate && selectedSlot);

  return (
    <section className="calendar-screen" aria-label="Select date and time">
      {/* Timezone selector */}
      <TimezoneSelector
        selectedTimezone={selectedTimezone}
        onTimezoneChange={onTimezoneChange}
      />

      {/* Month navigation */}
      <nav className="month-nav" aria-label="Month navigation">
        <button
          type="button"
          className="month-nav__btn"
          disabled={prevDisabled}
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="month-nav__title">{monthName}</h2>
        <button
          type="button"
          className="month-nav__btn"
          disabled={nextDisabled}
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </nav>

      {/* Calendar + Slots layout */}
      <div className="calendar-layout">
        <div className="calendar-layout__grid">
          <MonthGrid
            displayedMonth={displayedMonth}
            displayedYear={displayedYear}
            selectedDate={selectedDate}
            today={today}
            maxDate={maxDate}
            advanceBookingDays={config.advance_booking_days}
            onDateSelect={onDateChange}
          />
        </div>

        {selectedDate && (
          <div className="calendar-layout__slots">
            <TimeSlotList
              slots={slots}
              selectedSlot={selectedSlot}
              onSlotSelect={onSlotChange}
              noAvailabilityMessage={config.labels.no_availability}
            />
          </div>
        )}
      </div>

      {/* Next button */}
      <div className="next-btn-container">
        <button
          type="button"
          className="btn btn--primary btn--full-width"
          disabled={!canProceed}
          onClick={onNext}
        >
          {config.labels.next}
        </button>
      </div>
    </section>
  );
}
