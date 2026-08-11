# Requirements Document

## Introduction

The Salon Booking Template is a configurable, JSON-driven WhatsApp WebView mini-app that enables end-users to book appointments at service-oriented businesses (salons, spas, clinics, gyms, etc.) directly from a WhatsApp chat conversation. The template opens when a user taps a CTA button in the chat, presents a streamlined 5-step booking flow (Landing → Service Selection → Schedule → Customer Details & Review → Confirmation), and submits the appointment via the QuantumMind Template SDK. The entire flow is driven by admin-editable configuration — zero code changes are required per-business.

## Glossary

- **Template**: A self-contained React + Vite WebView application within the QuantumMind Templates monorepo that is built, zipped, and uploaded for hosting
- **Template_SDK**: The shared package (`@quantum/template-sdk`) providing context reading, config fetching, theme application, analytics tracking, and backend actions
- **Config**: A JSON object fetched at runtime from `GET /template/:id/config` containing all admin-editable values (labels, colors, images, services, staff, working hours, etc.)
- **Manifest**: A `manifest.json` file declaring template metadata and the `templateConfig` schema array (key, type, label, defaultValue, group)
- **Context**: Runtime parameters passed via URL query string (vid, ph, name, bid, cid, src, tid, lead, lang) identifying the visitor, bot, and conversation
- **Booking_Flow**: The 5-step user journey: Landing → Service_Selection → Schedule → Review → Confirmation
- **Landing_Screen**: The first screen showing brand identity, hero image, introductory text, and a primary CTA to begin booking
- **Service_Selection_Screen**: The screen where users browse categories and select one or more services with pricing and duration
- **Schedule_Screen**: The screen combining optional staff selection, date picker, and time slot grid
- **Review_Screen**: The screen displaying pre-filled customer details, optional notes, booking summary, and a confirm action
- **Confirmation_Screen**: The success screen shown after booking submission with appointment details and a return-to-chat CTA
- **Staff**: Service providers (stylists, therapists, doctors) defined in config with id, name, role, avatar, rating, and experience
- **Time_Slot**: A bookable time interval derived from working_hours and time_slot_interval config values
- **Category**: A grouping of services (e.g., Haircut, Coloring, Makeup) defined in config
- **WebView**: The in-app browser frame within WhatsApp where the template renders
- **CTA**: Call-to-action button
- **RTL**: Right-to-left text direction for languages such as Arabic and Hebrew
- **Demo_Mode**: A fallback operational state where the template renders with default config and simulates successful booking when the backend is unreachable

## Requirements

### Requirement 1: Template Scaffolding and Manifest

**User Story:** As a template developer, I want the salon-booking-template to follow the established monorepo conventions, so that it integrates with the existing build pipeline and admin tooling.

#### Acceptance Criteria

1. THE Template SHALL include a `manifest.json` at its root declaring name, description, industry as "salon", category as "appointment", tags (at least 2 entries), supportedLanguages (at least one language code), supportsDarkMode (boolean), estimatedDuration, and a templateConfig array containing at least 1 entry where each entry defines key, type, label, defaultValue, and group
2. THE Template SHALL declare `@quantum/template-sdk` as a workspace dependency and import context, config, theme, analytics, and actions from the SDK
3. THE Template SHALL reside in the `templates/salon-booking-template/` directory and include a root `index.html` entry point, so that it is discoverable by the monorepo workspace and build tooling
4. THE Template SHALL be buildable via the shared Vite config (`createTemplateConfig`) producing a `dist/` folder with `index.html` at the root, and TypeScript compilation (`tsc --noEmit`) SHALL complete with zero errors
5. THE Template SHALL be packageable via the existing `build-and-zip.ts` tooling into a single ZIP file under `releases/salon-booking-template.zip` with `index.html` located at the archive root
6. THE Template SHALL produce a production bundle where the sum of all files in `dist/` is below 200 KB when gzip-compressed

---

### Requirement 2: Configuration Loading and Defaults

**User Story:** As an admin, I want to configure the template entirely through JSON without code changes, so that the same template serves salons, spas, clinics, gyms, and other service businesses.

#### Acceptance Criteria

