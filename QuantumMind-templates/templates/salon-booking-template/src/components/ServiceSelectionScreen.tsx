import { useState } from 'react';
import type { SalonConfig, Service } from '../types';
import { formatCurrency, truncate } from '../utils/format';
import { filterServicesByCategory, toggleService } from '../utils/services';

interface ServiceSelectionScreenProps {
  config: SalonConfig;
  locale: string;
  selectedServices: Service[];
  onChange: (services: Service[]) => void;
}

const MAX_MULTI = 10;

export function ServiceSelectionScreen({
  config,
  locale,
  selectedServices,
  onChange,
}: ServiceSelectionScreenProps) {
  const { categories, services, labels, currency, booking_settings } = config;
  const allowMultiple = booking_settings.allow_multiple_services;

  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0]?.id ?? '',
  );

  const visibleServices = activeCategory
    ? filterServicesByCategory(services, activeCategory)
    : services;

  const isSelected = (s: Service) =>
    selectedServices.some((sel) => sel.id === s.id);

  const atCap =
    allowMultiple && selectedServices.length >= MAX_MULTI;
  const singleLocked = !allowMultiple && selectedServices.length >= 1;

  const handleToggle = (service: Service) => {
    onChange(
      toggleService(selectedServices, service, allowMultiple, MAX_MULTI),
    );
  };

  return (
    <section className="stack" aria-labelledby="services-title">
      <h2 id="services-title" className="section-title">
        {labels.select_service}
      </h2>

      {categories.length > 0 && (
        <div className="tabs" role="tablist" aria-label="Service categories">
          {categories.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              className={`tab ${activeCategory === cat.id ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {visibleServices.length === 0 ? (
        <p className="empty-state">{labels.no_services}</p>
      ) : (
        <div className="stack">
          {visibleServices.map((service) => {
            const selected = isSelected(service);
            // In single mode, lock other cards once one is chosen.
            // In multi mode, lock unselected cards once cap is reached.
            const disabled = selected
              ? false
              : singleLocked || atCap;
            return (
              <button
                key={service.id}
                className={`service-card ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => handleToggle(service)}
              >
                {service.image && (
                  <img
                    className="service-card__img"
                    src={service.image}
                    alt=""
                    aria-hidden="true"
                  />
                )}
                <div className="service-card__info">
                  <span className="service-card__name">
                    {truncate(service.name, 60)}
                  </span>
                  <span className="service-card__meta">
                    {service.duration} min
                  </span>
                </div>
                <span className="service-card__price">
                  {formatCurrency(service.price, currency, locale)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
