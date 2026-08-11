import React from 'react';
import { formatCurrency } from '../utils/format';

interface CartFooterProps {
  itemCount: number;
  total: number;
  currency: string;
  locale: string;
  onContinue: () => void;
  continueLabel: string;
  itemsLabel: string;
}

const CartFooter: React.FC<CartFooterProps> = ({
  itemCount,
  total,
  currency,
  locale,
  onContinue,
  continueLabel,
  itemsLabel,
}) => {
  return (
    <div className="cart-footer" role="status" aria-live="polite">
      <div className="cart-footer__info">
        <span className="cart-footer__count">
          {itemsLabel.replace('{count}', String(itemCount))}
        </span>
        <span className="cart-footer__total">
          {formatCurrency(total, currency, locale)}
        </span>
      </div>
      <button
        className="cart-footer__btn"
        onClick={onContinue}
        disabled={itemCount === 0}
        type="button"
        aria-disabled={itemCount === 0}
      >
        {continueLabel}
      </button>
    </div>
  );
};

export default CartFooter;