1. WHEN the Template loads, THE Config_Loader SHALL call `loadConfig` from Template_SDK to fetch admin-editable configuration values and SHALL complete the config fetch within 10 seconds of page load
2. IF the config fetch fails, the template ID cannot be resolved, or the fetch exceeds the 10-second timeout, THEN THE Config_Loader SHALL fall back to default configuration values defined in the template source and SHALL render the template using those defaults without displaying an error to the end user
3. THE Template SHALL expose a templateConfig schema in manifest.json covering: business_name, business_logo, hero_image, hero_title, hero_subtitle, primary_color, secondary_color, text_color, background_color, font_family, dark_mode, services, staff, categories, working_hours, time_slot_interval, show_staff_selection, show_reviews, reviews, booking_settings, success_message, success_cta_text, currency, and labels, where each entry specifies a key, type, label, defaultValue, and group
4. WHEN config values are loaded and contain only a subset of configurable keys, THE Config_Loader SHALL merge the fetched values with the template-defined defaults so that every key resolves to either the fetched value or the default value
5. WHEN config values are loaded, THE Template SHALL apply theme tokens (primaryColor, secondaryColor, textColor, backgroundColor, fontFamily, darkMode) via the SDK `applyTheme` function as CSS custom properties on the document root element
6. THE Template SHALL render all user-facing static text (headings, button labels, placeholder text, success messages, and section titles) from the `labels` config object, and IF a label key is missing from the config, THEN THE Template SHALL display the corresponding default value defined in the template source

---

### Requirement 3: Context Initialization and Pre-fill

**User Story:** As a WhatsApp user opening the booking template, I want my name and phone number pre-filled automatically, so that I can book faster without re-entering information.

#### Acceptance Criteria

1. WHEN the Template mounts, THE Context_Reader SHALL call `getContext` from Template_SDK to extract visitor identity (visitorId, phone, name, lang) from URL query parameters and make the resulting context object available to all child components within 500 ms of mount
2. WHEN context contains a name value that is a non-empty string of at most 100 characters, THE Review_Screen SHALL pre-fill the customer name field with the context name and the field SHALL remain editable by the user
3. WHEN context contains a phone value that is a non-empty string of at most 20 characters, THE Review_Screen SHALL pre-fill the customer phone field with the context phone number and the field SHALL remain editable by the user
4. IF context does not contain a name value or the name value is empty, THEN THE Review_Screen SHALL display the customer name field empty with its placeholder text
5. IF context does not contain a phone value or the phone value is empty, THEN THE Review_Screen SHALL display the customer phone field empty with its placeholder text
6. WHEN context contains a lang value, THE Template SHALL apply the corresponding language labels from config and set the document direction attribute to RTL for languages whose lang value is one of ["ar", "he", "fa", "ur"], and to LTR for all other lang values
7. IF the `getContext` call fails to parse URL parameters, THEN THE Template SHALL fall back to default values (lang "en", empty name, empty phone) and render the template in its default LTR English state

---

### Requirement 4: Landing Screen

**User Story:** As a user, I want to see a branded landing page when I open the booking link, so that I know which business I am booking with and what to expect.

#### Acceptance Criteria

1. THE Landing_Screen SHALL display the business logo (from config `business_logo`) in a header component; IF `business_logo` is empty or absent, THEN THE Landing_Screen SHALL display a fallback element showing the first character of `business_name`
2. THE Landing_Screen SHALL display the business name (from config `business_name`) adjacent to the logo in the header component
3. THE Landing_Screen SHALL display a hero banner with the configured `hero_image` as a background image, `hero_title` as a heading, and `hero_subtitle` as descriptive text; IF `hero_image` is empty, THEN THE Landing_Screen SHALL display the hero section with a solid background using the primary color
4. THE Landing_Screen SHALL display a primary CTA button with text from config `labels.cta_book_now` (default: "Book Now") that navigates the user to the Service_Selection_Screen
5. WHERE config `show_reviews` is true AND the `reviews` config array contains at least one entry, THE Landing_Screen SHALL display a review snippet showing the average rating (rounded to 1 decimal) and total review count
6. WHERE config `show_reviews` is true AND the `reviews` config array is empty or undefined, THE Landing_Screen SHALL omit the review snippet
7. WHEN the Landing_Screen renders, THE Template SHALL fire an analytics `view` event via Template_SDK `trackView`

