# Implementation Plan: Salon Booking Template

## Overview

Implement a configurable, JSON-driven WhatsApp WebView booking template with a 5-step flow (Landing → Service Selection → Schedule → Review → Confirmation). The template follows the established `doctor-appointment` pattern using React + Vite, integrates with `@quantum/template-sdk`, and is fully config-driven with Demo Mode fallback.

## Tasks

- [x] 1. Project scaffolding and core types
  - [x] 1.1 Create template directory structure and config files
    - Create `templates/salon-booking-template/` with `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, and `manifest.json`
    - `package.json` must declare `@quantum/template-sdk` as workspace dependency, plus react, react-dom, and dev deps (vite, typescript, @vitejs/plugin-react, @types/react, @types/react-dom)
    - `vite.config.ts` must import and use `createTemplateConfig` from `../../tooling/vite.config.shared`
    - `manifest.json` must declare name, description, industry "salon", category "appointment", tags, supportedLanguages, supportsDarkMode, estimatedDuration, and full templateConfig schema array covering all config keys (business_name, business_logo, hero_image, hero_title, hero_subtitle, primary_color, secondary_color, text_color, background_color, font_family, dark_mode, services, staff, categories, working_hours, time_slot_interval, show_staff_selection, show_reviews, reviews, booking_settings, success_message, success_cta_text, currency, labels)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Define TypeScript interfaces and types
    - Create `src/types.ts` with interfaces: `SalonConfig`, `Service`, `Staff`, `Category`, `Review`, `WorkingHours`, `BookingSettings`, `Labels`, `BookingPayload`, and `BookingStep` type
    - All interfaces must match the design document data model exactly
    - _Requirements: 1.2, 2.3_

  - [x] 1.3 Create default configuration values for Demo Mode
    - Create `src/config/defaults.ts` exporting a complete `SalonConfig` object with realistic salon defaults (3+ services, 2+ staff, 3+ categories, working hours Mon-Sat, 30-min intervals)
    - Defaults must cover every key in the manifest templateConfig schema so Demo Mode is fully navigable
    - _Requirements: 2.2, 2.4, 10.2_

- [x] 2. Utility modules
  - [x] 2.1 Implement time slot computation utility
    - Create `src/utils/time-slots.ts` with a pure `computeTimeSlots(date, workingHours, intervalMinutes, excludePastSlots)` function
    - Must generate evenly-spaced slots from open to close time, exclude past slots when date is today, and return empty array when day has no working hours
    - _Requirements: 7.4, 7.5, 7.6_

  - [x]* 2.2 Write property test for time slot computation
    - **Property 6: Time slot computation**
    - **Validates: Requirements 7.4, 7.5**
    - Create `src/__tests__/utils/time-slots.property.test.ts` using fast-check with min 100 iterations
    - Verify: all slots within working hours, evenly spaced, past slots excluded for today, no slots when day is closed

  - [x] 2.3 Implement currency and date formatting utilities
    - Create `src/utils/format.ts` with `formatCurrency(amount, currency, locale)` using `Intl.NumberFormat` and `formatDate(isoDate, locale)` using `Intl.DateTimeFormat`
    - `formatCurrency` must produce exactly 2 fraction digits; when currency is empty, format as number without symbol
    - `formatDate` must include day, month, and year components
    - _Requirements: 14.4, 14.5, 14.6_

  - [x]* 2.4 Write property tests for formatting utilities
    - **Property 9: Currency formatting**
    - **Property 10: Date formatting**
    - **Validates: Requirements 14.4, 14.5, 14.6**
    - Create `src/__tests__/utils/format.property.test.ts` using fast-check with min 100 iterations per property

  - [x] 2.5 Implement config merging and direction resolver logic
    - Add a `mergeConfig(fetched, defaults)` helper in `src/config/defaults.ts` that merges partial config with defaults ensuring no key is undefined
    - Add a `resolveDirection(lang)` helper in `src/utils/format.ts` that returns `'rtl'` for `["ar", "he", "fa", "ur"]` and `'ltr'` otherwise
    - _Requirements: 2.4, 3.6, 14.2, 14.3_

  - [x]* 2.6 Write property tests for config merging and direction resolver
    - **Property 1: Config merging produces complete configuration**
    - **Property 2: RTL direction determination**
    - **Validates: Requirements 2.4, 2.6, 3.6, 14.2, 14.3**
    - Create `src/__tests__/utils/config.property.test.ts` and `src/__tests__/logic/direction.property.test.ts` using fast-check with min 100 iterations per property

- [x] 3. Checkpoint - Core utilities verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. App shell and entry point
  - [x] 4.1 Create main entry point and app shell
    - Create `src/main.tsx` that mounts React app to `#root` with StrictMode
    - Create `src/App.tsx` implementing the step state machine with states: `landing`, `services`, `schedule`, `review`, `confirmation`
    - App must call `getContext()` on mount, load config with 3-second timeout via `Promise.race`, apply theme via `applyTheme`/`themeFromConfig`, fire `trackView()`, and manage all booking state (selectedServices, selectedStaff, selectedDate, selectedSlot, customerName, customerPhone, customerNotes, submitting, error)
    - Pre-fill customerName and customerPhone from context when available
    - Show skeleton loading state during config fetch (max 3 seconds), then transition to Landing
    - Set `dir` attribute on document root to `rtl` for RTL languages, `ltr` otherwise
    - Set `data-theme="dark"` when `dark_mode` is true in config
    - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.6, 3.7, 10.2, 10.4, 15.1, 15.3_

  - [x] 4.2 Create Header and StepIndicator components
    - Create `src/components/Header.tsx` showing business logo (with first-char fallback) and business name
    - Create `src/components/StepIndicator.tsx` showing 5 step dots with completed/current/upcoming states, hidden on Confirmation
    - Step indicator must use `aria-label` for accessibility
    - _Requirements: 4.1, 4.2, 13.1, 13.5, 16.1_

  - [x] 4.3 Create global styles with CSS variables
    - Create `src/styles.css` using only CSS variables (--qt-primary, --qt-secondary, --qt-text, --qt-bg, --qt-font) for all colors and fonts
    - Implement mobile-first layout: no horizontal overflow 320-480px, max-width 480px centered on wider viewports
    - All interactive elements must have minimum 44x44px tap targets
    - Keyboard focus indicators with 3:1 contrast ratio and 2px thickness
    - Dark mode styles scoped under `[data-theme="dark"]`
    - Use CSS logical properties for RTL support (padding-inline, margin-inline, text-align: start/end)
    - _Requirements: 12.1, 12.2, 12.5, 12.6, 14.2, 15.2, 16.3, 16.5_

