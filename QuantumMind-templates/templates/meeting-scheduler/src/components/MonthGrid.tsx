import { generateMonthGrid, isDateSelectable } from '../utils/calendar';

interface MonthGridProps {
  displayedMonth: number; // 0-11
  displayedYear: number;
  selectedDate: string; // ISO YYYY-MM-DD
  today: string; // ISO YYYY-MM-DD
  maxDate: string; // ISO YYYY-MM-DD
  advanceBookingDays: number;
  onDateSelect: (date: string) => void;
}

const DAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function MonthGrid({
  displayedMonth,
  displayedYear,
  selectedDate,
  today,
  advanceBookingDays,
  onDateSelect,
}: MonthGridProps) {
  const grid = generateMonthGrid(displayedYear, displayedMonth);

  return (
    <div className="month-grid" role="grid" aria-label="Calendar">
      {/* Day-of-week headers */}
      {DAY_HEADERS.map((day) => (
        <div key={day} className="month-grid__header" role="columnheader">
          {day}
        </div>
      ))}

      {/* Date cells */}
      {grid.flat().map((cell, idx) => {
        if (cell === null) {
          return <div key={`empty-${idx}`} className="month-grid__cell month-grid__cell--empty" />;
        }

        const selectable = isDateSelectable(cell, today, advanceBookingDays);
        const isToday = cell === today;
        const isSelected = cell === selectedDate;

        const classNames = [
          'month-grid__cell',
          !selectable && 'month-grid__cell--disabled',
          isToday && !isSelected && 'month-grid__cell--today',
          isSelected && 'month-grid__cell--selected',
        ]
          .filter(Boolean)
          .join(' ');

        const dayNum = parseInt(cell.split('-')[2], 10);

        return (
          <button
            key={cell}
            type="button"
            className={classNames}
            disabled={!selectable}
            aria-selected={isSelected}
            aria-label={`${cell}${isToday ? ', today' : ''}`}
            onClick={() => onDateSelect(cell)}
          >
            {dayNum}
          </button>
        );
      })}
    </div>
  );
}
