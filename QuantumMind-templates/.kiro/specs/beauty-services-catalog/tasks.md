# Implementation Plan: Beauty Services Catalog

## Overview

Implement a 5-step animated stepper form for WhatsApp WebView that provides a category-first beauty service browsing and booking experience. The template uses React + Vite with `@quantum/template-sdk`, CSS slide/fade transitions (transform + opacity), a visible segmented step-indicator progress bar, circular icon grid category browsing, service cards with Add/Remove toggle, persistent Running_Total_Footer, horizontal date picker with 2-column time slot grid, and config-driven Demo Mode. Default palette: Pink #E91E63 / Purple #9C27B0. Bundle must be < 200KB gzipped. TypeScript is the implementation language.

## Tasks

- [x] 1. Set up project structure, types, and config
  - [x] 1.1 Scaffold template directory and build config
    - Create `templates/beauty-services-catalog/` with `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, and `manifest.json`
    - `package.json` mirrors meeting-scheduler dependencies (react, react-dom, @quantum/template-sdk, vitest, fast-check, @testing-library/react, jsdom)
    - `vite.config.ts` uses `createTemplateConfig` from shared tooling with vitest jsdom config
    - `manifest.json` declares name "Beauty Services Catalog", industry "beauty", category "appointment", tags ["beauty", "services", "booking", "catalog"], supportedLanguages ["en"], supportsDarkMode true, estimatedDuration "2 minutes", and templateConfig schema entries for all configurable keys
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 1.2 Define TypeScript types and interfaces
    - Create `src/types.ts` with `BeautyConfig`, `Category`, `Service`, `WorkingHours`, `Labels`, `BookingPayload`, `BeautyStep`, `TransitionDirection`, and `AppState` interfaces
    - Include all types defined in the design document
    - _Requirements: 2.3_

  - [x] 1.3 Create default config and config merging logic
    - Create `src/config/defaults.ts` exporting a complete `BeautyConfig` default object with primary_color "#E91E63", secondary_color "#9C27B0", 6 demo categories (Haircut, Facial, Manicure, Pedicure, Massage, Waxing), 12 demo services, working_hours (Mon-Sat 9:00-18:00), time_slot_interval 30, advance_booking_days 14, currency "USD", and all default labels
    - Implement `mergeConfig(partial: Partial<BeautyConfig>, defaults: BeautyConfig): BeautyConfig` that deep-merges fetched config with defaults ensuring no key is ever undefined
    - _Requirements: 2.2, 2.5, 2.6, 13.1_

  - [ ]* 1.4 Write property test for config merging (Property 1)
    - **Property 1: Config merging produces complete configuration**
    - **Validates: Requirements 2.5, 2.6**
    - Create `src/__tests__/utils/config.property.test.ts`
    - Use fast-check to generate arbitrary partial config objects and verify merged output always has all keys defined (never undefined)

  - [x] 1.5 Create CSS styles with custom properties and animations
    - Create `src/styles.css` using CSS custom properties (--qt-primary, --qt-secondary, --qt-text, --qt-bg, --qt-font) and template-specific tokens (--bsc-step-fill, --bsc-card-shadow, --bsc-transition-duration, --bsc-footer-height)
    - Implement step transition animations (slide-left/slide-right + fade using transform and opacity)
    - Implement step indicator fill animation (scaleX transition ≥300ms)
    - Implement running total pulse animation
    - Implement success checkmark scale-in animation
    - Define dark mode styles via `[data-theme="dark"]` selector
    - Mobile-first layout targeting 375px with max-width 480px centered on larger viewports
    - All interactive elements minimum 44×44px tap area
    - _Requirements: 3.3, 3.4, 3.5, 3.7, 10.2, 11.1, 11.2, 11.3, 11.4, 11.5, 15.1, 15.2, 15.5, 15.6, 15.7, 16.1_

- [x] 2. Implement utility modules
  - [x] 2.1 Implement time slot computation utility
    - Create `src/utils/time-slots.ts` with `computeTimeSlots(date: string, workingHours: WorkingHours, intervalMinutes: number, excludePastSlots: boolean): string[]`
    - Map ISO date to day-of-week, generate slots from open to close at interval, filter past slots when date is today, format as locale-appropriate time
    - Return empty array when working hours are null/undefined for the given day
    - _Requirements: 6.4, 6.5_

  - [ ]* 2.2 Write property test for time slot computation (Property 6)
    - **Property 6: Time slot computation**
    - **Validates: Requirements 6.4, 6.5**
    - Create `src/__tests__/utils/time-slots.property.test.ts`
    - Use fast-check to verify: (a) all slots start >= open time, (b) all slot ends <= close time, (c) slots are sorted ascending with uniform spacing, (d) no past slots for today

  - [x] 2.3 Implement formatting utilities
    - Create `src/utils/format.ts` with `formatCurrency(amount: number, currency: string, locale: string): string` and `formatDate(isoDate: string, locale: string): string`
    - Use `Intl.NumberFormat` with exactly 2 fraction digits for currency
    - Use `Intl.DateTimeFormat` for locale-aware date display
    - _Requirements: 12.4, 12.5_

  - [ ]* 2.4 Write property tests for formatting (Properties 9, 10)
    - **Property 9: Currency formatting produces 2 decimal places**
    - **Property 10: Date formatting produces non-empty locale string**
    - **Validates: Requirements 12.4, 12.5**
    - Create `src/__tests__/utils/format.property.test.ts`
    - Use fast-check to verify currency output always has 2 fractional digits and date output is non-empty and differs from raw ISO input

  - [x] 2.5 Implement service logic utilities
    - Create `src/utils/services.ts` with `filterByCategory(services: Service[], categoryId: string): Service[]`, `truncateName(name: string, maxLength?: number): string`, `computeTotalPrice(services: Service[]): number`, and `isSelectionValid(services: Service[]): boolean`
    - `truncateName` returns original if ≤50 chars, else prefix + "…" (max 53 chars total)
    - `computeTotalPrice` sums prices rounded to 2 decimal places
    - _Requirements: 5.2, 5.3, 5.7, 10.1_

  - [ ]* 2.6 Write property tests for service utilities (Properties 3, 4, 5)
    - **Property 3: Service filtering by category**
    - **Property 4: Service name truncation**
    - **Property 5: Running total invariant**
    - **Validates: Requirements 5.2, 5.3, 5.7, 10.1, 10.3**
    - Create `src/__tests__/utils/services.property.test.ts`
    - Use fast-check to verify filtering correctness, truncation length constraints, and total price invariant

  - [x] 2.7 Implement RTL direction utility
    - Create `src/utils/direction.ts` with `resolveDirection(lang: string): 'rtl' | 'ltr'` and `RTL_LANGUAGES` constant
    - Return "rtl" for "ar", "he", "fa", "ur"; "ltr" for all other values including empty/undefined (defaults to "en")
    - _Requirements: 12.2, 12.3_

  - [ ]* 2.8 Write property test for RTL direction (Property 2)
    - **Property 2: RTL direction determination**
    - **Validates: Requirements 12.2, 12.3**
    - Create `src/__tests__/utils/direction.property.test.ts`
    - Use fast-check to verify direction resolver returns "rtl" iff lang is one of ["ar", "he", "fa", "ur"], "ltr" for all others

- [x] 3. Checkpoint - Utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement shared components
  - [x] 4.1 Implement StepIndicator component
    - Create `src/components/StepIndicator.tsx` rendering a horizontal segmented progress bar fixed at the top of the viewport
    - Display 5 labeled segments (Welcome, Browse Services, Date & Time, Your Details, Confirmation) with visual states: completed (filled + checkmark), active (primary color + glow), upcoming (muted/outlined)
    - Animate fill progression with CSS transition ≥300ms using scaleX
    - Mark all steps completed on Confirmation screen
    - Use `aria-label` for accessibility
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 8.6, 17.7_

  - [x] 4.2 Implement StepTransition wrapper component
    - Create `src/components/StepTransition.tsx` applying CSS slide/fade animations based on `direction` prop
    - Forward: translateX(30%) → translateX(0), opacity 0 → 1, duration 300ms
    - Backward: translateX(-30%) → translateX(0), opacity 0 → 1, duration 300ms
    - Use `will-change: transform, opacity` for GPU acceleration
    - Re-trigger animation on `stepKey` change
    - _Requirements: 3.4, 3.5, 3.7, 11.5_

  - [x] 4.3 Implement CategoryIconGrid component
    - Create `src/components/CategoryIconGrid.tsx` rendering categories as circular icons in a CSS grid (3 columns)
    - Each icon: min 56px diameter circle with category image/emoji and name label below
    - Selected state: primary color border ring + scale(1.05) effect
    - Limit rendered items to `maxVisible` prop (default 6)
    - No placeholders when fewer than maxVisible categories exist
    - Include `aria-label` for grid and `aria-pressed`/`aria-selected` for items
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 11.2, 11.7, 17.5, 17.7_

  - [ ]* 4.4 Write property test for category grid count (Property 11)
    - **Property 11: Category grid count constraint**
    - **Validates: Requirements 4.3, 4.4, 4.5**
    - Create `src/__tests__/logic/category-grid.property.test.ts`
    - Use fast-check to verify rendered count is min(array.length, maxVisible) with no placeholders

  - [x] 4.5 Implement ServiceCard component
    - Create `src/components/ServiceCard.tsx` displaying service name (truncated at 50 chars), duration, formatted price, and Add/Remove toggle button
    - Add state: primary color button; Remove state: secondary/danger color button
    - Use `aria-pressed` to convey selection state
    - Min 44×44px tap targets
    - _Requirements: 5.3, 5.4, 5.5, 11.3, 15.2, 17.5_

  - [x] 4.6 Implement RunningTotalFooter component
    - Create `src/components/RunningTotalFooter.tsx` as a fixed-bottom footer showing "{count} services · {formattedTotal}" and a Continue button
    - Continue button disabled when count === 0
    - Number-change animation (scale pulse) on update within 100ms
    - Footer does not obscure last service card (adequate scroll padding)
    - _Requirements: 5.7, 5.8, 5.9, 10.1, 10.2, 10.3, 10.4, 10.5, 11.4_

  - [x] 4.7 Implement DatePicker component
    - Create `src/components/DatePicker.tsx` as a horizontal scrollable row of date pills
    - Each pill shows day abbreviation + date number
    - Pre-selects today and auto-scrolls into view on mount
    - Selected state: primary color background with contrasting text
    - Show N days from config `advance_booking_days`
    - Hidden scrollbar with overflow-x: auto
    - _Requirements: 6.1, 6.2, 6.3, 17.5_

  - [x] 4.8 Implement TimeSlotGrid component
    - Create `src/components/TimeSlotGrid.tsx` as a 2-column CSS grid of tappable time slot buttons
    - Selected state: primary color background with contrasting text
    - Empty state: "No availability" message when slots array is empty
    - Use `aria-selected` for slot selection state
    - _Requirements: 6.6, 6.7, 6.8, 11.6, 17.5, 17.7_

- [x] 5. Implement screen components
  - [x] 5.1 Implement WelcomeScreen (Step 1)
    - Create `src/components/WelcomeScreen.tsx` with hero banner (hero_image or gradient fallback), business logo (with first-char fallback), CategoryIconGrid preview (max 6), and "Start Booking" CTA button
    - Fire `trackView` analytics event on render
    - Use semantic HTML (header, section, button)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 11.7, 14.1, 17.1_

  - [x] 5.2 Implement BrowseServicesScreen (Step 2)
    - Create `src/components/BrowseServicesScreen.tsx` composing CategoryIconGrid (with first category pre-selected), filtered ServiceCards, and RunningTotalFooter
    - Category selection filters service cards; switching categories preserves selections from other categories
    - Empty state message when selected category has no services
    - Fire `start` analytics event on continue with selected service IDs
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 10.1, 10.2, 10.3, 10.4, 10.5, 14.2_

  - [ ]* 5.3 Write property test for cross-category selection persistence (Property 12)
    - **Property 12: Cross-category selection persistence**
    - **Validates: Requirements 5.6**
    - Create `src/__tests__/logic/selection.property.test.ts`
    - Use fast-check to verify selection set only changes on explicit add/remove, not on category switch

  - [x] 5.4 Implement DateTimeScreen (Step 3)
    - Create `src/components/DateTimeScreen.tsx` composing DatePicker and TimeSlotGrid
    - Recompute time slots on date change; clear selected slot on date change
    - Exclude past slots when selected date is today
    - Display "no availability" when day is closed or all slots passed
    - Continue button enabled only when date + slot selected
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [x] 5.5 Implement YourDetailsScreen (Step 4)
    - Create `src/components/YourDetailsScreen.tsx` with form fields (name max 100 chars, phone max 20 chars, notes optional max 500 chars), booking summary card, and confirm button
    - Pre-fill name/phone from SDK context (remain editable)
    - Confirm button enabled only when name and phone have ≥1 non-whitespace char
    - On confirm: disable button, show loading state, call `createAppointment`
    - On success: navigate to Confirmation; On failure: re-enable button, show inline error, preserve data
    - Prevent duplicate submissions via `submitting` guard
    - Associate all inputs with labels
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 17.1, 17.2_

  - [ ]* 5.6 Write property test for form validation (Property 8)
    - **Property 8: Form validation for booking confirmation**
    - **Validates: Requirements 7.6**
    - Create `src/__tests__/logic/validation.property.test.ts`
    - Use fast-check to verify confirm button enabled iff both name and phone contain ≥1 non-whitespace character

  - [x] 5.7 Implement ConfirmationScreen (Step 5)
    - Create `src/components/ConfirmationScreen.tsx` with animated success checkmark (scale-in CSS animation), success message, booking summary (services, date, time, total), and "Return to Chat" CTA
    - Fire `complete` analytics event with service IDs, date, and time slot
    - Step indicator shows all steps completed
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 14.5_

  - [ ]* 5.8 Write property test for step forward navigation guard (Property 7)
    - **Property 7: Step forward navigation guard**
    - **Validates: Requirements 5.8, 5.9, 6.9, 7.6, 9.3**
    - Create `src/__tests__/logic/navigation.property.test.ts`
    - Use fast-check to verify forward navigation enabled iff step-specific conditions are met

- [x] 6. Checkpoint - All screens implemented
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement App shell, SDK integration, and wiring
  - [x] 7.1 Implement main entry point with SDK initialization
    - Create `src/main.tsx` mounting the React app, calling `getContext`, `loadConfig` (wrapped with 3s timeout via Promise.race), `applyTheme` (with darkMode flag), `resolveDirection` for RTL, and `trackView`
    - Show skeleton loading state for at most 3 seconds before transitioning to Welcome
    - On config fetch failure: use Demo Mode defaults
    - On context parse failure: default lang "en", empty name/phone, LTR direction
    - Set `data-theme="dark"` when dark_mode is true; fall back to light mode on applyTheme failure
    - _Requirements: 2.1, 2.2, 2.4, 12.1, 12.2, 12.3, 13.1, 13.4, 16.1, 16.2, 16.3, 16.4_

  - [x] 7.2 Implement App.tsx root component with step state machine and transitions
    - Create `src/App.tsx` managing `BeautyStep` state, `TransitionDirection`, and all selection state (selectedServices, selectedCategory, selectedDate, selectedSlot, customerName, customerPhone, customerNotes, submitting, error)
    - Render StepIndicator + StepTransition wrapper + active screen based on step
    - Handle forward/backward navigation with state preservation
    - Back button on steps 2-4 (hidden on Welcome and Confirmation)
    - Prevent forward navigation when step conditions unmet
    - Fire step-level analytics tracking on each navigation
    - Announce step changes via ARIA live region (`aria-live="polite"`)
    - Fire `abandon` analytics event on beforeunload/visibility change with lastStep
    - Fire `error` analytics event on booking failure
    - Silently discard analytics failures without affecting UI
    - _Requirements: 3.4, 3.5, 9.1, 9.2, 9.3, 9.4, 9.5, 13.2, 13.3, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 17.1, 17.3, 17.4, 17.6_

- [x] 8. Checkpoint - Full flow wired
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Integration, dark mode, and final validation
  - [x] 9.1 Implement dark mode support and theme fallback
    - Apply `data-theme="dark"` on root element when config `dark_mode` is true
    - Call `applyTheme` with darkMode flag; fall back to light mode if it throws
    - Verify text contrast meets WCAG AA (4.5:1) in dark mode
    - Remove `data-theme` attribute when dark_mode is false/absent
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [ ]* 9.2 Write unit tests for screen components
    - Create `src/__tests__/components/` with tests for WelcomeScreen, BrowseServicesScreen, DateTimeScreen, YourDetailsScreen, ConfirmationScreen, StepIndicator, StepTransition
    - Test rendering variations, accessibility attributes, analytics events, error states
    - _Requirements: 4.1, 5.1, 6.1, 7.1, 8.1, 17.1, 17.2_

  - [ ]* 9.3 Write integration tests for booking flow
    - Create `src/__tests__/integration/booking-flow.test.tsx` testing full 5-step navigation
    - Test back navigation preserves all selections, Demo Mode full flow, context pre-fill, analytics event sequence, step transition direction classes
    - _Requirements: 9.1, 9.2, 9.3, 13.1, 14.1, 14.2, 14.3, 14.4_

  - [x] 9.4 Verify bundle size and build output
    - Run `tsc --noEmit` and `vite build`; confirm dist/index.html exists at root
    - Verify gzipped bundle total < 200 KB
    - Ensure template is packageable via build-and-zip tooling into `releases/beauty-services-catalog.zip`
    - _Requirements: 1.4, 1.5, 1.6, 15.4_

- [x] 10. Final checkpoint - All tests pass and build verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 12 universal correctness properties defined in the design
- Unit tests validate specific examples, edge cases, and component rendering
- The template follows the same monorepo patterns as meeting-scheduler and salon-booking-template (vitest, fast-check, @testing-library/react, jsdom environment)
- TypeScript is the implementation language (React + Vite with .tsx components)
- Default color palette: Pink #E91E63 / Purple #9C27B0
- All CSS animations use only `transform` and `opacity` for GPU-accelerated 60fps rendering

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.5"] },
    { "id": 2, "tasks": ["1.3", "2.1", "2.3", "2.5", "2.7"] },
    { "id": 3, "tasks": ["1.4", "2.2", "2.4", "2.6", "2.8"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3", "4.5", "4.6", "4.7", "4.8"] },
    { "id": 5, "tasks": ["4.4", "5.1", "5.2", "5.4", "5.5", "5.7"] },
    { "id": 6, "tasks": ["5.3", "5.6", "5.8"] },
    { "id": 7, "tasks": ["7.1", "7.2"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.2", "9.3"] },
    { "id": 10, "tasks": ["9.4"] }
  ]
}
```
