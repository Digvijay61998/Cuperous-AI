import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EcommerceConfig, EcomStep, TransitionDirection, CartEntry, Product } from './types';
import { defaultConfig, mergeConfig } from './config/defaults';
import { resolveDirection } from './utils/direction';
import { addToCart, computeSubtotal, computeTotal, getCartItemCount } from './utils/cart';
import StepIndicator from './components/StepIndicator';
import StepTransition from './components/StepTransition';
import IntroScreen from './components/IntroScreen';
import BrowseProductsScreen from './components/BrowseProductsScreen';
import ProductDetailScreen from './components/ProductDetailScreen';
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

const STEPS: { key: EcomStep; label: string }[] = [
  { key: 'intro', label: 'Welcome' },
  { key: 'browse', label: 'Browse' },
  { key: 'detail', label: 'Detail' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'confirmation', label: 'Done' },
];

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EcommerceConfig>(defaultConfig);
  const [locale, setLocale] = useState('en');
  const [step, setStep] = useState<EcomStep>('intro');
  const [direction, setDirection] = useState<TransitionDirection>('forward');

  // Cart state
  const [cart, setCart] = useState<Map<string, CartEntry>>(new Map());

  // Selected product for detail view
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Order submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const stepRef = useRef<EcomStep>('intro');
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

        const merged = mergeConfig(fetchedConfig as Partial<EcommerceConfig>);
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
          // Fall back to light mode on theme failure
          document.documentElement.setAttribute('data-theme', 'light');
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
  const goForward = useCallback((nextStep: EcomStep) => {
    setDirection('forward');
    setStep(nextStep);
    try {
      track('step', { step: nextStep });
    } catch {
      // silent
    }
  }, []);

  const goBack = useCallback((prevStep: EcomStep) => {
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
    goForward('browse');
  };

  const handleAddToCart = useCallback((productId: string) => {
    const product = config.products.find((p) => p.id === productId);
    const defaultSize = product?.sizes?.[0] ?? 'One Size';
    setCart((prev) => {
      const newCart = addToCart(prev, productId, defaultSize);
      if (!firstAddTracked.current) {
        firstAddTracked.current = true;
        try {
          track('start', { productId });
        } catch {
          // silent
        }
      }
      return newCart;
    });
  }, [config.products]);

  const handleProductTap = useCallback((product: Product) => {
    setSelectedProduct(product);
    goForward('detail');
  }, [goForward]);

  const handleBrowseContinue = () => {
    goForward('checkout');
  };

  const handleGoToCart = () => {
    goForward('checkout');
  };

  const handleBuyNow = useCallback((productId: string, size: string) => {
    setCart((prev) => {
      const newCart = addToCart(prev, productId, size);
      if (!firstAddTracked.current) {
        firstAddTracked.current = true;
        try {
          track('start', { productId });
        } catch {
          // silent
        }
      }
      return newCart;
    });
    goForward('checkout');
  }, [goForward]);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const subtotal = computeSubtotal(cart, config.products);
      const total = computeTotal(subtotal, config.delivery_fee);

      const items: any[] = [];
      for (const entry of cart.values()) {
        const product = config.products.find((p) => p.id === entry.productId);
        if (product && entry.quantity > 0) {
          items.push({
            productId: entry.productId,
            name: product.name,
            size: entry.size,
            quantity: entry.quantity,
            unitPrice: product.price,
            lineTotal: product.price * entry.quantity,
          });
        }
      }

      await createAppointment({
        items,
        subtotal,
        deliveryFee: config.delivery_fee,
        total,
        customerName,
        customerPhone,
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
      case 'browse':
        goBack('intro');
        break;
      case 'detail':
        goBack('browse');
        break;
      case 'checkout':
        goBack('browse');
        break;
    }
  };

  const showBackButton = step === 'browse' || step === 'detail' || step === 'checkout';

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
        {step === 'browse' && (
          <BrowseProductsScreen
            config={config}
            locale={locale}
            cart={cart}
            onAddToCart={handleAddToCart}
            onProductTap={handleProductTap}
            onContinue={handleBrowseContinue}
          />
        )}
        {step === 'detail' && selectedProduct && (
          <ProductDetailScreen
            config={config}
            product={selectedProduct}
            locale={locale}
            onGoToCart={handleGoToCart}
            onBuyNow={handleBuyNow}
          />
        )}
        {step === 'checkout' && (
          <CheckoutScreen
            config={config}
            locale={locale}
            cart={cart}
            customerName={customerName}
            customerPhone={customerPhone}
            submitting={submitting}
            error={error}
            onNameChange={setCustomerName}
            onPhoneChange={setCustomerPhone}
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
