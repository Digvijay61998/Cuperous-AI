import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingScreen } from '../../components/LandingScreen';
import { DEFAULT_CONFIG } from '../../config/defaults';
import type { SalonConfig } from '../../types';

const cfg = (over: Partial<SalonConfig> = {}): SalonConfig => ({
  ...DEFAULT_CONFIG,
  ...over,
});

describe('LandingScreen', () => {
  it('renders hero title, subtitle, and CTA', () => {
    render(<LandingScreen config={cfg()} onStart={() => {}} />);
    expect(screen.getByText(DEFAULT_CONFIG.hero_title)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: DEFAULT_CONFIG.labels.cta_book_now }),
    ).toBeInTheDocument();
  });

  it('fires onStart when CTA tapped', () => {
    const onStart = vi.fn();
    render(<LandingScreen config={cfg()} onStart={onStart} />);
    fireEvent.click(
      screen.getByRole('button', { name: DEFAULT_CONFIG.labels.cta_book_now }),
    );
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('shows review snippet when show_reviews and reviews exist', () => {
    render(<LandingScreen config={cfg({ show_reviews: true })} onStart={() => {}} />);
    expect(screen.getByLabelText('Customer rating')).toBeInTheDocument();
  });

  it('hides review snippet when reviews are empty', () => {
    render(
      <LandingScreen
        config={cfg({ show_reviews: true, reviews: [] })}
        onStart={() => {}}
      />,
    );
    expect(screen.queryByLabelText('Customer rating')).not.toBeInTheDocument();
  });

  it('hides review snippet when show_reviews is false', () => {
    render(
      <LandingScreen config={cfg({ show_reviews: false })} onStart={() => {}} />,
    );
    expect(screen.queryByLabelText('Customer rating')).not.toBeInTheDocument();
  });
});
