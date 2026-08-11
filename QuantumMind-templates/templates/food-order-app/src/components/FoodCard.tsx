import React from 'react';
import { MenuItem } from '../types';
import { formatCurrency } from '../utils/format';

interface FoodCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  currency: string;
  locale: string;
}

const FoodCard: React.FC<FoodCardProps> = ({ item, quantity, onAdd, onRemove, currency, locale }) => {
  return (
    <div className="food-card">
      <div className="food-card__image-wrap">
        {item.image ? (
          <img
            className="food-card__image"
            src={item.image}
            alt={item.name}
            loading="lazy"
          />
        ) : (
          <div className="food-card__image-placeholder" aria-label={item.name}>
            🍔
          </div>
        )}
      </div>
      <div className="food-card__body">
        <span className="food-card__name">{item.name}</span>
        <div className="food-card__rating">
          <span className="food-card__star">★</span>
          <span>{item.rating.toFixed(1)}</span>
        </div>
        <div className="food-card__footer">
          <span className="food-card__price">
            {formatCurrency(item.price, currency, locale)}
          </span>
          {quantity === 0 ? (
            <button
              className="food-card__add-btn"
              onClick={onAdd}
              type="button"
              aria-label={`Add ${item.name} to cart`}
            >
              +
            </button>
          ) : (
            <div className="food-card__qty-controls">
              <button
                className="food-card__qty-btn"
                onClick={onRemove}
                type="button"
                aria-label={`Remove one ${item.name}`}
              >
                −
              </button>
              <span className="food-card__qty-value">{quantity}</span>
              <button
                className="food-card__qty-btn"
                onClick={onAdd}
                type="button"
                aria-label={`Add one more ${item.name}`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