---

### Requirement 5: Service Selection Screen

**User Story:** As a user, I want to browse services by category and select what I need, so that I can build my appointment with the right services.

#### Acceptance Criteria

1. THE Service_Selection_Screen SHALL render category tabs as a horizontal scrollable list based on the `categories` config array, with the first category selected by default on initial load
2. WHEN a user selects a category tab, THE Service_Selection_Screen SHALL filter the displayed services to show only services matching the selected category, and SHALL visually highlight the active tab
3. THE Service_Selection_Screen SHALL render each service as a card displaying: service name (truncated with ellipsis beyond 60 characters), price (formatted to 2 decimal places with config `currency` symbol), duration (displayed in minutes), and an optional image
4. WHEN a user taps a service card, THE Service_Selection_Screen SHALL toggle the service selection state and SHALL visually distinguish selected cards from unselected cards using the theme primary color
5. WHERE config `booking_settings.allow_multiple_services` is true, THE Service_Selection_Screen SHALL allow the user to select up to 10 services simultaneously
6. WHERE config `booking_settings.allow_multiple_services` is false, THE Service_Selection_Screen SHALL allow the user to select exactly one service at a time; WHEN a service is already selected, THE Service_Selection_Screen SHALL visually disable other service cards to prevent additional selection attempts until the current service is deselected
7. THE Service_Selection_Screen SHALL display a continue button that is disabled when no service is selected and enabled when at least one service is selected
8. WHEN the user taps continue, THE Service_Selection_Screen SHALL fire an analytics `start` event with the selected service IDs and navigate to the Schedule_Screen
9. IF a selected category contains no services, THEN THE Service_Selection_Screen SHALL display an empty-state message indicating no services are available in that category

---

### Requirement 6: Schedule Screen — Staff Selection

**User Story:** As a user, I want to optionally choose a preferred staff member, so that I can book with someone I trust.

#### Acceptance Criteria

1. WHERE config `show_staff_selection` is true, THE Schedule_Screen SHALL display a staff picker section with staff cards rendered from the `staff` config array, showing a maximum of 20 staff entries
2. THE Schedule_Screen SHALL render each staff card displaying: avatar image (with initials fallback when no avatar image URL is provided), name, role, rating (numeric, 1.0–5.0), and experience
3. WHEN a user taps a staff card, THE Schedule_Screen SHALL select that staff member and apply a visible highlight style (border or background change) to the selected card while removing any highlight from the previously selected card
4. WHEN a user taps the currently selected staff card, THE Schedule_Screen SHALL deselect that staff member and remove the highlight style from the card
5. WHERE config `show_staff_selection` is false, THE Schedule_Screen SHALL omit the staff picker section entirely and allow the user to proceed without a staff selection
6. IF config `show_staff_selection` is true AND the `staff` config array is empty or undefined, THEN THE Schedule_Screen SHALL hide the staff picker section and allow the user to proceed without a staff selection

---

### Requirement 7: Schedule Screen — Date and Time Selection

**User Story:** As a user, I want to pick a date and time slot for my appointment, so that I can choose a convenient time.

#### Acceptance Criteria

1. THE Schedule_Screen SHALL display a horizontal scrollable date picker showing the next N days, where N is derived from config `booking_settings.advance_booking_days` (default: 14)
2. WHEN the Schedule_Screen renders, THE Date_Picker SHALL pre-select the current date as the default
3. WHEN a user taps a date, THE Schedule_Screen SHALL update the selected date, clear any previously selected time slot, and re-render the available time slots for the newly selected date
4. THE Schedule_Screen SHALL compute available time slots for the selected date based on config `working_hours` for that day of the week and config `time_slot_interval` (default: 30 minutes)
5. WHEN the selected date is the current day, THE Schedule_Screen SHALL exclude time slots whose start time has already passed relative to the user's current local time
6. WHILE the selected date falls on a day where config `working_hours` defines no open/close times, or all computed time slots have been excluded, THE Schedule_Screen SHALL display only a message indicating no availability, hide the time slot grid entirely, and disable the continue action
7. WHEN the selected date has valid working hours with computable time slots, THE Schedule_Screen SHALL render time slots as a grid of tappable buttons
8. WHEN a user taps a time slot, THE Schedule_Screen SHALL select that slot and apply a distinct selected style (differentiated from unselected slots by background color or border) to the tapped button
9. THE Schedule_Screen SHALL display a continue button that is enabled only when both a date and time slot are selected

