import { useEffect, useMemo, useState } from 'react';
import {
  applyTheme,
  configValue,
  getContext,
  initSession,
  loadConfig,
  submitSession,
  track,
} from '@quantum/template-sdk';
import { buildDays, DOCTORS, Doctor, TIME_SLOTS } from './data';

type Step = 'doctor' | 'schedule' | 'details' | 'success';

export default function App() {
  const ctx = useMemo(() => getContext(), []);
  const days = useMemo(() => buildDays(10), []);

  const [config, setConfig] = useState<Record<string, any>>({});
  const [step, setStep] = useState<Step>('doctor');
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState<string>(days[0]?.iso ?? '');
  const [slot, setSlot] = useState<string>('');
  const [name, setName] = useState<string>(ctx.name ?? '');
  const [phone, setPhone] = useState<string>(ctx.phone ?? '');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load admin-editable config (labels, colors, logo) + apply theme.
  useEffect(() => {
    // Fire opened-heartbeat + view event, keep session alive (Phase 2).
    initSession();
    loadConfig(undefined, {
      clinic_name: 'City Care Clinic',
      hero_title: 'Book your appointment',
      hero_subtitle: "Choose a doctor, pick a slot, and you're done.",
      primary_color: '#2241FF',
      success_message: 'Your appointment is confirmed!',
    }).then((cfg) => {
      setConfig(cfg);
      applyTheme({ primaryColor: cfg.primary_color });
    });
  }, []);

  const clinicName = configValue(config, 'clinic_name', 'City Care Clinic');
  const logo = configValue(config, 'clinic_logo', '');

  const canContinueSchedule = Boolean(date && slot);
  const canSubmit = Boolean(name.trim() && phone.trim() && date && slot && doctor);

  const handleConfirm = async () => {
    if (!canSubmit || !doctor) return;
    setSubmitting(true);
    setError('');

    // Submit through the SDK session client: persists the submission, resumes
    // the paused workflow server-side, and shows the standard return-to-chat
    // screen on success.
    const result = await submitSession(
      {
        category: 'appointment',
        industry: 'medical',
        primaryDate: date,
        data: {
          practitioner: doctor.name,
          service: doctor.specialty,
          date,
          slot,
          name: name.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        },
      },
      {
        title: configValue(config, 'success_message', 'Your appointment is confirmed!'),
        message: `${doctor.name} on ${date} at ${slot}. You can return to the chat now.`,
        color: configValue(config, 'primary_color', '#2241FF'),
      },
    );

    if (result.ok) {
      track('complete', { doctor: doctor.id, date, slot });
      setStep('success');
    } else {
      // No active session (e.g. opened directly / preview) — show the local
      // success screen so the flow stays demoable.
      setError(
        'No active booking session was found. This is expected when previewing the template directly.',
      );
      setStep('success');
    }
    setSubmitting(false);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="brand">
          {logo ? (
            <img className="brand__logo" src={logo} alt={clinicName} />
          ) : (
            <div className="brand__logo brand__logo--fallback">
              {clinicName.charAt(0)}
            </div>
          )}
          <span className="brand__name">{clinicName}</span>
        </div>
        <StepDots step={step} />
      </header>

      {step !== 'success' && (
        <div className="hero">
          <h1>{configValue(config, 'hero_title', 'Book your appointment')}</h1>
          <p>
            {configValue(
              config,
              'hero_subtitle',
              "Choose a doctor, pick a slot, and you're done.",
            )}
          </p>
        </div>
      )}

      <main className="content">
        {step === 'doctor' && (
          <section className="stack">
            <h2 className="section-title">Select a doctor</h2>
            {DOCTORS.map((d) => (
              <button
                key={d.id}
                className={`doctor-card ${doctor?.id === d.id ? 'is-selected' : ''}`}
                onClick={() => setDoctor(d)}
              >
                <div className="avatar">{d.initials}</div>
                <div className="doctor-card__info">
                  <span className="doctor-card__name">{d.name}</span>
                  <span className="doctor-card__specialty">{d.specialty}</span>
                  <span className="doctor-card__meta">
                    ★ {d.rating} · {d.experience} experience
                  </span>
                </div>
                <span className="radio" aria-hidden />
              </button>
            ))}
          </section>
        )}

        {step === 'schedule' && (
          <section className="stack">
            <h2 className="section-title">Pick a date</h2>
            <div className="days">
              {days.map((d) => (
                <button
                  key={d.iso}
                  className={`day ${date === d.iso ? 'is-selected' : ''}`}
                  onClick={() => setDate(d.iso)}
                >
                  <span className="day__weekday">{d.weekday}</span>
                  <span className="day__num">{d.day}</span>
                  <span className="day__month">{d.month}</span>
                </button>
              ))}
            </div>

            <h2 className="section-title">Available slots</h2>
            <div className="slots">
              {TIME_SLOTS.map((s) => (
                <button
                  key={s}
                  className={`slot ${slot === s ? 'is-selected' : ''}`}
                  onClick={() => setSlot(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 'details' && (
          <section className="stack">
            <h2 className="section-title">Your details</h2>
            <label className="field">
              <span>Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                autoComplete="name"
              />
            </label>
            <label className="field">
              <span>Phone number</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp number"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label className="field">
              <span>Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the doctor should know?"
                rows={3}
              />
            </label>

            <div className="summary">
              <div className="summary__row">
                <span>Doctor</span>
                <strong>{doctor?.name}</strong>
              </div>
              <div className="summary__row">
                <span>When</span>
                <strong>
                  {date} · {slot}
                </strong>
              </div>
            </div>
          </section>
        )}

        {step === 'success' && (
          <section className="success">
            <div className="success__check">✓</div>
            <h2>{configValue(config, 'success_message', 'Your appointment is confirmed!')}</h2>
            <div className="success__card">
              <div className="summary__row">
                <span>Doctor</span>
                <strong>{doctor?.name}</strong>
              </div>
              <div className="summary__row">
                <span>Date</span>
                <strong>{date}</strong>
              </div>
              <div className="summary__row">
                <span>Time</span>
                <strong>{slot}</strong>
              </div>
              <div className="summary__row">
                <span>Name</span>
                <strong>{name}</strong>
              </div>
            </div>
            {error && <p className="notice">{error}</p>}
            <p className="success__hint">
              You can close this window and return to your chat.
            </p>
          </section>
        )}
      </main>

      {/* Sticky footer actions */}
      {step !== 'success' && (
        <footer className="footer">
          {step !== 'doctor' && (
            <button
              className="btn btn--ghost"
              onClick={() =>
                setStep(step === 'details' ? 'schedule' : 'doctor')
              }
            >
              Back
            </button>
          )}
          {step === 'doctor' && (
            <button
              className="btn btn--primary"
              disabled={!doctor}
              onClick={() => setStep('schedule')}
            >
              Continue
            </button>
          )}
          {step === 'schedule' && (
            <button
              className="btn btn--primary"
              disabled={!canContinueSchedule}
              onClick={() => setStep('details')}
            >
              Continue
            </button>
          )}
          {step === 'details' && (
            <button
              className="btn btn--primary"
              disabled={!canSubmit || submitting}
              onClick={handleConfirm}
            >
              {submitting ? 'Booking...' : 'Confirm booking'}
            </button>
          )}
        </footer>
      )}
    </div>
  );
}

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ['doctor', 'schedule', 'details'];
  const activeIndex = step === 'success' ? order.length : order.indexOf(step);
  return (
    <div className="dots">
      {order.map((s, i) => (
        <span key={s} className={`dot ${i <= activeIndex ? 'is-active' : ''}`} />
      ))}
    </div>
  );
}
