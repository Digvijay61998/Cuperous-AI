import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the SDK so the flow runs in Demo Mode with a successful booking.
const trackMock = vi.fn();
const createAppointmentMock = vi.fn().mockResolvedValue({ data: { ok: true } });

vi.mock('@quantum/template-sdk', () => ({
  getContext: () => ({ lang: 'en', name: 'Test User', phone: '123456', extra: {} }),
  loadConfig: (_id: unknown, fallback: unknown) => Promise.resolve(fallback),
  applyTheme: vi.fn(),
  themeFromConfig: vi.fn(() => ({})),
  trackView: vi.fn(),
  track: (...args: unknown[]) => trackMock(...args),
  createAppointment: (...args: unknown[]) => createAppointmentMock(...args),
}));

import App from '../../App';

describe('Booking flow integration', () => {
  beforeEach(() => {
    trackMock.mockClear();
    createAppointmentMock.mockClear();
  });

  it('navigates Landing → Services → Schedule → Review → Confirmation', async () => {
    render(<App />);

    // Landing (after config resolves)
    const bookNow = await screen.findByRole('button', { name: 'Book Now' });
    fireEvent.click(bookNow);

    // Services — pick the first service
    const service = await screen.findByRole('button', {
      name: /Haircut & Styling/,
    });
    fireEvent.click(service);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Schedule — pick a date then a time slot
    const dateOptions = await screen.findAllByRole('option');
    // Pick a date that has slots: iterate until slots appear.
    fireEvent.click(dateOptions[1]);
    const slots = await screen.findAllByRole('option', { selected: false });
    // Find a time-slot option (labels contain AM/PM)
    const timeSlot = slots.find((el) => /AM|PM/.test(el.textContent || ''));
    if (timeSlot) fireEvent.click(timeSlot);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Review — name & phone pre-filled from context
    const nameInput = (await screen.findByPlaceholderText(
      'e.g. Alex Morgan',
    )) as HTMLInputElement;
    expect(nameInput.value).toBe('Test User');

    const confirm = screen.getByRole('button', { name: 'Confirm booking' });
    fireEvent.click(confirm);

    // Confirmation
    await waitFor(() =>
      expect(
        screen.getByText('Your appointment is confirmed!'),
      ).toBeInTheDocument(),
    );
    expect(createAppointmentMock).toHaveBeenCalledOnce();
    expect(trackMock).toHaveBeenCalledWith('complete', expect.any(Object));
  });
});
