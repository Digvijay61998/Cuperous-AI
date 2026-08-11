# Implementation Plan: Meeting Scheduler Template

## Overview

Implement a Calendly-style two-step meeting booking WebView template (Calendar Screen → Confirmation Screen) with a responsive two-panel layout. The template uses React + Vite with `@quantum/template-sdk`, client-side time slot generation, timezone detection via Intl API, and inline success + auto-close behavior. Follows established monorepo conventions from salon-booking-template and doctor-appointment.

## Tasks

- [x] 1. Set up project structure, config, and types
  - [x] 1.1 Scaffold template directory and build config
    - Create `templates/meeting-scheduler/` with `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, and `manifest.json`
    - `package.json` mirrors salon-booking-template dependencies (react, react-dom, @quantum/template-sdk, vitest, fast-check, @testing-library/react, jsdom)
    - `vite.config.ts` uses `createTemplateConfig` from shared tooling with vitest jsdom config
    - `manifest.json` declares name, description, industry "general", category "scheduling", tags, supportedLanguages, supportsDarkMode, estimatedDuration, and templateConfig schema entries
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Define TypeScript types and interfaces
    - Create `src/types.ts` with `MeetingConfig`, `MeetingLabels`, `WorkingHours`, `DayHours`, `MeetingBookingPayload`, `SchedulerStep`, `InternalStep`, and `AppState` interfaces
    - _Requirements: 2.3, 2.4_

  - [x] 1.3 Create default config and demo mode values
    - Create `src/config/defaults.ts` exporting a complete `MeetingConfig` default object with primary_color "#0060E6", font_family "Inter", slot_duration 30, advance_booking_days 30, auto_close_delay 3, working_hours (Mon-Fri 9:00-17:00), and all default labels
    - Implement `mergeConfig(partial: Partial<MeetingConfig>, defaults: MeetingConfig): MeetingConfig` function
    - _Requirements: 2.2, 2.4, 2.6, 10.2_

  - [ ]* 1.4 Write property test for config merging (Property 1)
    - **Property 1: Config merging produces complete configuration**
    - **Validates: Requirements 2.4, 2.6**
    - Create `src/__tests__/utils/config.property.test.ts`
    - Use fast-check to generate arbitrary partial config objects and verify merged output always has all keys defined (never undefined)

  - [x] 1.5 Create styles.css with CSS variables and responsive layout
    - Create `src/styles.css` using CSS custom properties (--qt-primary, --qt-text, --qt-bg, --qt-font)
    - Define two-panel desktop layout (Info ~1/3, Interactive ~2/3), single-column mobile layout below 768px
    - Style pill buttons, calendar grid cells, form inputs with 44x44px min tap targets
    - Include dark mode styles via `[data-theme="dark"]` selector
    - Load Inter font from Google Fonts link in index.html
    - _Requirements: 1.7, 12.1, 12.2, 12.3, 12.4, 12.6, 15.1, 15.2, 15.3_

- [x] 2. Implement utility modules
  - [x] 2.1 Implement calendar utilities
    - Create `src/utils/calendar.ts` with `isDateSelectable(date, today, advanceBookingDays): boolean` and `generateMonthGrid(year, month): (string | null)[][]`
    - `isDateSelectable` returns true iff date >= today AND date <= today + advanceBookingDays
    - `generateMonthGrid` returns a 2D array with ISO date strings and null padding cells for the 7-column grid
    - _Requirements: 5.1, 5.5, 5.7_

  - [ ]* 2.2 Write property test for date selectability (Property 2)
    - **Property 2: Date selectability determination**
    - **Validates: Requirements 5.5, 5.7**
    - Create `src/__tests__/utils/calendar.property.test.ts`
    - Use fast-check to generate date/today/advanceBookingDays combinations and verify the boolean result matches the formal definition

  - [x] 2.3 Implement timezone utilities
    - Create `src/utils/timezone.ts` with `detectTimezone(): string`, `formatTimezone(tz): string`, `getTimezoneList(): string[]`, and `getUtcOffset(tz, date?): string`
    - `detectTimezone` uses `Intl.DateTimeFormat().resolvedOptions().timeZone` with "UTC" fallback
    - `formatTimezone` produces "Area/City (UTC±HH:MM)" format
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ]* 2.4 Write property test for timezone formatting (Property 3)
    - **Property 3: Timezone display formatting**
    - **Validates: Requirements 6.2**
    - Create `src/__tests__/utils/timezone.property.test.ts`
    - Use fast-check to verify formatTimezone output always contains the original identifier and a parenthesized UTC offset

  - [x] 2.5 Implement time slot computation
    - Create `src/utils/time-slots.ts` with `computeTimeSlots(date, workingHours, slotDuration, timezone, now?): string[]`
    - Maps ISO date to day-of-week, generates slots from open to close at slotDuration intervals, filters past slots for today, formats as 12-hour AM/PM
    - _Requirements: 7.1, 7.3_

  - [ ]* 2.6 Write property test for time slot computation (Property 4)
    - **Property 4: Time slot computation**
    - **Validates: Requirements 7.1, 7.3**
    - Create `src/__tests__/utils/time-slots.property.test.ts`
    - Use fast-check to verify: (a) all slots start >= open, (b) all slots end <= close, (c) consecutive slots separated by exactly slotDuration, (d) no past slots included for today

  - [x] 2.7 Implement validation utilities
    - Create `src/utils/validation.ts` with `isFormValid(name, email): boolean` and `isValidEmail(email): boolean`
    - `isFormValid` returns true iff name has ≥1 non-whitespace char AND email has @ with chars before and after
    - _Requirements: 8.7_

  - [ ]* 2.8 Write property test for form validation (Property 5)
    - **Property 5: Confirmation form validation**
    - **Validates: Requirements 8.7**
    - Create `src/__tests__/utils/validation.property.test.ts`
    - Use fast-check to generate arbitrary name/email strings and verify isFormValid matches the formal definition

  - [x] 2.9 Implement date formatting utility
    - Create `src/utils/format.ts` with `formatDateLong(isoDate, locale?): string`
    - Uses `Intl.DateTimeFormat` to produce "Wednesday, January 15, 2025" format
    - _Requirements: 8.3_

- [x] 3. Checkpoint - Utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Info Panel and App shell
  - [x] 4.1 Implement main entry point and SDK initialization
    - Create `src/main.tsx` mounting the React app, calling `getContext`, `loadConfig` (with 3s timeout via Promise.race), `applyTheme`, and `trackView`
    - Wrap config fetch with timeout + Demo Mode fallback
    - Show skeleton loading state during config fetch
    - _Requirements: 2.1, 2.2, 2.5, 3.1, 10.2, 10.4, 11.1_

  - [x] 4.2 Implement App.tsx root component with step state machine
    - Create `src/App.tsx` managing `InternalStep` state, storing selectedDate/selectedSlot/selectedTimezone/form fields
    - Render InfoPanel + CalendarScreen or ConfirmationScreen based on step
    - Handle step transitions, back navigation with state preservation, and createAppointment submission
    - Fire analytics events (start, step, complete, abandon, error) at appropriate transitions
    - Announce screen changes via ARIA live region
    - _Requirements: 8.1, 8.8, 8.9, 9.1, 9.2, 9.3, 9.6, 10.1, 10.3, 11.2, 11.3, 11.4, 11.5, 11.6, 13.1, 13.2, 13.3, 13.4, 14.7_

  - [x] 4.3 Implement InfoPanel component
    - Create `src/components/InfoPanel.tsx` rendering logo (with first-char fallback), meeting title, subtitle, duration badge, and description
    - Desktop: fixed-width left column; Mobile: compact header bar hiding description
    - Use semantic HTML elements (header, heading)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 14.1_

- [x] 5. Implement Calendar Screen components
  - [x] 5.1 Implement MonthGrid component
    - Create `src/components/MonthGrid.tsx` rendering 7-column grid with SUN-SAT headers, week rows, and date cells
    - Cells show disabled/today/selected/default states; min 44x44px tap targets
    - Uses `generateMonthGrid` and `isDateSelectable`; fires `onDateSelect` callback
    - Implements keyboard navigation and `aria-selected` for selected date
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 12.4, 14.3, 14.4, 14.5_

  - [x] 5.2 Implement month navigation controls
    - Add prev/next arrow buttons above the month grid within CalendarScreen
    - Display current month/year heading; prevent navigation to months entirely outside bookable range
    - _Requirements: 5.2, 5.3, 5.7_

  - [x] 5.3 Implement TimeSlotList component
    - Create `src/components/TimeSlotList.tsx` rendering a vertical scrollable list of pill buttons
    - Selected pill: Primary_Color fill + white text; Unselected: border-only + Primary_Color text
    - Display "no availability" message when slots array is empty
    - Keyboard navigable with aria-selected
    - _Requirements: 7.2, 7.4, 7.5, 7.6, 14.4, 14.5_

  - [x] 5.4 Implement TimezoneSelector component
    - Create `src/components/TimezoneSelector.tsx` with searchable dropdown
    - Displays current timezone as "Area/City (UTC±HH:MM)"
    - On selection change, triggers recalculation and clears selected slot
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.5 Implement CalendarScreen component
    - Create `src/components/CalendarScreen.tsx` composing MonthGrid, TimezoneSelector, and TimeSlotList
    - Manages displayedMonth/year state for navigation
    - Shows "Next" button enabled only when date + slot selected
    - Clears selected slot on date change or timezone change
    - _Requirements: 5.6, 6.4, 7.7, 13.4_

- [x] 6. Implement Confirmation Screen components
  - [x] 6.1 Implement SummaryCard component
    - Create `src/components/SummaryCard.tsx` displaying formatted date, time slot, and timezone with Primary_Color background
    - Uses `formatDateLong` for date display
    - _Requirements: 8.3_

  - [x] 6.2 Implement BookingForm component
    - Create `src/components/BookingForm.tsx` with Name (required), Email (required), Phone (optional based on config) fields
    - Confirm button enabled only when isFormValid returns true
    - Shows loading state and disables button during submission
    - Displays inline error on failure, preserves form data
    - Associates all inputs with labels; uses disabled attribute for submit button
    - _Requirements: 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 9.6, 14.2, 14.8_

  - [x] 6.3 Implement SuccessBanner component
    - Create `src/components/SuccessBanner.tsx` displaying success message
    - Triggers auto-close after configurable delay via postMessage or platform close mechanism
    - Shows manual close instruction if auto-close unavailable
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 6.4 Implement ConfirmationScreen component
    - Create `src/components/ConfirmationScreen.tsx` composing back button, heading, SummaryCard, BookingForm, and SuccessBanner
    - Pre-fills name/phone from context
    - Toggles between form view and success view
    - Hides form and shows only summary + banner on success
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 9.2, 13.1_

- [x] 7. Checkpoint - All components wired
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration, dark mode, and final validation
  - [x] 8.1 Implement dark mode support
    - Apply `data-theme="dark"` on root when config `dark_mode` is true
    - Call `applyTheme` with darkMode flag; fall back to light mode if applyTheme throws
    - Ensure contrast ratios meet WCAG AA in both modes
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 8.2 Implement abandon tracking and context pre-fill edge cases
    - Fire `abandon` analytics event on WebView close (beforeunload or visibility change) with lastStep
    - Handle context parse failure gracefully (default lang "en", empty name/phone)
    - _Requirements: 3.6, 11.5_

  - [ ]* 8.3 Write unit tests for components
    - Create `src/__tests__/components/` with tests for InfoPanel, MonthGrid, TimeSlotList, TimezoneSelector, BookingForm, SuccessBanner
    - Test rendering, conditional display (show_phone_field), mobile vs desktop, error states, accessibility attributes
    - _Requirements: 4.1, 4.6, 7.6, 8.5, 8.6, 14.2, 14.5_

  - [ ]* 8.4 Write integration tests for booking flow
    - Create `src/__tests__/integration/booking-flow.test.tsx` testing full Calendar → Confirmation → Success flow
    - Test back navigation preserves selections, Demo Mode full flow, context pre-fill, auto-close timer
    - _Requirements: 9.3, 13.1, 13.2, 13.3_

  - [x] 8.5 Verify bundle size and build output
    - Run `tsc --noEmit` and `vite build`; confirm dist/index.html exists at root
    - Verify gzipped bundle total < 200 KB
    - Ensure template is packageable via build-and-zip tooling
    - _Requirements: 1.4, 1.5, 1.6_

- [x] 9. Final checkpoint - All tests pass and build verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 5 universal correctness properties defined in the design
- Unit tests validate specific examples, edge cases, and component rendering
- The template follows the same monorepo patterns as salon-booking-template (vitest, fast-check, @testing-library/react, jsdom environment)
- TypeScript is the implementation language (React + Vite with .tsx components)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.5"] },
    { "id": 2, "tasks": ["1.3", "2.1", "2.3", "2.5", "2.7", "2.9"] },
    { "id": 3, "tasks": ["1.4", "2.2", "2.4", "2.6", "2.8"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3"] },
    { "id": 6, "tasks": ["5.1", "5.3", "5.4"] },
    { "id": 7, "tasks": ["5.2", "5.5"] },
    { "id": 8, "tasks": ["6.1", "6.2", "6.3"] },
    { "id": 9, "tasks": ["6.4"] },
    { "id": 10, "tasks": ["8.1", "8.2"] },
    { "id": 11, "tasks": ["8.3", "8.4"] },
    { "id": 12, "tasks": ["8.5"] }
  ]
}
```
