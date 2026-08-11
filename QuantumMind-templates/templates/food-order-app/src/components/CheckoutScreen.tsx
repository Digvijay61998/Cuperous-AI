import React from 'react';
import { FoodOrderConfig, MenuItem } from '../types';
import { computeSubtotal, computeTax, computeTotal } from '../utils/cart';
import { formatCurrency } from '../utils/format';

interface CheckoutScreenProps {
  config: FoodOrderConfig;
  locale: string;
  cart: Map<string, number>;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
  submitting: boolean;
  error: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onConfirm: () => void;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  config,
  locale,
  cart,
  customerName,
  customerPhone,
  customerNotes,
  submitting,
  error,
  onNameChange,
  onPhoneChange,
  onNotesChange,
  onConfirm,
}) => {
  const subtotal = computeSubtotal(cart, config.menu_items);
  const tax = computeTax(subtotal, config.tax_rate);
  const total = computeTotal(subtotal, tax, config.delivery_fee);

  const fmt = (amount: number) => formatCurrency(amount, config.currency, locale);

  // Get cart items with details
  const cartItems: { item: MenuItem; qty: number }[] = [];
  for (const [itemId, qty] of cart) {
    const item = config.menu_items.find((mi) => mi.id === itemId);
    if (item && qty > 0) {
      cartItems.push({ item, qty });
    }
  }

  const canSubmit = customerName.trim().length > 0 && customerPhone.trim().length > 0 && !submitting;

  return (
    <section className="checkout-screen" aria-labelledby="checkout-heading">
      <h2 id="checkout-heading" className="checkout-screen__heading">
        {config.labels.order_summary}
      </h2>

      <div className="checkout-screen__summary">
        <ul className="checkout-screen__items">
          {cartItems.map(({ item, qty }) => (
            <li key={item.id} className="checkout-screen__item">
              <span className="checkout-screen__item-name">{item.name}</span>
              <span className="checkout-screen__item-qty">×{qty}</span>
              <span className="checkout-screen__item-price">
                {fmt(item.price * qty)}
              </span>
            </li>
          ))}
        </ul>

        <div className="checkout-screen__totals">
          <div className="checkout-screen__row">
            <span>{config.labels.subtotal_label}</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="checkout-screen__row">
            <span>{config.labels.tax_label}</span>
            <span>{fmt(tax)}</span>
          </div>
          <div className="checkout-screen__row">
            <span>{config.labels.delivery_label}</span>
            <span>{fmt(config.delivery_fee)}</span>
          </div>
          <div className="checkout-screen__row checkout-screen__row--total">
            <span>{config.labels.total_label}</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      <div className="checkout-screen__delivery-time">
        <span className="checkout-screen__delivery-icon">🚗</span>
        <span>{config.labels.delivery_time_label}: {config.estimated_delivery_time}</span>
      </div>

      <form
        className="checkout-screen__form"
        onSubmit={(e) => { e.preventDefault(); onConfirm(); }}
      >
        <div className="checkout-screen__field">
          <label htmlFor="checkout-name">{config.labels.full_name}</label>
          <input
            id="checkout-name"
            type="text"
            value={customerName}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div className="checkout-screen__field">
          <label htmlFor="checkout-phone">{config.labels.phone_number}</label>
          <input
            id="checkout-phone"
            type="tel"
            value={customerPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            maxLength={20}
            required
          />
        </div>
        <div className="checkout-screen__field">
          <label htmlFor="checkout-notes">{config.labels.notes}</label>
          <textarea
            id="checkout-notes"
            value={customerNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>

        {error && (
          <div className="checkout-screen__error" role="alert">
            {error}
          </div>
        )}

        <button
          className={`checkout-screen__submit${submitting ? ' checkout-screen__submit--loading' : ''}`}
          type="submit"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
        >
          {config.labels.place_order}
        </button>
      </form>
    </section>
  );
};

export default CheckoutScreen;
