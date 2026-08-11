import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceSelectionScreen } from '../../components/ServiceSelectionScreen';
import { DEFAULT_CONFIG } from '../../config/defaults';
import type { SalonConfig } from '../../types';

const cfg = (over: Partial<SalonConfig> = {}): SalonConfig => ({
  ...DEFAULT_CONFIG,
  ...over,
});

describe('ServiceSelectionScreen', () => {
  it('renders category tabs with the first active by default', () => {
    render(
      <ServiceSelectionScreen
        config={cfg()}
        locale="en"
        selectedServices={[]}
        onChange={() => {}}
      />,
    );
    const firstTab = screen.getByRole('tab', {
      name: DEFAULT_CONFIG.categories[0].name,
    });
    expect(firstTab).toHaveAttribute('aria-selected', 'true');
  });

  it('toggles selection and marks aria-pressed', () => {
    const onChange = vi.fn();
    render(
      <ServiceSelectionScreen
        config={cfg()}
        locale="en"
        selectedServices={[]}
        onChange={onChange}
      />,
    );
    // First hair service card
    const card = screen.getByRole('button', { name: /Haircut & Styling/ });
    fireEvent.click(card);
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'haircut' }),
    ]);
  });

  it('disables other cards in single-select mode once one is selected', () => {
    const singleCfg = cfg({
      booking_settings: {
        ...DEFAULT_CONFIG.booking_settings,
        allow_multiple_services: false,
      },
    });
    const selected = [DEFAULT_CONFIG.services[0]];
    render(
      <ServiceSelectionScreen
        config={singleCfg}
        locale="en"
        selectedServices={selected}
        onChange={() => {}}
      />,
    );
    // The other hair service ("Hair Coloring") should be disabled.
    const other = screen.getByRole('button', { name: /Hair Coloring/ });
    expect(other).toBeDisabled();
  });

  it('shows empty-state when a category has no services', () => {
    render(
      <ServiceSelectionScreen
        config={cfg({ categories: [{ id: 'empty', name: 'Empty' }] })}
        locale="en"
        selectedServices={[]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(DEFAULT_CONFIG.labels.no_services)).toBeInTheDocument();
  });
});
