import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FoodOrderConfig, FoodStep, TransitionDirection } from './types';
import { defaultConfig, mergeConfig } from './config/defaults';
import { resolveDirection } from './utils/direction';
import { addToCart, removeFromCart, computeSubtotal, computeTax, computeTotal } from './utils/cart';
import StepIndicator from './components/StepIndicator';
import StepTransition from './components/StepTransition';
import IntroScreen from './components/IntroScreen';
import BrowseMenuScreen from './components/BrowseMenuScreen';
import CheckoutScreen from './components/CheckoutScreen';
import ConfirmationScreen from './components/ConfirmationScreen';
import {
  getContext,
  loadConfig,
  applyTheme,
  themeFromConfig,
  track,
  createAppointment,
} from '@quantum/template-sdk';

const STEPS: { key: FoodStep; label: string }[] = [
  { key: 'intro', label: 'Welcome' },
  { key: 'browse_menu', label: 'Menu' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'confirmation', label: 'Done' },
];

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<FoodOrderConfig>(defaultConfig);
  const [locale, setLocale] = useState('en');
  const [step, setStep] = useState<FoodStep>('intro');
  const [direction, setDirection] = useState<TransitionDirection>('forward');

  // Cart state
  const [cart, setCart] = useState<Map<string, number>>(new Map());

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Order submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const stepRef = useRef<FoodStep>('intro');
  stepRef.current = step;

  // Track if first item was added (for analytics)
  const firstAddTracked = useRef(false);

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

        const merged = mergeConfig(fetchedConfig as Partial<FoodOrderConfig>);
        setConfig(merged);

        // Apply theme
        try {
          const tokens = themeFromConfig(merged);
          applyTheme(tokens);
          if (merged.dark_mode) {
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.setAttribute('data-theme', 'light');
          }
        } catch {
          // Fall back to dark mode on theme failure
          document.documentElement.setAttribute('data-theme', 'dark');
        }

        // Fire view event
        try {
          track('view', { step: 'intro' });
        } catch {
          // silent
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

  // Navigation
  const goForward = useCallback((nextStep: FoodStep) => {
    setDirection('forward');
    setStep(nextStep);
    try {
      track('step', { step: nextStep });
    } catch {
      // silent
    }
  }, []);

  const goBack = useCallback((prevStep: FoodStep) => {
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
    goForward('browse_menu');
  };

  const handleAddToCart = useCallback((itemId: string) => {
    setCart((prev) => {
      const newCart = addToCart(prev, itemId);
      // Track first item added
      if (!firstAddTracked.current) {
        firstAddTracked.current = true;
        try {
          track('start', { itemId });
        } catch {
          // silent
        }
      }
      return newCart;
    });
  }, []);

  const handleRemoveFromCart = useCallback((itemId: string) => {
    setCart((prev) => removeFromCart(prev, itemId));
  }, []);

  const handleBrowseContinue = () => {
    goForward('checkout');
  };

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const subtotal = computeSubtotal(cart, config.menu_items);
      const tax = computeTax(subtotal, config.tax_rate);
      const total = computeTotal(subtotal, tax, config.delivery_fee);

      const items: any[] = [];
      for (const [itemId, qty] of cart) {
        const menuItem = config.menu_items.find((mi) => mi.id === itemId);
        if (menuItem && qty > 0) {
          items.push({
            itemId,
            name: menuItem.name,
            quantity: qty,
            unitPrice: menuItem.price,
            lineTotal: menuItem.price * qty,
          });
        }
      }

      await createAppointment({
        items,
        subtotal,
        tax,
        deliveryFee: config.delivery_fee,
        total,
        customerName,
        customerPhone,
        notes: customerNotes || undefined,
        currency: config.currency,
      } as any);

      goForward('confirmation');

      try {
        track('complete', { items: items.length, total });
      } catch {
        // silent
      }
    } catch (err: any) {
      setSubmitting(false);
      setError(config.labels.order_error);
      try {
        track('error', { message: config.labels.order_error, endpoint: '/template/actions/appointment' });
      } catch {
        // silent
      }
    }
  };

  const handleClose = () => {
    try {
      window.close();
    } catch {
      // Some browsers don't allow window.close
    }
  };

  // Back navigation
  const handleBack = () => {
    switch (step) {
      case 'browse_menu':
        goBack('intro');
        break;
      case 'checkout':
        goBack('browse_menu');
        break;
    }
  };

  const showBackButton = step === 'browse_menu' || step === 'checkout';

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__logo" aria-hidden="true">
          {defaultConfig.brand_name.charAt(0)}
        </div>
        <div className="app-loading__shimmer" />
      </div>
    );
  }

  return (
    <div className="app" role="main">
      <StepIndicator currentStep={step} steps={STEPS} />

      {showBackButton && (
        <button
          className="app__back-btn"
          onClick={handleBack}
          type="button"
          aria-label={config.labels.back}
        >
          ← {config.labels.back}
        </button>
      )}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Step: {STEPS.find((s) => s.key === step)?.label}
      </div>

      <StepTransition direction={direction} stepKey={step}>
        {step === 'intro' && (
          <IntroScreen config={config} onStart={handleStart} />
        )}
        {step === 'browse_menu' && (
          <BrowseMenuScreen
            config={config}
            locale={locale}
            cart={cart}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onContinue={handleBrowseContinue}
          />
        )}
        {step === 'checkout' && (
          <CheckoutScreen
            config={config}
            locale={locale}
            cart={cart}
            customerName={customerName}
            customerPhone={customerPhone}
            customerNotes={customerNotes}
            submitting={submitting}
            error={error}
            onNameChange={setCustomerName}
            onPhoneChange={setCustomerPhone}
            onNotesChange={setCustomerNotes}
            onConfirm={handleConfirm}
          />
        )}
        {step === 'confirmation' && (
          <ConfirmationScreen config={config} onClose={handleClose} />
        )}
      </StepTransition>
    </div>
  );
};

export default App;
