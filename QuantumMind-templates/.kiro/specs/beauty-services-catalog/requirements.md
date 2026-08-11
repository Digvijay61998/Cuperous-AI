# Requirements Document

## Introduction

The Beauty Services Catalog is a modern, animated 5-step stepper form designed for WhatsApp WebView. Inspired by the Figma Beauty Services Appointment App, it delivers a visually distinctive booking experience compared to the existing salon-booking-template. The flow centers on a category-first browsing model with circular icon grids, card-based service selection, a persistent running total footer, and CSS slide/fade step transitions — all within a visible step-indicator progress bar. The template is 100% JSON-configurable via @quantum/template-sdk, mobile-first (optimized for 375px), and must ship under 200KB gzipped.

The 5 steps are: Welcome → Browse Services → Date & Time → Your Details → Confirmation.

## Glossary

- **Template**: A self-contained React + Vite WebView application within the QuantumMind Templates monorepo that is built, zipped, and uploaded for hosting
- **Template_SDK**: The shared package (`@quantum/template-sdk`) providing context reading, config fetching, theme application, analytics tracking, and backend actions
- **Config**: A JSON object fetched at runtime from `GET /template/:id/config` containing all admin-editable values (labels, colors, images, services, categories, working hours, etc.)
- **Manifest**: A `manifest.json` file declaring template metadata and the `templateConfig` schema array (key, type, label, defaultValue, group)
- **Context**: Runtime parameters passed via URL query string (vid, ph, name, bid, cid, src, tid, lead, lang) identifying the visitor, bot, and conversation
- **Stepper**: The 5-step animated form flow: Welcome → Browse_Services → Date_Time → Your_Details → Confirmation
- **Step_Indicator**: A horizontal progress bar at the top of the viewport showing all 5 steps with visual states (completed, active, upcoming), always visible during the flow
- **Welcome_Screen**: Step 1 — brand hero banner, circular service category icon grid, and a "Start Booking" CTA
- **Browse_Services_Screen**: Step 2 — category-first browsing with circular icon grid for category selection, service cards with Add/Remove actions, and a persistent running total footer
- **Date_Time_Screen**: Step 3 — horizontal scrollable date picker and 2-column time slot grid
- **Your_Details_Screen**: Step 4 — customer details form with pre-filled name/phone from context and optional notes
- **Confirmation_Screen**: Step 5 — success indicator, booking summary, and return-to-chat CTA
- **Category_Icon_Grid**: A grid of circular icons (2 rows × 3 columns layout) representing beauty service categories (e.g., Haircut, Facial, Manicure)
- **Service_Card**: A rectangular card component displaying service name, duration, price, and an Add/Remove toggle button
- **Running_Total_Footer**: A persistent footer bar visible during Browse_Services_Screen showing the cumulative price of all selected services and the count of selected items
- **Step_Transition**: A CSS animation (slide and/or fade) applied when navigating between steps, creating smooth visual movement
- **WebView**: The in-app browser frame within WhatsApp where the template renders
- **CTA**: Call-to-action button
- **RTL**: Right-to-left text direction for languages such as Arabic and Hebrew
- **Demo_Mode**: A fallback operational state where the template renders with default config and simulates successful booking when the backend is unreachable

## Requirements

### Requirement 1: Template Scaffolding and Monorepo Integration

**User Story:** As a template developer, I want the beauty-services-catalog to follow established monorepo conventions, so that it integrates with the existing build pipeline and admin tooling.

#### Acceptance Criteria

1. THE Template SHALL reside in the `templates/beauty-services-catalog/` directory and include a root `index.html` entry point, a `manifest.json`, a `package.json`, a `vite.config.ts` using the shared `createTemplateConfig`, and a `tsconfig.json`
2. THE Manifest SHALL declare name as "Beauty Services Catalog", industry as "beauty", category as "appointment", tags including at least "beauty", "services", "booking", and "catalog", supportedLanguages with at least "en", supportsDarkMode as true, estimatedDuration as "2 minutes", and a templateConfig array containing at least 1 entry where each entry defines key, type, label, defaultValue, and group
3. THE Template SHALL declare `@quantum/template-sdk` as a workspace dependency and import context, config, theme, analytics, and actions modules from the SDK
4. THE Template SHALL be buildable via the shared Vite config producing a `dist/` folder with `index.html` at the root, and TypeScript compilation SHALL complete with zero errors
5. THE Template SHALL produce a production bundle where the sum of all files in `dist/` is below 200 KB when gzip-compressed
6. THE Template SHALL be packageable via the existing `build-and-zip.ts` tooling into a single ZIP file under `releases/beauty-services-catalog.zip` with `index.html` located at the archive root

