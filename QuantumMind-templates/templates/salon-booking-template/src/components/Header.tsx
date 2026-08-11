import type { BookingStep, SalonConfig } from '../types';
import { StepIndicator } from './StepIndicator';

interface HeaderProps {
  config: SalonConfig;
  step: BookingStep;
}

export function Header({ config, step }: HeaderProps) {
  const name = config.business_name || 'Booking';
  const logo = config.business_logo;

  return (
    <header className="header">
      <div className="brand">
        {logo ? (
          <img className="brand__logo" src={logo} alt={name} />
        ) : (
          <div className="brand__logo brand__logo--fallback" aria-hidden="true">
            {name.charAt(0)}
          </div>
        )}
        <span className="brand__name">{name}</span>
      </div>
      <StepIndicator currentStep={step} />
    </header>
  );
}
