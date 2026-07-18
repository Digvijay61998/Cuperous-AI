export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  initials: string;
}

export const DOCTORS: Doctor[] = [
  {
    id: 'dr-mehta',
    name: 'Dr. Anjali Mehta',
    specialty: 'General Physician',
    rating: 4.9,
    experience: '12 yrs',
    initials: 'AM',
  },
  {
    id: 'dr-rao',
    name: 'Dr. Vikram Rao',
    specialty: 'Cardiologist',
    rating: 4.8,
    experience: '15 yrs',
    initials: 'VR',
  },
  {
    id: 'dr-shah',
    name: 'Dr. Priya Shah',
    specialty: 'Dermatologist',
    rating: 4.7,
    experience: '9 yrs',
    initials: 'PS',
  },
];

export const TIME_SLOTS: string[] = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
];

export interface DayOption {
  iso: string; // YYYY-MM-DD
  weekday: string; // Mon
  day: string; // 14
  month: string; // Jul
}

/** Builds the next `count` selectable days starting today. */
export const buildDays = (count = 10): DayOption[] => {
  const days: DayOption[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate().toString(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    });
  }
  return days;
};
