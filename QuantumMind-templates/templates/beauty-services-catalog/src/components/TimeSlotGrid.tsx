import React from 'react';

interface TimeSlotGridProps {
  slots: string[];
  selectedSlot: string;
  onSelect: (slot: string) => void;
  emptyMessage?: string;
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  slots,
  selectedSlot,
  onSelect,
  emptyMessage = 'No availability for this date',
}) => {
  if (slots.length === 0) {
    return <p className="time-slots__empty">{emptyMessage}</p>;
  }

  return (
    <div className="time-slots" role="group" aria-label="Available time slots">
      {slots.map((slot) => {
        const isSelected = slot === selectedSlot;
        return (
          <button
            key={slot}
            className={`time-slots__btn ${isSelected ? 'time-slots__btn--selected' : ''}`}
            onClick={() => onSelect(slot)}
            aria-selected={isSelected}
            type="button"
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlotGrid;