---

### Requirement 2: JSON Configuration and Theming

**User Story:** As an admin, I want to configure the template entirely through JSON without code changes, so that the same template serves different beauty businesses.

#### Acceptance Criteria

1. WHEN the Template loads, THE Config_Loader SHALL call `loadConfig` from Template_SDK to fetch admin-editable configuration values and SHALL complete the config fetch within 3 seconds of page load
2. IF the config fetch fails or exceeds the 3-second timeout, THEN THE Config_Loader SHALL fall back to default configuration values defined in the template source and render the template using those defaults without displaying an error to the end user
3. THE Manifest SHALL expose a templateConfig schema covering at minimum: business_name, business_logo, hero_image, hero_title, hero_subtitle, primary_color, secondary_color, accent_color, text_color, background_color, font_family, dark_mode, categories (JSON array with id, name, icon, color), services (JSON array with id, categoryId, name, duration, price, image, description), working_hours, time_slot_interval, advance_booking_days, currency, success_message, success_cta_text, and labels
4. WHEN config values are loaded, THE Template SHALL apply theme tokens (primaryColor, secondaryColor, textColor, backgroundColor, fontFamily, darkMode) via the SDK `applyTheme` function as CSS custom properties on the document root element
5. WHEN config values contain only a subset of configurable keys, THE Config_Loader SHALL merge fetched values with template-defined defaults so that every key resolves to either the fetched value or its default
6. THE Template SHALL render all user-facing static text from the `labels` config object, and IF a label key is missing, THEN THE Template SHALL display the corresponding English default value defined in the template source

---

### Requirement 3: Animated Stepper and Step Indicator

**User Story:** As a user, I want to see a modern animated progress indicator and smooth transitions between steps, so that I always know where I am in the booking flow.

#### Acceptance Criteria

1. THE Step_Indicator SHALL render as a horizontal progress bar at the top of the viewport, displaying 5 labeled step segments corresponding to Welcome, Browse Services, Date & Time, Your Details, and Confirmation
2. THE Step_Indicator SHALL visually distinguish each step using three states: completed (filled/checked), active (highlighted with primary color and a scale or glow effect), and upcoming (muted/outlined)
3. WHILE a step transition occurs, THE Step_Indicator SHALL animate the progression fill from the previous step to the current step using a CSS transition of at least 300ms duration
4. WHEN the user navigates forward to a new step, THE Stepper SHALL apply a slide-left combined with fade-in CSS transition to the incoming screen content, with a duration between 250ms and 400ms
5. WHEN the user navigates backward to a previous step, THE Stepper SHALL apply a slide-right combined with fade-in CSS transition to the incoming screen content, with a duration between 250ms and 400ms
6. THE Step_Indicator SHALL remain fixed at the top of the viewport and SHALL remain visible on all steps including the Confirmation_Screen
7. THE Stepper SHALL use CSS transforms and opacity for all animations to ensure GPU-accelerated rendering without layout thrashing

---

### Requirement 4: Welcome Screen (Step 1)

**User Story:** As a user, I want to see an appealing branded welcome page with service category icons, so that I get an overview of available beauty services before starting.

#### Acceptance Criteria