- [x] 5. Screen implementations
  - [x] 5.1 Implement LandingScreen component
    - Create `src/components/LandingScreen.tsx` with hero banner (hero_image as background, primary_color fallback), hero_title heading, hero_subtitle text
    - Display primary CTA button with `labels.cta_book_now` (default: "Book Now")
    - Conditionally show review snippet when `show_reviews` is true and reviews array is non-empty (average rating rounded to 1 decimal + count)
    - Use semantic HTML: `<section>`, `<h1>`, `<p>`, `<button>`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 16.1_

  - [x] 5.2 Implement ServiceSelectionScreen component
    - Create `src/components/ServiceSelectionScreen.tsx` with horizontal scrollable category tabs, service cards, and continue button
    - Category tabs: first selected by default, filter services on tap, highlight active tab
    - Service cards: display name (truncated at 60 chars with ellipsis), price (formatted with currency), duration, optional image
    - Selection logic: toggle on tap, multi-select (max 10) when `allow_multiple_services` is true, single-select when false
    - Continue button disabled when no service selected, enabled when ≥1 selected
    - Fire analytics `start` event with service IDs on continue
    - Show empty-state message when category has no services
    - Use `aria-pressed` for selected state on service cards
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 16.1, 16.6_

  - [x]* 5.3 Write property tests for service logic
    - **Property 3: Service filtering by category**
    - **Property 4: Service name truncation**
    - **Property 5: Service selection mode enforcement**
    - **Property 7: Total price computation**
    - **Validates: Requirements 5.2, 5.3, 5.5, 5.6, 8.5**
    - Create `src/__tests__/logic/services.property.test.ts` using fast-check with min 100 iterations per property

  - [x] 5.4 Implement ScheduleScreen component
    - Create `src/components/ScheduleScreen.tsx` with optional staff picker, date picker, and time slot grid
    - Staff picker: show when `show_staff_selection` is true and staff array is non-empty; render cards with avatar (initials fallback), name, role, rating, experience; single-select with deselect toggle; max 20 entries
    - Date picker: horizontal scrollable showing next N days from `booking_settings.advance_booking_days` (default 14), pre-select today, clear slot on date change
    - Time slots: computed via `computeTimeSlots`, rendered as tappable grid buttons, distinct selected style
    - Continue button enabled only when date AND slot are selected
    - Show "no availability" message when no slots available (grid hidden)
    - Use `aria-selected` for staff cards, date buttons, and time slots
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 16.1, 16.6_

  - [x] 5.5 Implement ReviewScreen component
    - Create `src/components/ReviewScreen.tsx` with customer form, booking summary, and confirm button
    - Customer form: name (max 100 chars), phone (max 20 chars) pre-filled from context, notes textarea (max 500 chars, required/optional based on `booking_settings.require_notes`)
    - Booking summary: selected services (name, price, duration), staff name (if selected), date, slot, total price (formatted)
    - Confirm button enabled only when name and phone each have ≥1 non-whitespace character
    - On confirm: disable button, show loading, call `createAppointment` with full payload
    - On failure: re-enable button, hide loading, show inline error with retry button
    - Prevent duplicate submissions while in-flight
    - Fire `track('error', ...)` on API failure
    - Use `<form>`, `<label>`, proper associations for accessibility
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 10.1, 10.3, 16.1, 16.2, 16.7_

  - [x]* 5.6 Write property test for form validation
    - **Property 8: Form validation for booking confirmation**
    - **Validates: Requirements 8.6**
    - Create `src/__tests__/logic/validation.property.test.ts` using fast-check with min 100 iterations

  - [x] 5.7 Implement ConfirmationScreen component
    - Create `src/components/ConfirmationScreen.tsx` with success checkmark, success_message, booking details card, and return-to-chat CTA
    - Display all booking details: services, staff (if applicable), date, slot, total price
    - CTA button with text from `success_cta_text` (default: "Return to chat")
    - Fire analytics `complete` event with service IDs, staff ID, date, slot
    - Handle failure case: show notice message but still display booking details
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 16.1_

