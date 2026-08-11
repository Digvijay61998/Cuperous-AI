import React, { useMemo } from 'react';
import { BeautyConfig } from '../types';
import DatePicker from './DatePicker';
import TimeSlotGrid from './TimeSlotGrid';
import { computeTimeSlots } from '../utils/time-slots';
import { todayIso } from '../utils/dates';

interface DateTimeScreenProps {
  config: BeautyConfig;
  locale: string;
  selectedDate: string;
  selectedSlot: string;
  onDateChange: (date: string) => void;
  onSlotChange: (slot: string) => void;
  onContinue: () => void;
}

const DateTimeScreen: React.FC<DateTimeScreenProps> = ({
  config,
  locale,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
  onContinue,
}) => {
  const today = todayIso();
  const isToday = selectedDate === today;

  const slots = useMemo(
    () =>
      computeTimeSlots(
        selectedDate,
        config.working_hours,
        config.time_slot_interval,
        isToday,
      ),
    [selectedDate, config.working_hours, config.time_slot_interval, isToday],
  );

  const canContinue = selectedDate !== '' && selectedSlot !== '';

  return (
    <section className="datetime-screen" aria-label="Select date and time">
      <h2 className="datetime-screen__heading">{config.labels.select_date_time}</h2>

      <DatePicker
        days={config.advance_booking_days}
        selectedDate={selectedDate}
        locale={locale}
        onSelect={onDateChange}
      />

      <TimeSlotGrid
        slots={slots}
        selectedSlot={selectedSlot}
        onSelect={onSlotChange}
        emptyMessage={config.labels.no_availability}
      />

      {slots.length === 0 && (
        <p className="datetime-screen__guide">{config.labels.select_different_date}</p>
      )}

      <button
        className="datetime-screen__continue"
        onClick={onContinue}
        disabled={!canContinue}
        type="button"
      >
        {config.labels.continue}
      </button>
    </section>
  );
};

export default DateTimeScreen;