---

### Requirement 8: Review Screen — Customer Details and Booking Summary

**User Story:** As a user, I want to review my booking details and provide my contact information before confirming, so that I can verify everything is correct.

#### Acceptance Criteria

1. THE Review_Screen SHALL display a customer form with fields for full name (maximum 100 characters) and phone number (maximum 20 characters), pre-filled from the Template_SDK context values `name` and `phone` when those values are non-empty
2. WHERE config `booking_settings.require_notes` is true, THE Review_Screen SHALL display a notes textarea field (maximum 500 characters)
3. WHERE config `booking_settings.require_notes` is false, THE Review_Screen SHALL display the notes textarea as an optional field with placeholder text
4. THE Review_Screen SHALL display a booking summary section listing: selected services (name, price, duration), selected staff member name (if a staff member was selected), selected date in ISO format (YYYY-MM-DD), selected time slot, and total price
5. THE Review_Screen SHALL compute and display the total price as the sum of all selected service prices, formatted to 2 decimal places with the config `currency` symbol prepended
6. THE Review_Screen SHALL display a confirm booking button that is enabled only when the full name field and phone field each contain at least 1 non-whitespace character
7. WHEN the user taps the confirm button, THE Review_Screen SHALL disable the confirm button, display a loading indicator, and call `createAppointment` from Template_SDK with the booking payload (services, staff, date, slot, name, phone, notes)
8. IF the `createAppointment` call fails, THEN THE Review_Screen SHALL re-enable the confirm button, hide the loading indicator, and display an error message indicating the booking could not be completed
9. WHILE the `createAppointment` call is in progress, THE Review_Screen SHALL prevent additional taps on the confirm button from triggering duplicate submissions

---

### Requirement 9: Confirmation Screen

**User Story:** As a user, I want to see a success confirmation after booking, so that I know my appointment is secured.

#### Acceptance Criteria

1. WHEN the appointment is submitted successfully, THE Confirmation_Screen SHALL display a checkmark icon indicating success
2. WHEN the Confirmation_Screen renders, THE Confirmation_Screen SHALL display the configured `success_message` text from config (default: "Your appointment is confirmed!")
3. WHEN the Confirmation_Screen renders, THE Confirmation_Screen SHALL display a booking details card showing: selected services, selected staff member name (if applicable), selected date, selected time slot, and total price
4. WHEN the Confirmation_Screen renders, THE Confirmation_Screen SHALL display a CTA button with text from config `success_cta_text` (default: "Return to chat") that signals the user to close the WebView
5. WHEN the Confirmation_Screen renders, THE Template SHALL fire an analytics `complete` event with a payload containing at minimum: selected service IDs, selected staff ID (if applicable), selected date, and selected time slot
6. IF the appointment submission fails, THEN THE Confirmation_Screen SHALL display a notice message indicating the submission could not be completed while still showing the booking details the user entered

---

### Requirement 10: Error Handling and Demo Mode

**User Story:** As a user, I want the booking template to handle errors gracefully, so that I am not left on a broken screen.

#### Acceptance Criteria

1. IF the `createAppointment` API call fails, THEN THE Template SHALL display an inline error message on the Review_Screen indicating the booking could not be completed, preserve all user-entered form data, and present a retry button that re-submits the same request without requiring the user to navigate back
2. IF the config endpoint does not respond within 3 seconds, THEN THE Template SHALL render using hardcoded default configuration values (Demo_Mode), allowing all screens and transitions to be navigated without further backend calls; IF the config endpoint responds after the 3-second timeout has elapsed, THEN THE Template SHALL ignore the late response and remain in Demo_Mode
3. IF a network error occurs during any API interaction other than the analytics call itself, THEN THE Template SHALL fire an analytics `error` event with a payload containing the failed endpoint path and the error message string
4. WHILE config is being fetched, THE Template SHALL display a skeleton loading state for no longer than 3 seconds, transitioning to the Landing_Screen once config is resolved or the timeout elapses
5. IF the analytics endpoint is unreachable, THEN THE Template SHALL silently discard the event without retrying and without affecting the user-facing flow