1. THE Welcome_Screen SHALL display a hero banner section with the configured `hero_image` as background, `hero_title` as the primary heading, and `hero_subtitle` as descriptive text; IF `hero_image` is empty, THEN THE Welcome_Screen SHALL display the hero section with a gradient background using primary and secondary colors
2. THE Welcome_Screen SHALL display the business logo (from config `business_logo`) and business name in a header area; IF `business_logo` is empty, THEN THE Welcome_Screen SHALL display a circular fallback element showing the first character of `business_name`
3. THE Welcome_Screen SHALL render a Category_Icon_Grid below the hero banner, displaying categories from the config `categories` array as circular icon elements arranged in a grid layout of 2 rows by 3 columns (maximum 6 visible categories)
4. WHEN the `categories` array contains more than 6 entries, THE Welcome_Screen SHALL display only the first 6 categories in the grid
5. WHEN the `categories` array contains fewer than 6 entries, THE Welcome_Screen SHALL render only the available categories without placeholder elements, adjusting the grid to fit
6. THE Welcome_Screen SHALL display each category icon as a circular element (minimum 56px diameter) showing the category icon image and category name label beneath the circle
7. THE Welcome_Screen SHALL display a primary CTA button with text from config `labels.start_booking` (default: "Start Booking") that navigates the user to the Browse_Services_Screen
8. WHEN the Welcome_Screen renders, THE Template SHALL fire an analytics `view` event via Template_SDK `trackView`

---

### Requirement 5: Browse Services Screen (Step 2)

**User Story:** As a user, I want to browse beauty services by selecting a category first and then picking individual services from cards, so that I can easily find and add what I need.

#### Acceptance Criteria

1. THE Browse_Services_Screen SHALL display a Category_Icon_Grid at the top of the screen, rendering all categories from config as circular icon elements (same style as Welcome_Screen) with the first category pre-selected on initial entry
2. WHEN a user taps a category icon, THE Browse_Services_Screen SHALL visually highlight the selected category (border ring or scale-up effect using primary color), deselect any previously selected category, and filter the displayed service cards to show only services matching the selected category's `id`
3. THE Browse_Services_Screen SHALL render each matching service as a Service_Card displaying: service name (truncated with ellipsis beyond 50 characters), duration in minutes, price formatted with the config `currency` symbol, and an Add button
4. WHEN a user taps the Add button on a Service_Card, THE Browse_Services_Screen SHALL add that service to the selection, change the button to a Remove state (visually distinct with a secondary or danger color), and update the Running_Total_Footer
5. WHEN a user taps the Remove button on a selected Service_Card, THE Browse_Services_Screen SHALL remove that service from the selection, revert the button to the Add state, and update the Running_Total_Footer
6. THE Browse_Services_Screen SHALL allow the user to select services from multiple categories; WHEN the user switches categories, previously selected services from other categories SHALL remain in the selection and reflected in the Running_Total_Footer
7. THE Running_Total_Footer SHALL be persistently visible at the bottom of the Browse_Services_Screen, displaying the total count of selected services and the cumulative price formatted with the config `currency` symbol
8. WHEN no services are selected, THE Running_Total_Footer SHALL display "0 services selected" and a total of zero, and the continue action within the footer SHALL be disabled
9. WHEN at least one service is selected, THE Running_Total_Footer SHALL enable the continue action (button) that navigates to the Date_Time_Screen
10. WHEN the user taps continue, THE Template SHALL fire an analytics `start` event with the selected service IDs
11. IF a selected category contains no services, THEN THE Browse_Services_Screen SHALL display an empty-state message indicating no services are available in that category

---

### Requirement 6: Date & Time Screen (Step 3)

**User Story:** As a user, I want to pick a date from a horizontal scroller and a time slot from a 2-column grid, so that I can choose a convenient appointment time.

#### Acceptance Criteria

1. THE Date_Time_Screen SHALL display a horizontal scrollable date picker showing the next N days, where N is derived from config `advance_booking_days` (default: 14), with each date element displaying the day name abbreviation and date number
2. WHEN the Date_Time_Screen renders, THE Date_Picker SHALL pre-select the current date as the default and scroll it into visible view
3. WHEN a user taps a date element, THE Date_Time_Screen SHALL update the selected date with a visual highlight (primary color background), clear any previously selected time slot, and re-render available time slots for the newly selected date
4. THE Date_Time_Screen SHALL compute available time slots for the selected date based on config `working_hours` for that day of the week and config `time_slot_interval` (default: 30 minutes)
5. WHEN the selected date is the current day, THE Date_Time_Screen SHALL exclude time slots whose start time has already passed relative to the user's current local time
6. THE Date_Time_Screen SHALL render available time slots as a 2-column grid of tappable buttons, with each button displaying the time in locale-appropriate format
7. WHEN a user taps a time slot button, THE Date_Time_Screen SHALL select that slot and apply a distinct selected style (primary color background with contrasting text) to the tapped button while deselecting any previously selected slot
8. WHILE the selected date falls on a day where config `working_hours` defines no open/close times, or all computed slots are excluded, THE Date_Time_Screen SHALL display a message indicating no availability and SHALL hide the time slot grid
9. THE Date_Time_Screen SHALL display a continue button that is enabled only when both a date and a time slot are selected
10. IF no time slots are available for any selectable date, THEN THE Date_Time_Screen SHALL disable the continue button and display guidance text asking the user to select a different date

