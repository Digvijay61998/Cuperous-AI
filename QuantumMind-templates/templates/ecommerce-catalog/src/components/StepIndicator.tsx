import React from 'react';
import { EcomStep } from '../types';

interface StepIndicatorProps {
  currentStep: EcomStep;
  steps: { key: EcomStep; label: string }[];
}

const STEP_ORDER: EcomStep[] = [
  'intro',
  'browse',
  'detail',
  'checkout',
  'confirmation',
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <nav className="step-indicator" aria-label="Shopping progress">
      <div className="step-indicator__bar">
        {steps.map((step, i) => {
          let state: 'completed' | 'active' | 'upcoming';
          if (currentStep === 'confirmation') {
            state = 'completed';
          } else if (i < currentIndex) {
            state = 'completed';
          } else if (i === currentIndex) {
            state = 'active';
          } else {
            state = 'upcoming';
          }

          return (
            <div
              key={step.key}
              className={`step-indicator__segment step-indicator__segment--${state}`}
              aria-label={`${step.label}: ${state}`}
            >
              <div className="step-indicator__fill" />
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default StepIndicator;