---

### Requirement 11: Analytics and Event Tracking

**User Story:** As a business owner, I want to track user engagement through the booking funnel, so that I can understand drop-off points and optimize conversions.

#### Acceptance Criteria

1. WHEN the Template mounts and fires its initial render, THE Template SHALL fire a `view` analytics event via Template_SDK `track` containing the templateId and platform from the runtime context
2. WHEN the user selects a service for the first time in a session, THE Template SHALL fire a `start` analytics event including the selected service identifiers
3. WHEN the user navigates between steps, THE Template SHALL fire a step-level tracking event with the `step` property set to one of the defined step names: `landing`, `services`, `schedule`, `review`, or `confirmation`
4. WHEN the user successfully completes booking, THE Template SHALL fire a `complete` analytics event with the selected service IDs, staff ID, date, and time slot
5. IF the user closes the WebView before reaching the `confirmation` step, THEN THE Template SHALL fire an `abandon` analytics event with the `lastStep` property set to the last step the user was on
6. IF any error occurs during the booking flow, THEN THE Template SHALL fire an `error` analytics event with a `message` property describing the failure reason
7. THE Template SHALL fire each analytics event exactly once per triggering action to prevent duplicate tracking data; WHEN multiple triggering actions occur simultaneously (e.g., an error during booking completion), THE Template SHALL allow multiple distinct events to fire concurrently

---

### Requirement 12: Mobile-First and Performance

**User Story:** As a user on a mobile device with varying network quality, I want the booking template to load fast and feel native, so that I can complete my booking without frustration.

#### Acceptance Criteria

1. THE Template SHALL render all screens without horizontal overflow or content truncation at any viewport width between 320px and 480px
2. THE Template SHALL use touch-optimized interaction targets with a minimum tap area of 44x44 CSS pixels for all interactive elements including buttons, links, form inputs, and selectable cards
3. THE Template SHALL achieve a Largest Contentful Paint (LCP) below 2 seconds when tested using a simulated 4G connection profile of 9 Mbps downlink, 1.5 Mbps uplink, and 170ms round-trip latency
4. THE Template SHALL produce a total production bundle (all JS + CSS + assets) below 200 KB gzipped
5. THE Template SHALL use CSS variables from the SDK theme system (--qt-primary, --qt-secondary, --qt-text, --qt-bg, --qt-font) for all color, background, and font-family declarations, applying no hardcoded color or font values except within CSS variable fallback defaults in the :root rule
6. WHEN the viewport width exceeds 480px, THE Template SHALL constrain the layout to a maximum width of 480px centered horizontally

---

### Requirement 13: Step Navigation and Progress Indication

**User Story:** As a user, I want to see my progress through the booking flow and navigate back to previous steps, so that I can correct mistakes or change my mind.

#### Acceptance Criteria

1. THE Template SHALL display a step indicator component showing all 5 Booking_Flow steps (Landing, Service Selection, Schedule, Review, Confirmation) with each step visually distinguished as completed, current, or upcoming
2. WHILE the user is on any step after the Landing_Screen and before the Confirmation_Screen, THE Template SHALL display a back button that navigates to the immediately preceding step
3. WHEN the user navigates back, THE Template SHALL preserve all previously entered selections (services, staff, date, time, customer details) so that they remain populated when the user returns forward; IF state preservation fails due to a technical issue, THEN THE Template SHALL block the back navigation rather than proceeding with data loss
4. IF required selections for the current step are incomplete (Service_Selection_Screen: no service selected; Schedule_Screen: no date or no time slot selected; Review_Screen: name or phone field empty), THEN THE Template SHALL disable the forward navigation control for that step
5. WHEN the user reaches the Confirmation_Screen, THE Template SHALL hide the back button and the step indicator SHALL mark all preceding steps as completed

