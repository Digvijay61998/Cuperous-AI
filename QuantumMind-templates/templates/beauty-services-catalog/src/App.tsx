import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BeautyConfig, BeautyStep, TransitionDirection, Service } from './types';
import { defaultConfig, mergeConfig } from './config/defaults';
import { resolveDirection } from './utils/direction';
import { todayIso } from './utils/dates';
import StepIndicator from './components/StepIndicator';
import StepTransition from './components/StepTransition';
import WelcomeScreen from './components/WelcomeScreen';
import BrowseServicesScreen from './components/BrowseServicesScreen';
import DateTimeScreen from './components/DateTimeScreen';
import YourDetailsScreen from './components/YourDetailsScreen';
import ConfirmationScreen from './components/ConfirmationScreen';
import {
  getContext,
  loadConfig,
  applyTheme,
  themeFromConfig,
  track,
  createAppointment,
} from '@quantum/template-sdk';

const STEPS: { key: BeautyStep; label: string }[] = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'browse_services', label: 'Browse Services' },
  { key: 'date_time', label: 'Date & Time' },
  { key: 'your_details', label: 'Your Details' },
  { key: 'confirmation', label: 'Confirmation' },
];

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<BeautyConfig>(defaultConfig);
  const [locale, setLocale] = useState('en');
  const [step, setStep] = useState<BeautyStep>('welcome');
  const [direction, setDirection] = useState<TransitionDirection>('forward');

  // Selections
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const stepRef = useRef<BeautyStep>('welcome');
  stepRef.current = step;

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        // Get context
        let ctx = { lang: 'en', name: '', phone: '' } as any;
        try {
          ctx = getContext();
        } catch {
          // Context parse failure — use defaults
        }

        const lang = ctx.lang || 'en';
        setLocale(lang);
        setCustomerName(ctx.name || '');
        setCustomerPhone(ctx.phone || '');

        // Set direction
        const dir = resolveDirection(lang);
        document.documentElement.setAttribute('dir', dir);

        // Load config with 3s timeout
        let fetchedConfig: Record<string, any> = {};
        try {
          fetchedConfig = await Promise.race([
            loadConfig(undefined, {}),
            new Promise<Record<string, any>>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 3000),
            ),
          ]);
        } catch {
          // Demo Mode — use defaults
        }

        const merged = mergeConfig(fetchedConfig as Partial<BeautyConfig>);
        setConfig(merged);

        // Pre-select first category
        if (merged.categories.length > 0) {
          setSelectedCategory(merged.categories[0].id);
        }

        // Apply theme
        try {
          const tokens = themeFromConfig(merged);
          applyTheme(tokens);
          if (merged.dark_mode) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        } catch {
          // Fall back to light mode on theme failure
          document.documentElement.removeAttribute('data-theme');
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Abandon tracking
  useEffect(() => {
    const handleAbandon = () => {
      if (stepRef.current !== 'confirmation') {
        try {
          track('abandon', { lastStep: stepRef.current });
        } catch {
          // silent
        }
      }
    };
    window.addEventListener('beforeunload', handleAbandon);
    return () => window.removeEventListener('beforeunload', handleAbandon);
  }, []);

  // Step navigation
  const goForward = useCallback((nextStep: BeautyStep) => {
    setDirection('forward');
    setStep(nextStep);
    try {
      track('step', { step: nextStep });
    } catch {
      // silent
    }
  }, []);

  const goBack = useCallback((prevStep: BeautyStep) => {
    setDirection('backward');
    setStep(prevStep);
    try {
      track('step', { step: prevStep });
    } catch {
      // silent
    }
  }, []);

  // Handlers
  const handleStart = () => {
    goForward('browse_services');
    try {
      track('start', { serviceIds: [] });
    } catch {
      // silent
    }
  };

  const handleBrowseContinue = () => {
    goForward('date_time');
    try {
      track('start', { serviceIds: selectedServices.map((s) => s.id) });
    } catch {
      // silent
    }
  };

  const handleDateTimeContinue = () => {
    goForward('your_details');
  };

  const handleServiceToggle = (service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, service];
    });
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(''); // Clear slot on date change
  };

  const handleConfirm = async () => {
    if (submitting) return; // Prevent duplicate
    setSubmitting(true);
    setError('');

    try {
      await createAppointment({
        date: selectedDate,
        slot: selectedSlot,
        name: customerName,
        phone: customerPhone,
        notes: customerNotes || undefined,
        services: selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration,
        })),
        totalPrice: selectedServices.reduce((sum, s) => sum + s.price, 0),
      } as any);
      goForward('confirmation');
    } catch (err: any) {
      setSubmitting(false);
      setError(config.labels.booking_error);
      try {
        track('error', { message: config.labels.booking_error, endpoint: '/template/actions/appointment' });
      } catch {
        // silent
      }
    }
  };

  const handleClose = () => {
    // Signal return to chat — close WebView
    try {
      window.close();
    } catch {
      // Some browsers don't allow window.close
    }
  };

  // Back navigation
  const handleBack = () => {
    switch (step) {
      case 'browse_services':
        goBack('welcome');
        break;
      case 'date_time':
        goBack('browse_services');
        break;
      case 'your_details':
        goBack('date_time');
        break;
    }
  };

  const showBackButton = step !== 'welcome' && step !== 'confirmation';

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__shimmer" />
      </div>
    );
  }

  return (
    <div className="app" role="main">
      <StepIndicator currentStep={step} steps={STEPS} />

      {showBackButton && (
        <button className="app__back-btn" onClick={handleBack} type="button" aria-label={config.labels.back}>
          ← {config.labels.back}
        </button>
      )}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Step: {STEPS.find((s) => s.key === step)?.label}
      </div>

      <StepTransition direction={direction} stepKey={step}>
        {step === 'welcome' && (
          <WelcomeScreen config={config} onStart={handleStart} />
        )}
        {step === 'browse_services' && (
          <BrowseServicesScreen
            config={config}
            locale={locale}
            selectedServices={selectedServices}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            onServiceToggle={handleServiceToggle}
            onContinue={handleBrowseContinue}
          />
        )}
        {step === 'date_time' && (
          <DateTimeScreen
            config={config}
            locale={locale}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            onDateChange={handleDateChange}
            onSlotChange={setSelectedSlot}
            onContinue={handleDateTimeContinue}
          />
        )}
        {step === 'your_details' && (
          <YourDetailsScreen
            config={config}
            locale={locale}
            selectedServices={selectedServices}
            date={selectedDate}
            slot={selectedSlot}
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
            date={selectedDate}
            slot={selectedSlot}
            onClose={handleClose}
          />
        )}
      </StepTransition>
    </div>
  );
};

export default App;
