import React, { useState } from 'react';
import { EcommerceConfig, Product } from '../types';
import { formatCurrency, formatRating } from '../utils/format';
import SizePicker from './SizePicker';

interface ProductDetailScreenProps {
  config: EcommerceConfig;
  product: Product;
  locale: string;
  onGoToCart: () => void;
  onBuyNow: (productId: string, size: string) => void;
}

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  config,
  product,
  locale,
  onGoToCart,
  onBuyNow,
}) => {
  const sizes = product.sizes ?? [];
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? '');

  return (
    <section className="detail-screen" aria-labelledby="detail-title">
      <div className="detail-screen__image-wrap">
        {product.image ? (
          <img
            className="detail-screen__image"
            src={product.image}
            alt={product.name}
          />
        ) : (
          <div className="detail-screen__image-placeholder" aria-label={product.name}>
            🛍️
          </div>
        )}
      </div>

      {sizes.length > 0 && (
        <div className="detail-screen__size-section">
          <span className="detail-screen__size-label">
            {config.labels.size_label} {selectedSize}
          </span>
          <SizePicker
            sizes={sizes}
            selectedSize={selectedSize}
            onSelect={setSelectedSize}
          />
        </div>
      )}

      <div className="detail-screen__info">
        <h2 id="detail-title" className="detail-screen__name">{product.name}</h2>

        <div className="detail-screen__rating-row">
          <span className="detail-screen__stars">{formatRating(product.rating)}</span>
          {product.reviewCount !== undefined && (
            <span className="detail-screen__review-count">
              ({product.reviewCount.toLocaleString()})
            </span>
          )}
        </div>

        <div className="detail-screen__price-section">
          {product.originalPrice && (
            <span className="detail-screen__original-price">
              {formatCurrency(product.originalPrice, config.currency, locale)}
            </span>
          )}
          <span className="detail-screen__price">
            {formatCurrency(product.price, config.currency, locale)}
          </span>
          {product.discount && product.discount > 0 && (
            <span className="detail-screen__discount">{product.discount}% Off</span>
          )}
        </div>

        <div className="detail-screen__description-section">
          <h3 className="detail-screen__section-title">{config.labels.product_details}</h3>
          <p className="detail-screen__description">
            {product.description || 'No description available.'}
          </p>
        </div>

        <div className="detail-screen__delivery">
          <span className="detail-screen__delivery-icon">🚚</span>
          <span>{config.labels.delivery_in} {config.estimated_delivery_time}</span>
        </div>

        <div className="detail-screen__actions">
          <button
            className="detail-screen__btn detail-screen__btn--secondary"
            onClick={onGoToCart}
            type="button"
          >
            {config.labels.go_to_cart}
          </button>
          <button
            className="detail-screen__btn detail-screen__btn--primary"
            onClick={() => onBuyNow(product.id, selectedSize)}
            type="button"
          >
            {config.labels.buy_now}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductDetailScreen;
