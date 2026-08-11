import React from 'react';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  onAdd: () => void;
  onTap: () => void;
  currency: string;
  locale: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cartQuantity,
  onAdd,
  onTap,
  currency,
  locale,
}) => {
  return (
    <div className="product-card" onClick={onTap} role="button" tabIndex={0} aria-label={`View ${product.name}`}>
      <div className="product-card__image-wrap">
        {product.image ? (
          <img
            className="product-card__image"
            src={product.image}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div className="product-card__image-placeholder" aria-label={product.name}>
            🛍️
          </div>
        )}
        <button
          className={`product-card__add-btn${cartQuantity > 0 ? ' product-card__add-btn--in-cart' : ''}`}
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          type="button"
          aria-label={`Add ${product.name} to cart`}
        >
          +
        </button>
      </div>
      <div className="product-card__body">
        <span className="product-card__name">{product.name}</span>
        {product.description && (
          <span className="product-card__desc">{product.description}</span>
        )}
        <div className="product-card__price-row">
          <span className="product-card__price">
            {formatCurrency(product.price, currency, locale)}
          </span>
          {product.originalPrice && (
            <span className="product-card__original-price">
              {formatCurrency(product.originalPrice, currency, locale)}
            </span>
          )}
          {product.discount && product.discount > 0 && (
            <span className="product-card__discount">{product.discount}% Off</span>
          )}
        </div>
        <div className="product-card__rating">
          <span className="product-card__star">★</span>
          <span>{product.rating.toFixed(1)}</span>
          {product.reviewCount !== undefined && (
            <span className="product-card__review-count">
              ({product.reviewCount.toLocaleString()})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
