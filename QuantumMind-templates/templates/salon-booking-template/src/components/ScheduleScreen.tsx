import { useMemo } from 'react';
import type { SalonConfig, Staff } from '../types';
import { buildDays, todayIso } from '../utils/dates';
import { computeTimeSlots } from '../utils/time-slots';

interface ScheduleScreenProps {
  config: SalonConfig;
  locale: string;
  selectedStaff: Staff | null;
  selectedDate: string;
  selectedSlot: string;
  onStaffChange: (staff: Staff | null) => void;
  onDateChange: (date: string) => void;
  onSlotChange: (slot: string) => void;
}

const MAX_STAFF = 20;

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ScheduleScreen({
  config,
  locale,
  selectedStaff,
  selectedDate,
  selectedSlot,
  onStaffChange,
  onDateChange,
  onSlotChange,
}: ScheduleScreenProps) {
  const { labels, staff, show_staff_selection, working_hours } = config;

  const days = useMemo(
    () =>
      buildDays(config.booking_settings.advance_booking_days || 14, locale),
    [config.booking_settings.advance_booking_days, locale],
  );

  const staffList = Array.isArray(staff) ? staff.slice(0, MAX_STAFF) : [];
  const showStaff = show_staff_selection && staffList.length > 0;

  const slots = useMemo(
    () =>
      computeTimeSlots(
        selectedDate,
        working_hours,
        config.time_slot_interval || 30,
        selectedDate === todayIso(),
      ),
    [selectedDate, working_hours, config.time_slot_interval],
  );

  const noAvailability = slots.length === 0;

  return (
    <section className="stack" aria-labelledby="schedule-title">
      {showStaff && (
        <>
          <h2 id="schedule-title" className="section-title">
            {labels.select_staff}
          </h2>
          <div className="stack">
            {staffList.map((member) => {
              const selected = selectedStaff?.id === member.id;
              return (
                <button
                  key={member.id}
                  className={`staff-card ${selected ? 'is-selected' : ''}`}
                  aria-selected={selected}
                  onClick={() =>
                    onStaffChange(selected ? null : member)
                  }
                >
                  {member.avatar ? (
                    <img
                      className="avatar avatar--img"
                      src={member.avatar}
                      alt=""
                      aria-hidden="true"
                    />
                  ) : (
                    <div className="avatar" aria-hidden="true">
                      {initials(member.name)}
                    </div>
                  )}
                  <div className="staff-card__info">
                    <span className="staff-card__name">{member.name}</span>
                    <span className="staff-card__role">{member.role}</span>
                    <span className="staff-card__meta">
                      ★ {member.rating} · {member.experience}
                    </span>
                  </div>
                  <span className="radio" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </>
      )}

      <h2
        className="section-title"
        id={showStaff ? undefined : 'schedule-title'}
      >
        {labels.select_date_time}
      </h2>
      <div className="days" role="listbox" aria-label="Select date">
        {days.map((d) => (
          <button
            key={d.iso}
            role="option"
            aria-selected={selectedDate === d.iso}
            className={`day ${selectedDate === d.iso ? 'is-selected' : ''}`}
            onClick={() => onDateChange(d.iso)}
          >
            <span className="day__weekday">{d.weekday}</span>
            <span className="day__num">{d.day}</span>
            <span className="day__month">{d.month}</span>
          </button>
        ))}
      </div>

      {noAvailability ? (
        <p className="empty-state">{labels.no_availability}</p>
      ) : (
        <div className="slots" role="listbox" aria-label="Select time slot">
          {slots.map((slot) => (
            <button
              key={slot}
              role="option"
              aria-selected={selectedSlot === slot}
              className={`slot ${selectedSlot === slot ? 'is-selected' : ''}`}
              onClick={() => onSlotChange(slot)}
            >
              {slot}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
