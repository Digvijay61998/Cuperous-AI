import React, { useEffect, useState } from 'react';
import { TransitionDirection } from '../types';

interface StepTransitionProps {
  direction: TransitionDirection;
  stepKey: string;
  children: React.ReactNode;
}

const StepTransition: React.FC<StepTransitionProps> = ({ direction, stepKey, children }) => {
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    setAnimating(true);
    const frame = requestAnimationFrame(() => {
      setAnimating(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [stepKey]);

  const enterClass = animating
    ? `step-enter-${direction}`
    : `step-enter-${direction} step-enter-${direction}-active`;

  return (
    <div
      className={`step-transition ${enterClass}`}
      key={stepKey}
    >
      {children}
    </div>
  );
};

export default StepTransition;
