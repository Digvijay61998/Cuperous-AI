import React from 'react';
import { EcommerceConfig, CartEntry, Product } from '../types';
import { computeSubtotal, computeTotal } from '../utils/cart';
import { formatCurrency } from '../utils/format';

interface CheckoutScreenProps {
  config: EcommerceConfig;
  locale: string;
  cart: Map<string, CartEntry>;
  customerName: string;
  customerPhone: string;
  submitting: boolean;
  error: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onConfirm: () => void;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  config,
  locale,
  cart,
  customerName,
  customerPhone,
  submitting,
  error,
  onNameChange,
  onPhoneChange,
  onConfirm,
}) => {
  const subtotal = computeSubtotal(cart, config.products);
  const total = computeTotal(subtotal, config.delivery_fee);

  const fmt = (amount: number) => formatCurrency(amount, config.currency, locale);

  // Get cart items with product details
  const cartItems: { product: Product; entry: CartEntry }[] = [];
  for (const entry of cart.values()) {
    const product = config.products.find((p) => p.id === entry.productId);
    if (product && entry.quantity > 0) {
      cartItems.push({ product, entry });
    }
  }

  const canSubmit =
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    cartItems.length > 0 &&
    !submitting;

  return (
    <section className="checkout-screen" aria-labelledby="checkout-heading">
      <h2 id="checkout-heading" className="checkout-screen__heading">
        {config.labels.shopping_list}
      </h2>

      <div className="checkout-screen__items">
        {cartItems.map(({ product, entry }) => (
          <div key={`${entry.productId}:${entry.size}`} className="checkout-screen__item-card">
            <div className="checkout-screen__item-image-wrap">
              {product.image ? (
                <img
                  className="checkout-screen__item-image"
                  src={product.image}
                  alt={product.name}
                />
              ) : (
                <div className="checkout-screen__item-image-placeholder">🛍️</div>
              )}
            </div>
            <div className="checkout-screen__item-details">
              <span className="checkout-screen__item-name">{product.name}</span>
              <span className="checkout-screen__item-size">Size: {entry.size}</span>
              <div className="checkout-screen__item-price-row">
                <span className="checkout-screen__item-price">
                  {fmt(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="checkout-screen__item-original">
                    {fmt(product.originalPrice)}
                  </span>
                )}
                {product.discount && product.discount > 0 && (
                  <span className="checkout-screen__item-discount">{product.discount}% Off</span>
                )}
              </div>
              <span className="checkout-screen__item-qty">Qty: {entry.quantity}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="checkout-screen__totals">
        <div className="checkout-screen__row">
          <span>{config.labels.subtotal_label}</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="checkout-screen__row">
          <span>{config.labels.delivery_fee_label}</span>
          <span>{config.delivery_fee === 0 ? config.labels.free : fmt(config.delivery_fee)}</span>
        </div>
        <div className="checkout-screen__row checkout-screen__row--total">
          <span>{config.labels.total_label}</span>
          <span>{fmt(total)}</span>
        </div>
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
          {config.labels.proceed_to_payment}
        </button>
      </form>
    </section>
  );
};

export default CheckoutScreen;
