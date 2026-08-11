import React from 'react';
import { BeautyConfig, Service } from '../types';
import CategoryIconGrid from './CategoryIconGrid';
import ServiceCard from './ServiceCard';
import RunningTotalFooter from './RunningTotalFooter';
import { filterByCategory, computeTotalPrice } from '../utils/services';

interface BrowseServicesScreenProps {
  config: BeautyConfig;
  locale: string;
  selectedServices: Service[];
  selectedCategory: string;
  onCategorySelect: (id: string) => void;
  onServiceToggle: (service: Service) => void;
  onContinue: () => void;
}

const BrowseServicesScreen: React.FC<BrowseServicesScreenProps> = ({
  config,
  locale,
  selectedServices,
  selectedCategory,
  onCategorySelect,
  onServiceToggle,
  onContinue,
}) => {
  const filtered = filterByCategory(config.services, selectedCategory);
  const total = computeTotalPrice(selectedServices);

  return (
    <section className="browse-screen" aria-label="Browse services">
      <CategoryIconGrid
        categories={config.categories}
        selectedId={selectedCategory}
        onSelect={onCategorySelect}
        ariaLabel="Filter by category"
      />

      <div className="browse-screen__services">
        {filtered.length === 0 ? (
          <p className="browse-screen__empty">{config.labels.no_services}</p>
        ) : (
          filtered.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={selectedServices.some((s) => s.id === service.id)}
              currency={config.currency}
              locale={locale}
              onToggle={onServiceToggle}
              addLabel={config.labels.add}
              removeLabel={config.labels.remove}
            />
          ))
        )}
      </div>

      <RunningTotalFooter
        selectedCount={selectedServices.length}
        totalPrice={total}
        currency={config.currency}
        locale={locale}
        canContinue={selectedServices.length > 0}
        continueLabel={config.labels.continue}
        onContinue={onContinue}
      />
    </section>
  );
};

export default BrowseServicesScreen;