---

### Requirement 7: Your Details Screen (Step 4)

**User Story:** As a user, I want to provide my contact details quickly with pre-filled fields from my WhatsApp context, so that I can complete the booking with minimal typing.

#### Acceptance Criteria

1. THE Your_Details_Screen SHALL display a form with fields: full name (text input, maximum 100 characters), phone number (tel input, maximum 20 characters), and notes (textarea, maximum 500 characters, marked as optional)
2. WHEN the Template_SDK context contains a non-empty `name` value, THE Your_Details_Screen SHALL pre-fill the name field with that value and the field SHALL remain editable
3. WHEN the Template_SDK context contains a non-empty `phone` value, THE Your_Details_Screen SHALL pre-fill the phone field with that value and the field SHALL remain editable
4. IF context does not contain a name or phone value, THEN THE Your_Details_Screen SHALL display the respective field empty with placeholder text from the config `labels` object
5. THE Your_Details_Screen SHALL display a booking summary card below the form showing: list of selected services with individual prices, selected date, selected time slot, and the running total price
6. THE Your_Details_Screen SHALL display a confirm booking button that is enabled only when the name field and phone field each contain at least 1 non-whitespace character
7. WHEN the user taps the confirm button, THE Your_Details_Screen SHALL disable the button, display a loading state, and call `createAppointment` from Template_SDK with the booking payload containing services, date, slot, name, phone, and notes
8. IF the `createAppointment` call succeeds, THEN THE Template SHALL navigate to the Confirmation_Screen
9. IF the `createAppointment` call fails, THEN THE Your_Details_Screen SHALL re-enable the confirm button, hide the loading state, and display an inline error message; all previously entered form data SHALL be preserved
10. WHILE the `createAppointment` call is in progress, THE Your_Details_Screen SHALL prevent additional taps on the confirm button from triggering duplicate submissions

---

### Requirement 8: Confirmation Screen (Step 5)

**User Story:** As a user, I want to see a clear success message after booking, so that I know my appointment is secured and can return to the WhatsApp chat.

#### Acceptance Criteria

1. WHEN the appointment is submitted successfully, THE Confirmation_Screen SHALL display an animated success indicator (checkmark with a scale-in CSS animation)
2. THE Confirmation_Screen SHALL display the configured `success_message` text (default: "Your appointment is confirmed!")
3. THE Confirmation_Screen SHALL display a booking details summary showing: all selected services with prices, selected date formatted per locale, selected time slot, and total price
4. THE Confirmation_Screen SHALL display a CTA button with text from config `success_cta_text` (default: "Return to Chat") that closes the WebView or signals return to the WhatsApp conversation
5. WHEN the Confirmation_Screen renders, THE Template SHALL fire an analytics `complete` event with payload containing selected service IDs, selected date, and selected time slot
6. THE Step_Indicator SHALL mark all steps as completed when the Confirmation_Screen is active

---

### Requirement 9: Step Navigation and State Preservation

**User Story:** As a user, I want to navigate back to previous steps without losing my selections, so that I can change my mind or correct mistakes.

#### Acceptance Criteria

1. WHILE the user is on any step after the Welcome_Screen and before the Confirmation_Screen, THE Template SHALL display a back button that navigates to the immediately preceding step with a reverse (slide-right) transition animation
2. WHEN the user navigates back, THE Template SHALL preserve all previously entered selections (selected services, selected date, selected time slot, customer name, phone, and notes) so that they remain populated when the user returns forward
3. IF required selections for the current step are incomplete (Browse_Services_Screen: no service selected; Date_Time_Screen: no date or no time slot selected; Your_Details_Screen: name or phone field empty), THEN THE Template SHALL disable the forward navigation control for that step
4. WHEN the user reaches the Confirmation_Screen, THE Template SHALL hide the back button
5. THE Template SHALL prevent forward navigation from the Welcome_Screen unless the user taps the "Start Booking" CTA

