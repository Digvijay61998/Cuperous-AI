interface TimeSlotListProps {
  slots: string[];
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
  noAvailabilityMessage: string;
}

export function TimeSlotList({
  slots,
  selectedSlot,
  onSlotSelect,
  noAvailabilityMessage,
}: TimeSlotListProps) {
  if (slots.length === 0) {
    return (
      <div className="time-slots">
        <p className="time-slots__empty">{noAvailabilityMessage}</p>
      </div>
    );
  }

  return (
    <div className="time-slots">
      <h3 className="time-slots__heading">Available Times</h3>
      <div className="time-slots__list" role="listbox" aria-label="Available time slots">
        {slots.map((slot) => {
          const isSelected = slot === selectedSlot;
          return (
            <button
              key={slot}
              type="button"
              className={`time-slot${isSelected ? ' time-slot--selected' : ''}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => onSlotSelect(slot)}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