---

### Requirement 14: Internationalization and RTL Support

**User Story:** As an admin serving multilingual customers, I want to configure all labels in any language and support RTL layouts, so that the template works for Arabic, Hebrew, and other RTL audiences.

#### Acceptance Criteria

1. THE Template SHALL render all user-facing text strings (headings, button labels, field labels, status messages) from the config `labels` object, falling back to the English default value defined in the manifest `templateConfig` when a label key is absent or empty in the config
2. WHEN the context `lang` parameter is explicitly set to an RTL language code (ar, he, fa, ur), THE Template SHALL set the `dir` attribute on the document root element to `rtl` and apply CSS logical properties such that text alignment, reading order, and flex/grid layout direction are reversed from left-to-right to right-to-left; IF the RTL CSS/DOM application fails, THEN THE Template SHALL silently fall back to LTR rendering
3. IF the context `lang` parameter is not provided or is empty, THEN THE Template SHALL default to `en` and render in LTR direction
4. THE Template SHALL format currency values using the `Intl.NumberFormat` API with the locale derived from the `lang` context parameter and the currency code specified in the config `currency` field, displaying a minimum of 2 and maximum of 2 fraction digits
5. IF the config `currency` field is absent or empty, THEN THE Template SHALL fall back to formatting currency values using locale-default currency formatting without a currency symbol
6. THE Template SHALL format all date values using the `Intl.DateTimeFormat` API with the locale derived from the `lang` context parameter, displaying at minimum the day, month, and year components

---

### Requirement 15: Dark Mode Support

**User Story:** As an admin, I want to enable dark mode for the booking template, so that users with dark-mode preference get a comfortable visual experience.

#### Acceptance Criteria

1. WHERE config `dark_mode` is true, WHEN the Template loads or config is refreshed, THE Template SHALL call the SDK `applyTheme` with `darkMode: true` and set the `data-theme="dark"` attribute on the root element within 100 milliseconds of config resolution
2. WHERE config `dark_mode` is true, THE Template SHALL ensure all normal-weight text at sizes below 18pt maintains a minimum contrast ratio of 4.5:1 against its background, and all large text (18pt or above, or 14pt bold), icons, and interactive UI component boundaries maintain a minimum contrast ratio of 3:1, per WCAG 2.1 Level AA
3. WHERE config `dark_mode` is false or absent, WHEN the Template loads or config is refreshed, THE Template SHALL render in light mode by applying the configured color values from the admin config and ensuring the `data-theme` attribute is not present on the root element
4. IF the SDK `applyTheme` call fails or throws an error when applying dark mode, THEN THE Template SHALL fall back to light mode rendering using configured colors and shall not display a broken or unstyled layout to the user

---

### Requirement 16: Accessibility

**User Story:** As a user with assistive technology, I want the booking template to be accessible, so that I can navigate and complete booking independently.

#### Acceptance Criteria

1. THE Template SHALL use semantic HTML elements (header, main, nav, section, button, form, label) throughout all screens (Landing, Service Selection, Schedule, Review, and Confirmation)
2. THE Template SHALL associate all form inputs with visible labels using `<label>` elements or `aria-label` attributes
3. THE Template SHALL ensure all interactive elements are keyboard-navigable using Tab key in logical reading order, with focus indicators that have a minimum contrast ratio of 3:1 against adjacent colors and are at least 2px in thickness
4. WHEN the user navigates to a new step, THE Template SHALL announce the new step heading text to screen readers using an ARIA live region with `aria-live="polite"`
5. THE Template SHALL ensure color contrast ratios meet WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text)
6. WHEN a service card, staff card, date button, or time slot is selected, THE Template SHALL convey the selected state to assistive technologies using `aria-pressed` or `aria-selected` attributes
7. IF a navigation button (Continue, Confirm booking) is disabled, THEN THE Template SHALL communicate the disabled state to assistive technologies using the `disabled` attribute or `aria-disabled="true"`, and the button SHALL not be reachable via keyboard action
8. THE Template SHALL ensure all enabled navigation buttons are reachable via keyboard Tab navigation
