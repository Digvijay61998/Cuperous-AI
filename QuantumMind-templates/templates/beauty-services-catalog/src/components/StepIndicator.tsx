import React from 'react';
import { BeautyStep } from '../types';

interface StepIndicatorProps {
  currentStep: BeautyStep;
  steps: { key: BeautyStep; label: string }[];
}

const STEP_ORDER: BeautyStep[] = [
  'welcome',
  'browse_services',
  'date_time',
  'your_details',
  'confirmation',
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <nav className="step-indicator" aria-label="Booking progress">
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
              {state === 'completed' && (
                <span className="step-indicator__check" aria-hidden="true">
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default StepIndicator;