---

### Requirement 10: Running Total and Service Cart

**User Story:** As a user, I want to always see the total cost of selected services, so that I can make informed decisions while browsing.

#### Acceptance Criteria

1. THE Running_Total_Footer SHALL compute the total price as the sum of all selected service prices, formatted to 2 decimal places with the config `currency` symbol
2. WHEN a service is added or removed, THE Running_Total_Footer SHALL update the displayed total within 100ms of the state change with a brief number-change animation (scale pulse or color flash)
3. THE Running_Total_Footer SHALL display the count of selected services alongside the total price (e.g., "3 services · $75.00")
4. THE Running_Total_Footer SHALL remain fixed at the bottom of the viewport on the Browse_Services_Screen and SHALL not overlap or obscure the last service card in the scrollable list (adequate bottom padding applied)
5. WHEN the user scrolls the service list, THE Running_Total_Footer SHALL remain visible and stationary at the bottom of the viewport

---

### Requirement 11: Visual Differentiation from Salon Booking Template

**User Story:** As a product owner, I want this template to feel visually distinct from the existing salon-booking-template, so that it offers a fresh modern experience for beauty-focused businesses.

#### Acceptance Criteria

1. THE Template SHALL use a visible animated Step_Indicator progress bar (segmented bar with fill animation) instead of the minimal header-based step tracker used in the salon-booking-template
2. THE Template SHALL use a category-first circular icon grid browsing pattern instead of the horizontal-tab category switcher used in the salon-booking-template
3. THE Template SHALL render services as rectangular cards with Add/Remove toggle buttons instead of the list-item selection pattern used in the salon-booking-template
4. THE Template SHALL display a persistent Running_Total_Footer during service browsing instead of a generic footer with back/continue buttons
5. THE Template SHALL apply CSS slide and fade transitions (using transform and opacity) between all step navigations instead of immediate screen swaps
6. THE Template SHALL use a 2-column time slot grid layout on the Date_Time_Screen instead of a flexible wrap grid layout
7. THE Welcome_Screen SHALL feature a circular category icon grid (2×3 layout) as a visual preview instead of a text-only hero section

---

### Requirement 12: Context Initialization and Pre-fill

**User Story:** As a WhatsApp user opening the template, I want my identity information pre-filled automatically, so that I can complete booking faster.

#### Acceptance Criteria

1. WHEN the Template mounts, THE Context_Reader SHALL call `getContext` from Template_SDK to extract visitor identity (visitorId, phone, name, lang) from URL query parameters and make the resulting context available to all child components within 500ms of mount
2. WHEN context contains a lang value, THE Template SHALL set the document direction attribute to RTL for language codes "ar", "he", "fa", and "ur", and to LTR for all other language codes
3. IF the `getContext` call fails to parse URL parameters, THEN THE Template SHALL fall back to default values (lang "en", empty name, empty phone) and render in LTR English state
4. THE Template SHALL format currency values using `Intl.NumberFormat` with locale derived from the context `lang` parameter and currency code from config `currency` field, displaying exactly 2 fraction digits
5. THE Template SHALL format date values using `Intl.DateTimeFormat` with locale derived from the context `lang` parameter

---

### Requirement 13: Error Handling and Demo Mode

**User Story:** As a user, I want the template to handle errors gracefully, so that I am not stranded on a broken screen.

#### Acceptance Criteria

1. IF the config endpoint does not respond within 3 seconds, THEN THE Template SHALL render using hardcoded default configuration values (Demo_Mode) allowing all screens and step transitions to function without further backend calls
2. IF the `createAppointment` API call fails, THEN THE Template SHALL display an inline error message on the Your_Details_Screen, preserve all user-entered form data, and allow the user to retry submission
3. IF a network error occurs during any API interaction other than analytics, THEN THE Template SHALL fire an analytics `error` event with a payload containing the failed endpoint path and the error message string
4. WHILE config is being fetched, THE Template SHALL display a skeleton loading state for no longer than 3 seconds, transitioning to the Welcome_Screen once config is resolved or the timeout elapses
5. IF the analytics endpoint is unreachable, THEN THE Template SHALL silently discard the event without retrying and without affecting the user-facing flow

