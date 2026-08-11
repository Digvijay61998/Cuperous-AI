import React, { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../utils/format';

interface RunningTotalFooterProps {
  selectedCount: number;
  totalPrice: number;
  currency: string;
  locale: string;
  canContinue: boolean;
  continueLabel: string;
  onContinue: () => void;
}

const RunningTotalFooter: React.FC<RunningTotalFooterProps> = ({
  selectedCount,
  totalPrice,
  currency,
  locale,
  canContinue,
  continueLabel,
  onContinue,
}) => {
  const [pulse, setPulse] = useState(false);
  const prevCount = useRef(selectedCount);

  useEffect(() => {
    if (prevCount.current !== selectedCount) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 200);
      prevCount.current = selectedCount;
      return () => clearTimeout(timer);
    }
  }, [selectedCount]);

  return (
    <footer className="running-total">
      <div className="running-total__info">
        <span className={`running-total__value ${pulse ? 'running-total__value--pulse' : ''}`}>
          {selectedCount} services · {formatCurrency(totalPrice, currency, locale)}
        </span>
      </div>
      <button
        className="running-total__btn"
        onClick={onContinue}
        disabled={!canContinue}
        type="button"
      >
        {continueLabel}
      </button>
    </footer>
  );
};

export default RunningTotalFooter;