- [x] 6. Checkpoint - All screens implemented
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Navigation, analytics, and accessibility wiring
  - [x] 7.1 Wire step navigation and state preservation
    - In `App.tsx`, implement forward/back navigation between all steps
    - Back button on steps 2-4 (Services, Schedule, Review) navigating to previous step
    - Preserve all selections when navigating back (services, staff, date, slot, customer details)
    - Disable forward navigation when required selections are incomplete
    - Hide back button and mark all steps completed on Confirmation
    - Announce step changes via ARIA live region (`aria-live="polite"`)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 16.4_

  - [x] 7.2 Implement analytics event tracking throughout flow
    - Fire `view` event on mount (via `trackView`)
    - Fire `start` event when user selects first service
    - Fire step-level tracking on each navigation (step property: landing, services, schedule, review, confirmation)
    - Fire `complete` event on successful booking (service IDs, staff ID, date, slot)
    - Fire `abandon` event on WebView close before confirmation (using `beforeunload` listener with `lastStep`)
    - Fire `error` event on any API failure (except analytics)
    - Ensure each event fires exactly once per triggering action
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 10.3, 10.5_

  - [x] 7.3 Implement internationalization and label rendering
    - Render all user-facing text from `config.labels` with English defaults
    - Apply RTL direction on document root when lang is ar/he/fa/ur
    - Format currencies with `Intl.NumberFormat` using context lang as locale
    - Format dates with `Intl.DateTimeFormat` using context lang as locale
    - _Requirements: 2.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 8. Testing and verification
  - [x]* 8.1 Write unit tests for screen components
    - Create test files in `src/__tests__/components/` for each screen
    - Test rendering with various config combinations, conditional display (show_reviews, show_staff_selection), error states, and accessibility attributes (semantic elements, ARIA states, labels)
    - Use React Testing Library + Vitest
    - _Requirements: 4.1–4.7, 5.1–5.9, 6.1–6.6, 7.1–7.9, 8.1–8.9, 9.1–9.6, 16.1–16.7_

  - [x]* 8.2 Write integration tests for full booking flow
    - Create `src/__tests__/integration/booking-flow.test.tsx` testing complete navigation Landing → Services → Schedule → Review → Confirmation
    - Test back navigation preserves state, Demo Mode works end-to-end, context pre-fill on Review
    - _Requirements: 10.2, 13.2, 13.3_

  - [ ]* 8.3 Write integration tests for analytics events
    - Create `src/__tests__/integration/analytics.test.tsx` testing all events fire correctly with proper payloads and no duplicates
    - _Requirements: 11.1–11.7_

- [x] 9. Build verification and packaging
  - [x] 9.1 Verify build and bundle size
    - Ensure `tsc --noEmit` completes with zero errors
    - Ensure `vite build` produces `dist/index.html` at the root
    - Verify total gzipped bundle size is below 200 KB (actual: ~72 KB gzipped)
    - Ensure `build-and-zip.ts` produces `releases/salon-booking-template.zip` with `index.html` at archive root
    - _Requirements: 1.4, 1.5, 1.6, 12.4_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The template follows the established `doctor-appointment` pattern for consistency
- All config keys referenced must exist in both `manifest.json` templateConfig schema and `config/defaults.ts`
- fast-check is used for property-based testing with Vitest as the test runner

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.5"] },
    { "id": 3, "tasks": ["2.6", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["5.1", "5.2", "5.4"] },
    { "id": 6, "tasks": ["5.3", "5.5", "5.7"] },
    { "id": 7, "tasks": ["5.6", "7.1"] },
    { "id": 8, "tasks": ["7.2", "7.3"] },
    { "id": 9, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 10, "tasks": ["9.1"] }
  ]
}
```