---

### Requirement 14: Analytics and Event Tracking

**User Story:** As a business owner, I want to track user engagement through the booking funnel, so that I can identify drop-off points.

#### Acceptance Criteria

1. WHEN the Template mounts, THE Template SHALL fire a `view` analytics event via Template_SDK `trackView`
2. WHEN the user selects a service for the first time in a session, THE Template SHALL fire a `start` analytics event with the selected service identifiers
3. WHEN the user navigates between steps, THE Template SHALL fire a step-level tracking event with the `step` property set to one of: `welcome`, `browse_services`, `date_time`, `your_details`, or `confirmation`
4. WHEN the user successfully completes booking, THE Template SHALL fire a `complete` analytics event with selected service IDs, date, and time slot
5. IF the user closes the WebView before reaching the Confirmation_Screen, THEN THE Template SHALL fire an `abandon` analytics event with the `lastStep` property set to the last active step
6. IF any error occurs during the booking flow, THEN THE Template SHALL fire an `error` analytics event with a `message` property describing the failure
7. THE Template SHALL fire each analytics event exactly once per triggering action to prevent duplicate tracking data

---

### Requirement 15: Mobile-First Performance and Layout

**User Story:** As a user on a mobile device, I want the template to load fast, look great on my phone, and feel smooth to interact with.

#### Acceptance Criteria

1. THE Template SHALL render all screens without horizontal overflow or content truncation at the primary target viewport width of 375px and at all widths between 320px and 480px
2. THE Template SHALL use touch-optimized interaction targets with a minimum tap area of 44×44 CSS pixels for all interactive elements
3. THE Template SHALL achieve a Largest Contentful Paint (LCP) below 2 seconds when tested using a simulated 4G connection (9 Mbps downlink, 170ms RTT)
4. THE Template SHALL produce a total production bundle below 200 KB gzipped
5. THE Template SHALL use CSS variables from the SDK theme system (--qt-primary, --qt-secondary, --qt-text, --qt-bg, --qt-font) for all color and font declarations
6. WHEN the viewport width exceeds 480px, THE Template SHALL constrain the layout to a maximum width of 480px centered horizontally
7. THE Template SHALL render all CSS animations at 60fps on mid-range mobile devices by using only `transform` and `opacity` properties for animated elements

---

### Requirement 16: Dark Mode Support

**User Story:** As an admin, I want to offer dark mode to users who prefer it.

#### Acceptance Criteria

1. WHERE config `dark_mode` is true, THE Template SHALL call the SDK `applyTheme` with `darkMode: true` and set the `data-theme="dark"` attribute on the document root element
2. WHERE config `dark_mode` is true, THE Template SHALL ensure all text maintains a minimum contrast ratio of 4.5:1 against its background per WCAG 2.1 Level AA
3. WHERE config `dark_mode` is false or absent, THE Template SHALL render in light mode and the `data-theme` attribute SHALL not be present on the root element
4. IF the SDK `applyTheme` call fails when applying dark mode, THEN THE Template SHALL fall back to light mode rendering without displaying a broken layout

---

### Requirement 17: Accessibility

**User Story:** As a user with assistive technology, I want the template to be accessible, so that I can navigate and complete booking independently.

#### Acceptance Criteria

1. THE Template SHALL use semantic HTML elements (header, main, nav, section, button, form, label) throughout all screens
2. THE Template SHALL associate all form inputs with visible labels using `<label>` elements or `aria-label` attributes
3. THE Template SHALL ensure all interactive elements are keyboard-navigable using Tab key in logical reading order with visible focus indicators of at least 2px thickness and 3:1 contrast ratio
4. WHEN the user navigates to a new step, THE Template SHALL announce the new step name to screen readers using an ARIA live region with `aria-live="polite"`
5. WHEN a category icon, service card, date element, or time slot is selected, THE Template SHALL convey the selected state to assistive technologies using `aria-pressed` or `aria-selected` attributes
6. IF a navigation button is disabled, THEN THE Template SHALL communicate the disabled state using the `disabled` attribute or `aria-disabled="true"`
7. THE Template SHALL provide `aria-label` descriptions for the Category_Icon_Grid and the time slot grid to convey their purpose to screen reader users
