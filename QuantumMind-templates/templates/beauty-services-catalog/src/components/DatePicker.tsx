import React, { useEffect, useRef } from 'react';
import { buildDays } from '../utils/dates';

interface DatePickerProps {
  days: number;
  selectedDate: string;
  locale: string;
  onSelect: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ days, selectedDate, locale, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dateList = buildDays(days, locale);

  useEffect(() => {
    // Auto-scroll to selected date on mount
    if (scrollRef.current) {
      const selected = scrollRef.current.querySelector('.date-picker__pill--selected');
      if (selected) {
        selected.scrollIntoView({ inline: 'center', behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="date-picker" ref={scrollRef} role="group" aria-label="Select date">
      {dateList.map((day) => {
        const isSelected = day.iso === selectedDate;
        return (
          <button
            key={day.iso}
            className={`date-picker__pill ${isSelected ? 'date-picker__pill--selected' : ''}`}
            onClick={() => onSelect(day.iso)}
            aria-selected={isSelected}
            type="button"
          >
            <span className="date-picker__day">{day.dayAbbr}</span>
            <span className="date-picker__num">{day.dayNum}</span>
          </button>
        );
      })}
    </div>
  );
};

export default DatePicker;
