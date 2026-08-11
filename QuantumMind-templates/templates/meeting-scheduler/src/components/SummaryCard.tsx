import { formatDateLong } from '../utils/format';
import { formatTimezone } from '../utils/timezone';

interface SummaryCardProps {
  date: string; // ISO YYYY-MM-DD
  slot: string; // e.g. "10:30 AM"
  timezone: string; // IANA timezone
}

export function SummaryCard({ date, slot, timezone }: SummaryCardProps) {
  return (
    <div className="summary-card" aria-label="Booking summary">
      <span className="summary-card__date">{formatDateLong(date)}</span>
      <span className="summary-card__time">{slot}</span>
      <span className="summary-card__timezone">{formatTimezone(timezone)}</span>
    </div>
  );
}
