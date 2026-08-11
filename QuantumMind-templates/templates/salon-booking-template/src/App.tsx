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
import { Header } from './components/Header';
import { LandingScreen } from './components/LandingScreen';
import { ServiceSelectionScreen } from './components/ServiceSelectionScreen';
import { ScheduleScreen } from './components/ScheduleScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { DEFAULT_CONFIG, mergeConfig } from './config/defaults';
import { resolveDirection } from './utils/format';
import { computeTotalPrice, isCustomerValid } from './utils/services';
import { todayIso } from './utils/dates';
import type { BookingPayload, BookingStep, SalonConfig, Service, Staff } from './types';

const CONFIG_TIMEOUT_MS = 3000;

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

export default function App() {
  const ctx = useMemo(() => {
    try {
      return getContext();
    } catch {
      return { lang: 'en', extra: {} } as ReturnType<typeof getContext>;
    }
  }, []);
  const locale = ctx.lang || 'en';

  const [config, setConfig] = useState<SalonConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<BookingStep>('landing');

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(ctx.name ?? '');
  const [customerPhone, setCustomerPhone] = useState<string>(ctx.phone ?? '');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const startedRef = useRef(false);
  const stepRef = useRef<BookingStep>('landing');
  stepRef.current = step;

  // Apply document direction from language.
  useEffect(() => {
    try {
      document.documentElement.setAttribute('dir', resolveDirection(locale));
      document.documentElement.setAttribute('lang', locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  // Load config (with 3s timeout → Demo Mode), apply theme, fire view event.
  useEffect(() => {
    trackView();
    let active = true;

    withTimeout(loadConfig(undefined, DEFAULT_CONFIG), CONFIG_TIMEOUT_MS)
      .then((fetched) => {
        if (!active) return;
        const merged = mergeConfig(fetched as Partial<SalonConfig> | null);
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

  // Abandon tracking: fire when the WebView closes before confirmation.
  useEffect(() => {
    const onUnload = () => {
      if (stepRef.current !== 'confirmation') {
        track('abandon', { lastStep: stepRef.current });
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const applyThemeSafe = (cfg: SalonConfig) => {
    try {
      applyTheme(themeFromConfig(cfg as unknown as Record<string, any>));
    } catch {
      // Fall back to light mode: ensure no dark attribute lingers.
      try {
        document.documentElement.removeAttribute('data-theme');
      } catch {
        /* ignore */
      }
    }
  };

  const go = (next: BookingStep) => {
    setStep(next);
    track('step', { step: next });
  };

  const handleServicesChange = (services: Service[]) => {
    if (!startedRef.current && services.length > 0) {
      startedRef.current = true;
      track('start', { services: services.map((s) => s.id) });
    }
    setSelectedServices(services);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(''); // clear slot on date change
  };

  const canContinueServices = selectedServices.length > 0;
  const canContinueSchedule = Boolean(selectedDate && selectedSlot);
  const canConfirm = isCustomerValid(customerName, customerPhone);

  const buildPayload = (): BookingPayload => ({
    services: selectedServices.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      duration: s.duration,
    })),
    staff: selectedStaff
      ? { id: selectedStaff.id, name: selectedStaff.name }
      : undefined,
    date: selectedDate,
    slot: selectedSlot,
    name: customerName.trim(),
    phone: customerPhone.trim(),
    notes: customerNotes.trim() || undefined,
    totalPrice: computeTotalPrice(selectedServices),
  });

  const handleConfirm = async () => {
    if (!canConfirm || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await createAppointment(buildPayload() as any);
      track('complete', {
        services: selectedServices.map((s) => s.id),
        staff: selectedStaff?.id,
        date: selectedDate,
        slot: selectedSlot,
      });
      go('confirmation');
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

  if (loading) {
    return (
      <div className="app">
        <div className="skeleton" aria-busy="true" aria-live="polite">
          <div className="skeleton__bar" />
          <div className="skeleton__block" />
          <div className="skeleton__block" />
        </div>
      </div>
    );
  }

  const showFooter = step !== 'landing' && step !== 'confirmation';

  return (
    <div className="app">
      <Header config={config} step={step} />

      {/* Screen-reader step announcements */}
      <div className="sr-only" aria-live="polite">
        {step}
      </div>

      <main className="content">
        {step === 'landing' && (
          <LandingScreen config={config} onStart={() => go('services')} />
        )}

        {step === 'services' && (
          <ServiceSelectionScreen
            config={config}
            locale={locale}
            selectedServices={selectedServices}
            onChange={handleServicesChange}
          />
        )}

        {step === 'schedule' && (
          <ScheduleScreen
            config={config}
            locale={locale}
            selectedStaff={selectedStaff}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            onStaffChange={setSelectedStaff}
            onDateChange={handleDateChange}
            onSlotChange={setSelectedSlot}
          />
        )}

        {step === 'review' && (
          <ReviewScreen
            config={config}
            locale={locale}
            selectedServices={selectedServices}
            selectedStaff={selectedStaff}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            name={customerName}
            phone={customerPhone}
            notes={customerNotes}
            submitting={submitting}
            error={error}
            onNameChange={setCustomerName}
            onPhoneChange={setCustomerPhone}
            onNotesChange={setCustomerNotes}
            onConfirm={handleConfirm}
          />
        )}

        {step === 'confirmation' && (
          <ConfirmationScreen
            config={config}
            locale={locale}
            selectedServices={selectedServices}
            selectedStaff={selectedStaff}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            failed={false}
            onClose={() => window.close()}
          />
        )}
      </main>

      {showFooter && (
        <footer className="footer">
          <button
            className="btn btn--ghost"
            onClick={() =>
              go(step === 'review' ? 'schedule' : step === 'schedule' ? 'services' : 'landing')
            }
          >
            {config.labels.back}
          </button>
          {step === 'services' && (
            <button
              className="btn btn--primary"
              disabled={!canContinueServices}
              onClick={() => go('schedule')}
            >
              {config.labels.continue}
            </button>
          )}
          {step === 'schedule' && (
            <button
              className="btn btn--primary"
              disabled={!canContinueSchedule}
              onClick={() => go('review')}
            >
              {config.labels.continue}
            </button>
          )}
          {/* Review step: the confirm button lives inside the ReviewScreen form. */}
        </footer>
      )}
    </div>
  );
}
