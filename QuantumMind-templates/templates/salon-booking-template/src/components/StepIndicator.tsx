import type { BookingStep } from '../types';

const FLOW_STEPS: BookingStep[] = [
  'landing',
  'services',
  'schedule',
  'review',
  'confirmation',
];

interface StepIndicatorProps {
  currentStep: BookingStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  // Hidden on the confirmation step per design.
  if (currentStep === 'confirmation') return null;

  const activeIndex = FLOW_STEPS.indexOf(currentStep);
  const stepNumber = activeIndex + 1;
  const total = FLOW_STEPS.length - 1; // exclude confirmation from the count

  return (
    <div
      className="dots"
      role="progressbar"
      aria-label={`Step ${stepNumber} of ${total}`}
      aria-valuenow={stepNumber}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {FLOW_STEPS.slice(0, total).map((s, i) => (
        <span
          key={s}
          className={`dot ${i <= activeIndex ? 'is-active' : ''}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
