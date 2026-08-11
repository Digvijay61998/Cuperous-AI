import { useEffect, useState } from 'react';

interface SuccessBannerProps {
  message: string;
  autoCloseDelay: number; // seconds
  closeInstruction: string;
}

export function SuccessBanner({ message, autoCloseDelay, closeInstruction }: SuccessBannerProps) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (autoCloseDelay <= 0) {
      setShowHint(true);
      return;
    }

    const timer = setTimeout(() => {
      // Attempt to close the WebView
      try {
        window.parent.postMessage({ type: 'close' }, '*');
      } catch {
        /* ignore */
      }
      try {
        window.close();
      } catch {
        /* ignore */
      }
      // If still open, show hint
      setShowHint(true);
    }, autoCloseDelay * 1000);

    return () => clearTimeout(timer);
  }, [autoCloseDelay]);

  return (
    <div className="success-banner" role="status" aria-live="polite">
      <div className="success-banner__icon" aria-hidden="true">
        ✓
      </div>
      <h3 className="success-banner__message">{message}</h3>
      {showHint && (
        <p className="success-banner__close-hint">{closeInstruction}</p>
      )}
    </div>
  );
}
