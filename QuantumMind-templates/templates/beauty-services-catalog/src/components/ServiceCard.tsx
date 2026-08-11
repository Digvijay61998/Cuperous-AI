import React from 'react';
import { Service } from '../types';
import { truncateName } from '../utils/services';
import { formatCurrency } from '../utils/format';

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  currency: string;
  locale: string;
  onToggle: (service: Service) => void;
  addLabel: string;
  removeLabel: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected,
  currency,
  locale,
  onToggle,
  addLabel,
  removeLabel,
}) => {
  return (
    <div className={`service-card ${isSelected ? 'service-card--selected' : ''}`}>
      <div className="service-card__info">
        <h3 className="service-card__name">{truncateName(service.name)}</h3>
        <span className="service-card__duration">{service.duration} min</span>
        <span className="service-card__price">
          {formatCurrency(service.price, currency, locale)}
        </span>
      </div>
      <button
        className={`service-card__btn ${isSelected ? 'service-card__btn--remove' : 'service-card__btn--add'}`}
        onClick={() => onToggle(service)}
        aria-pressed={isSelected}
        type="button"
      >
        {isSelected ? removeLabel : addLabel}
      </button>
    </div>
  );
};

export default ServiceCard;
