import { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyTheme,
  createAppointment,
  getContext,
  loadConfig,
  themeFromConfig,
  track,
  trackView,
} from '@quantum/template-sdk';
import { InfoPanel } from './components/InfoPanel';
import { CalendarScreen } from './components/CalendarScreen';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { DEFAULT_CONFIG, mergeConfig } from './config/defaults';
import { detectTimezone } from './utils/timezone';
import { isFormValid } from './utils/validation';
import type { InternalStep, MeetingConfig } from './types';

const CONFIG_TIMEOUT_MS = 3000;

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

export default function App() {
  // --- Context ---
  const ctx = useMemo(() => {
    try {
      return getContext();
    } catch {
      return { lang: 'en', extra: {} } as ReturnType<typeof getContext>;
    }
  }, []);

  // --- State ---
  const [config, setConfig] = useState<MeetingConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<InternalStep>('calendar');

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState(() => detectTimezone());
  const [customerName, setCustomerName] = useState(ctx.name ?? '');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState(ctx.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const startedRef = useRef(false);
  const stepRef = useRef<InternalStep>('calendar');
  stepRef.current = step;

  // --- Apply direction & lang ---
  useEffect(() => {
    try {
      const lang = ctx.lang || 'en';
      const dir = ['ar', 'he', 'fa', 'ur'].includes(lang) ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lang);
    } catch {
      /* ignore */
    }
  }, [ctx.lang]);

  // --- Load config + apply theme + track view ---
  useEffect(() => {
    trackView();
    let active = true;

    withTimeout(loadConfig(undefined, DEFAULT_CONFIG as unknown as Record<string, any>), CONFIG_TIMEOUT_MS)
      .then((fetched) => {
        if (!active) return;
        const merged = mergeConfig(fetched as Partial<MeetingConfig> | null);
        setConfig(merged);
        applyThemeSafe(merged);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setConfig(DEFAULT_CONFIG);
        applyThemeSafe(DEFAULT_CONFIG);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // --- Abandon tracking ---
  useEffect(() => {
    const onUnload = () => {
      if (stepRef.current !== 'success') {
        track('abandon', { lastStep: stepRef.current === 'confirmation' ? 'confirmation' : 'calendar' });
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const applyThemeSafe = (cfg: MeetingConfig) => {
    try {
      applyTheme(themeFromConfig(cfg as unknown as Record<string, any>));
    } catch {
      try {
        document.documentElement.removeAttribute('data-theme');
      } catch {
        /* ignore */
      }
    }
  };

  // --- Handlers ---
  const handleDateChange = (date: string) => {
    if (!startedRef.current && date) {
      startedRef.current = true;
      track('start', { date });
    }
    setSelectedDate(date);
    setSelectedSlot(''); // clear slot on date change
  };

  const handleSlotChange = (slot: string) => {
    setSelectedSlot(slot);
  };

  const handleTimezoneChange = (tz: string) => {
    setSelectedTimezone(tz);
    setSelectedSlot(''); // clear slot on timezone change
  };

  const handleNext = () => {
    setStep('confirmation');
    track('step', { step: 'confirmation' });
  };

  const handleBack = () => {
    setStep('calendar');
  };

  const handleConfirm = async () => {
    if (!isFormValid(customerName, customerEmail) || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await createAppointment({
        date: selectedDate,
        slot: selectedSlot,
        name: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim() || undefined,
        timezone: selectedTimezone,
        meeting_duration: config.meeting_duration,
      } as any);
      track('complete', {
        date: selectedDate,
        slot: selectedSlot,
        timezone: selectedTimezone,
        email: customerEmail.trim(),
      });
      setStep('success');
    } catch (e: any) {
      track('error', {
        endpoint: '/template/actions/appointment',
        message: e?.message ?? 'unknown',
      });
      setError(config.labels.booking_error);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="scheduler" aria-busy="true">
        <div className="skeleton">
          <div className="skeleton__panel-left desktop-only">
            <div className="skeleton__circle" />
            <div className="skeleton__bar skeleton__bar--medium" />
            <div className="skeleton__bar skeleton__bar--short" />
          </div>
          <div className="skeleton__panel-right">
            <div className="skeleton__bar" />
            <div className="skeleton__block" />
            <div className="skeleton__block" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scheduler">
      {/* Accessible live region for step announcements */}
      <div className="announcer" aria-live="polite" aria-atomic="true">
        {step === 'calendar' && 'Calendar screen'}
        {step === 'confirmation' && 'Confirmation screen'}
        {step === 'success' && 'Booking confirmed'}
      </div>

      <InfoPanel config={config} />

      <main className="interactive-panel">
        {step === 'calendar' && (
          <CalendarScreen
            config={config}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            selectedTimezone={selectedTimezone}
            onDateChange={handleDateChange}
            onSlotChange={handleSlotChange}
            onTimezoneChange={handleTimezoneChange}
            onNext={handleNext}
          />
        )}

        {(step === 'confirmation' || step === 'success') && (
          <ConfirmationScreen
            config={config}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            selectedTimezone={selectedTimezone}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            submitting={submitting}
            error={error}
            success={step === 'success'}
            onNameChange={setCustomerName}
            onEmailChange={setCustomerEmail}
            onPhoneChange={setCustomerPhone}
            onConfirm={handleConfirm}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}
