# Requirements Document

## Introduction

The Meeting Scheduler Template is a Calendly-style meeting/demo booking WebView mini-app for the QuantumMind Templates monorepo. It provides a two-step booking flow (Calendar & Time Selection → Confirmation Form) presented in a responsive two-panel layout. The left panel displays business branding (logo, title, subtitle, duration, description) while the right panel houses the interactive booking interface. Configuration is fully JSON-driven via the Template SDK, enabling any business to customize branding, working hours, slot intervals, and form fields without code changes. Timezone detection is handled client-side using the browser Intl API. On successful booking the template displays an inline success message and auto-closes the WebView after a configurable delay.

## Glossary

- **Template**: A self-contained React + Vite WebView application within the QuantumMind Templates monorepo that is built, zipped, and uploaded for hosting
- **Template_SDK**: The shared package (`@quantum/template-sdk`) providing context reading, config fetching, theme application, analytics tracking, and backend actions
- **Config**: A JSON object fetched at runtime from `GET /template/:id/config` containing all admin-editable values (labels, colors, images, working hours, etc.)
- **Manifest**: A `manifest.json` file declaring template metadata and the `templateConfig` schema array (key, type, label, defaultValue, group)
- **Context**: Runtime parameters passed via URL query string (vid, ph, name, bid, cid, src, tid, lead, lang) identifying the visitor, bot, and conversation
- **Booking_Flow**: The 2-step user journey: Calendar_Screen → Confirmation_Screen
- **Calendar_Screen**: The first interactive screen (right panel) displaying a full month calendar grid, month navigation, timezone selector, and vertical scrollable time slot list
- **Confirmation_Screen**: The second interactive screen (right panel) displaying a back button, booking summary card, and form fields for name, email, and optional phone
- **Info_Panel**: The left panel displaying business logo, meeting title, subtitle, duration icon/badge, and meeting description
- **Time_Slot**: A bookable time interval derived from configured working hours and slot duration, displayed as pill-shaped buttons
- **Timezone_Selector**: A dropdown allowing the user to change the displayed timezone for time slots, defaulting to the browser-detected timezone
- **WebView**: The in-app browser frame within WhatsApp where the template renders
- **Working_Hours**: A JSON config object defining open/close times for each day of the week
- **Slot_Duration**: The configured length of each meeting time slot in minutes
- **Success_Message**: An inline confirmation banner displayed at the top of the form area after successful booking
- **Auto_Close**: Behavior where the WebView signals closure after a configurable delay following successful booking
- **Primary_Color**: The brand accent color (#0060E6 by default) used for selected states, buttons, and active elements
- **Demo_Mode**: A fallback operational state where the template renders with default config and simulates successful booking when the backend is unreachable

## Requirements

### Requirement 1: Template Scaffolding and Manifest

**User Story:** As a template developer, I want the meeting-scheduler template to follow the established monorepo conventions, so that it integrates with the existing build pipeline and admin tooling.

#### Acceptance Criteria

1. THE Template SHALL include a `manifest.json` at its root declaring name, description, industry as "general", category as "scheduling", tags (at least "meeting", "scheduling", "demo", "booking"), supportedLanguages (at least "en"), supportsDarkMode (boolean), estimatedDuration, and a templateConfig array containing at least 1 entry where each entry defines key, type, label, defaultValue, and group
2. THE Template SHALL declare `@quantum/template-sdk` as a workspace dependency and import context, config, theme, analytics, and actions from the SDK
3. THE Template SHALL reside in the `templates/meeting-scheduler/` directory and include a root `index.html` entry point, so that it is discoverable by the monorepo workspace and build tooling
4. THE Template SHALL be buildable via the shared Vite config (`createTemplateConfig`) producing a `dist/` folder with `index.html` at the root, and TypeScript compilation (`tsc --noEmit`) SHALL complete with zero errors
5. THE Template SHALL be packageable via the existing `build-and-zip.ts` tooling into a single ZIP file under `releases/meeting-scheduler.zip` with `index.html` located at the archive root
6. THE Template SHALL produce a production bundle where the sum of all files in `dist/` is below 200 KB when gzip-compressed
7. THE Template SHALL use Inter as the default font family loaded from Google Fonts or bundled locally

---

### Requirement 2: Configuration Loading and Defaults

**User Story:** As an admin, I want to configure the meeting scheduler entirely through JSON without code changes, so that the same template serves product demos, sales calls, consultations, and other meeting types.

#### Acceptance Criteria

1. WHEN the Template loads, THE Config_Loader SHALL call `loadConfig` from Template_SDK to fetch admin-editable configuration values and SHALL complete the config fetch within 10 seconds of page load
2. IF the config fetch fails, the template ID cannot be resolved, or the fetch exceeds the 10-second timeout, THEN THE Config_Loader SHALL fall back to default configuration values defined in the template source and SHALL render the template using those defaults without displaying an error to the end user
3. THE Template SHALL expose a templateConfig schema in manifest.json covering: business_name, business_logo, meeting_title, meeting_subtitle, meeting_description, meeting_duration, primary_color, text_color, background_color, font_family, dark_mode, working_hours, slot_duration, advance_booking_days, success_message, auto_close_delay, show_phone_field, and labels, where each entry specifies a key, type, label, defaultValue, and group
4. WHEN config values are loaded and contain only a subset of configurable keys, THE Config_Loader SHALL merge the fetched values with the template-defined defaults so that every key resolves to either the fetched value or the default value
5. WHEN config values are loaded, THE Template SHALL apply theme tokens (primaryColor, textColor, backgroundColor, fontFamily, darkMode) via the SDK `applyTheme` function as CSS custom properties on the document root element
6. THE Template SHALL render all user-facing static text (headings, button labels, placeholder text, success messages) from the `labels` config object, and IF a label key is missing from the config, THEN THE Template SHALL display the corresponding default value defined in the template source

---

### Requirement 3: Context Initialization and Pre-fill

**User Story:** As a WhatsApp user opening the meeting scheduler, I want my name and phone number pre-filled automatically, so that I can book faster without re-entering information.

#### Acceptance Criteria

1. WHEN the Template mounts, THE Context_Reader SHALL call `getContext` from Template_SDK to extract visitor identity (visitorId, phone, name, lang) from URL query parameters and make the resulting context object available to all child components within 500 ms of mount
2. WHEN context contains a name value that is a non-empty string of at most 100 characters, THE Confirmation_Screen SHALL pre-fill the name field with the context name and the field SHALL remain editable by the user
3. WHEN context contains a phone value that is a non-empty string of at most 20 characters, THE Confirmation_Screen SHALL pre-fill the phone field with the context phone number and the field SHALL remain editable by the user
4. IF context does not contain a name value or the name value is empty, THEN THE Confirmation_Screen SHALL display the name field empty with its placeholder text
5. IF context does not contain a phone value or the phone value is empty, THEN THE Confirmation_Screen SHALL display the phone field empty with its placeholder text
6. IF the `getContext` call fails to parse URL parameters, THEN THE Template SHALL fall back to default values (lang "en", empty name, empty phone) and render the template in its default state

---

### Requirement 4: Info Panel (Left Panel)

**User Story:** As a user, I want to see the meeting details and business branding clearly when I open the scheduler, so that I know what I am booking and with whom.

#### Acceptance Criteria

1. THE Info_Panel SHALL display the business logo (from config `business_logo`) as an image; IF `business_logo` is empty or absent, THEN THE Info_Panel SHALL display a fallback element showing the first character of `business_name`
2. THE Info_Panel SHALL display the meeting title (from config `meeting_title`) as a heading element
3. THE Info_Panel SHALL display the meeting subtitle (from config `meeting_subtitle`) as secondary text below the title
4. THE Info_Panel SHALL display a duration badge showing a clock icon and the configured `meeting_duration` value formatted as "{N} min" where N is the numeric duration in minutes
5. THE Info_Panel SHALL display the meeting description (from config `meeting_description`) as body text below the duration badge
6. WHEN the viewport width is below 768px (mobile), THE Info_Panel SHALL render as a compact top header bar displaying only the logo, meeting title, and duration badge in a single horizontal row; the meeting description SHALL be hidden or accessible via a toggle control
7. WHEN the viewport width is 768px or above (desktop), THE Info_Panel SHALL render as a fixed-width left column occupying approximately one-third of the available width

---

### Requirement 5: Calendar Screen — Month Calendar Grid

**User Story:** As a user, I want to see a full month calendar to pick my preferred meeting date, so that I can visually browse available days.

#### Acceptance Criteria

1. THE Calendar_Screen SHALL display a full month calendar grid with 7 columns labeled SUN through SAT and rows corresponding to the weeks of the displayed month
2. THE Calendar_Screen SHALL display the current month and year as a heading above the calendar grid
3. THE Calendar_Screen SHALL provide forward and backward navigation arrows to move between months
4. WHEN the Calendar_Screen renders initially, THE Calendar_Screen SHALL display the current month with today's date visually distinguished from other dates
5. THE Calendar_Screen SHALL visually disable (grey out) all past dates and dates beyond the configured `advance_booking_days` limit (default: 30 days from today) so that the user cannot select them
6. WHEN a user taps a selectable date cell, THE Calendar_Screen SHALL highlight the selected date with the Primary_Color fill, clear any previously selected time slot, and render the available time slots for that date
7. THE Calendar_Screen SHALL not allow navigation to months that are entirely outside the bookable date range

---

### Requirement 6: Calendar Screen — Timezone Selection

**User Story:** As a user in a different timezone, I want to see time slots in my local timezone and change it if needed, so that I book at the correct time.

#### Acceptance Criteria

1. WHEN the Calendar_Screen renders, THE Timezone_Selector SHALL detect the user's timezone using the browser `Intl.DateTimeFormat().resolvedOptions().timeZone` API and display it as the selected value
2. THE Timezone_Selector SHALL display the detected timezone in a human-readable format including the UTC offset (e.g., "America/New_York (UTC-05:00)")
3. WHEN the user interacts with the Timezone_Selector, THE Timezone_Selector SHALL present a searchable dropdown or list of IANA timezone identifiers
4. WHEN the user selects a different timezone, THE Calendar_Screen SHALL recalculate and re-render all displayed time slots according to the newly selected timezone and clear any previously selected time slot
5. IF the browser Intl API is unavailable or fails to detect a timezone, THEN THE Timezone_Selector SHALL default to "UTC" and display time slots in UTC

---

### Requirement 7: Calendar Screen — Time Slot List

**User Story:** As a user, I want to see available time slots for my selected date and pick one, so that I can secure a specific meeting time.

#### Acceptance Criteria

1. WHEN a date is selected, THE Calendar_Screen SHALL compute available time slots based on the config `working_hours` for that day of the week, the config `slot_duration` (default: 30 minutes), and the selected timezone
2. THE Calendar_Screen SHALL render time slots as a vertical scrollable list of pill-shaped buttons displaying the start time formatted in 12-hour notation with AM/PM
3. WHEN the selected date is the current day, THE Calendar_Screen SHALL exclude time slots whose start time has already passed relative to the current time in the selected timezone
4. WHEN a user taps a time slot pill, THE Calendar_Screen SHALL apply the Primary_Color as background fill to the selected pill and display a blue border with no fill on all unselected pills
5. WHEN a user taps a different time slot after one is already selected, THE Calendar_Screen SHALL deselect the previous slot and select the new one
6. WHILE the selected date falls on a day where config `working_hours` defines no open/close times, or all computed time slots have been excluded, THE Calendar_Screen SHALL display a message indicating no availability for the selected date
7. WHEN both a date and a time slot are selected, THE Calendar_Screen SHALL enable navigation to the Confirmation_Screen by displaying a continue or next-step control

---

### Requirement 8: Confirmation Screen — Booking Summary and Form

**User Story:** As a user, I want to review my selected date and time and provide my contact details before confirming, so that I can verify everything is correct and identify myself.

#### Acceptance Criteria

1. THE Confirmation_Screen SHALL display a back button that navigates the user back to the Calendar_Screen while preserving the previously selected date and time slot
2. THE Confirmation_Screen SHALL display the heading "Confirm Your Booking" (configurable via labels)
3. THE Confirmation_Screen SHALL display a summary card with the Primary_Color as background showing the selected date (formatted as weekday, month day, year), selected time slot, and selected timezone
4. THE Confirmation_Screen SHALL display a form with a required Name field (text input, maximum 100 characters) and a required Email field (email input, maximum 254 characters)
5. WHERE config `show_phone_field` is true, THE Confirmation_Screen SHALL display an optional Phone field (tel input, maximum 20 characters) below the Email field
6. WHERE config `show_phone_field` is false, THE Confirmation_Screen SHALL omit the Phone field entirely
7. THE Confirmation_Screen SHALL display a "Confirm Booking" button that is enabled only when the Name field contains at least 1 non-whitespace character AND the Email field contains a value matching a valid email format (contains @ with at least one character before and after)
8. WHEN the user taps the Confirm Booking button, THE Confirmation_Screen SHALL disable the button, display a loading indicator, and call `createAppointment` from Template_SDK with a payload containing: date (ISO format), slot (selected time string), name, email, phone (if provided), timezone, and meeting duration
9. WHILE the `createAppointment` call is in progress, THE Confirmation_Screen SHALL prevent additional taps on the confirm button from triggering duplicate submissions

---

### Requirement 9: Post-Booking Success Behavior

**User Story:** As a user, I want clear confirmation that my meeting is booked and have the WebView close automatically, so that I can return to my conversation seamlessly.

#### Acceptance Criteria

1. WHEN the `createAppointment` call succeeds, THE Confirmation_Screen SHALL display an inline success message at the top of the form area containing the configured `success_message` text (default: "Your meeting has been scheduled!")
2. WHEN the success message is displayed, THE Confirmation_Screen SHALL hide the form fields and the Confirm Booking button, showing only the success message and the booking summary card
3. WHEN the success message is displayed, THE Template SHALL initiate an auto-close countdown of `auto_close_delay` seconds (default: 3 seconds) and close the WebView by posting a close message to the parent window or invoking the platform-specific close mechanism
4. IF the WebView auto-close mechanism is unavailable or fails, THEN THE Template SHALL display a textual instruction to the user indicating they may close the window manually
5. WHEN the success message is displayed, THE Template SHALL fire an analytics `complete` event with a payload containing the selected date, time slot, timezone, and user email
6. IF the `createAppointment` call fails, THEN THE Confirmation_Screen SHALL re-enable the Confirm Booking button, hide the loading indicator, and display an inline error message indicating the booking could not be completed while preserving all user-entered form data

---

### Requirement 10: Error Handling and Demo Mode

**User Story:** As a user, I want the meeting scheduler to handle errors gracefully, so that I am not left on a broken screen.

#### Acceptance Criteria

1. IF the `createAppointment` API call fails, THEN THE Template SHALL display an inline error message on the Confirmation_Screen indicating the booking could not be completed, preserve all user-entered form data, and present the Confirm Booking button in an enabled state so the user can retry without navigating back
2. IF the config endpoint does not respond within 3 seconds, THEN THE Template SHALL render using hardcoded default configuration values (Demo_Mode), allowing all screens and interactions to function without further backend calls; IF the config endpoint responds after the 3-second timeout has elapsed, THEN THE Template SHALL ignore the late response and remain in Demo_Mode
3. IF a network error occurs during any API interaction other than the analytics call itself, THEN THE Template SHALL fire an analytics `error` event with a payload containing the failed endpoint path and the error message string
4. WHILE config is being fetched, THE Template SHALL display a skeleton loading state for no longer than 3 seconds, transitioning to the Calendar_Screen once config is resolved or the timeout elapses
5. IF the analytics endpoint is unreachable, THEN THE Template SHALL silently discard the event without retrying and without affecting the user-facing flow

---

### Requirement 11: Analytics and Event Tracking

**User Story:** As a business owner, I want to track user engagement through the booking funnel, so that I can understand drop-off points and optimize conversions.

#### Acceptance Criteria

1. WHEN the Template mounts and fires its initial render, THE Template SHALL fire a `view` analytics event via Template_SDK `track` containing the templateId and platform from the runtime context
2. WHEN the user selects a date for the first time in a session, THE Template SHALL fire a `start` analytics event including the selected date value
3. WHEN the user navigates from the Calendar_Screen to the Confirmation_Screen, THE Template SHALL fire a step-level tracking event with the `step` property set to "confirmation"
4. WHEN the user successfully completes booking, THE Template SHALL fire a `complete` analytics event with the selected date, time slot, timezone, and user email
5. IF the user closes the WebView before completing the booking, THEN THE Template SHALL fire an `abandon` analytics event with the `lastStep` property set to the last screen the user was on ("calendar" or "confirmation")
6. IF any error occurs during the booking flow, THEN THE Template SHALL fire an `error` analytics event with a `message` property describing the failure reason

---

### Requirement 12: Responsive Layout and Mobile-First Design

**User Story:** As a user on a mobile device, I want the meeting scheduler to adapt to my screen size with a native feel, so that I can complete my booking comfortably on any device.

#### Acceptance Criteria

1. WHEN the viewport width is below 768px, THE Template SHALL render as a single-column layout with the Info_Panel displayed as a compact top header bar (logo, title, duration in a horizontal row) and the interactive panel occupying the full remaining viewport height
2. WHEN the viewport width is 768px or above, THE Template SHALL render as a two-panel side-by-side layout with the Info_Panel as a fixed left column and the interactive panel on the right
3. THE Template SHALL render all interactive screens without horizontal overflow or content truncation at any viewport width between 320px and 1440px
4. THE Template SHALL use touch-optimized interaction targets with a minimum tap area of 44x44 CSS pixels for all interactive elements including calendar date cells, time slot pills, form inputs, and buttons
5. THE Template SHALL achieve a Largest Contentful Paint (LCP) below 2 seconds when tested using a simulated 4G connection profile
6. THE Template SHALL use CSS variables from the SDK theme system (--qt-primary, --qt-text, --qt-bg, --qt-font) for all color, background, and font-family declarations, applying no hardcoded color or font values except within CSS variable fallback defaults
7. WHEN the viewport width is below 768px, THE Template SHALL hide the meeting description text from the header and provide an expandable toggle or omit the description entirely

---

### Requirement 13: Navigation and State Preservation

**User Story:** As a user, I want to navigate back from the confirmation form to the calendar without losing my selections, so that I can change my date or time without starting over.

#### Acceptance Criteria

1. WHEN the user is on the Confirmation_Screen, THE Template SHALL display a back button (arrow or text) that navigates to the Calendar_Screen
2. WHEN the user navigates back from the Confirmation_Screen to the Calendar_Screen, THE Template SHALL preserve the previously selected date, time slot, and timezone so that they remain visually selected when the Calendar_Screen re-renders
3. WHEN the user navigates forward from the Calendar_Screen to the Confirmation_Screen, THE Template SHALL preserve any previously entered form data (name, email, phone) if the user had partially filled the form before navigating back
4. THE Calendar_Screen SHALL prevent forward navigation to the Confirmation_Screen unless both a date and a time slot are selected

---

### Requirement 14: Accessibility

**User Story:** As a user with assistive technology, I want the meeting scheduler to be accessible, so that I can navigate and complete booking independently.

#### Acceptance Criteria

1. THE Template SHALL use semantic HTML elements (header, main, nav, section, button, form, label) throughout all screens
2. THE Template SHALL associate all form inputs (Name, Email, Phone) with visible labels using `<label>` elements or `aria-label` attributes
3. THE Template SHALL ensure all interactive elements are keyboard-navigable using Tab key in logical reading order, with focus indicators that have a minimum contrast ratio of 3:1 against adjacent colors
4. THE Template SHALL ensure all calendar date cells, time slot pills, and navigation buttons are reachable and activatable via keyboard
5. WHEN a calendar date or time slot is selected, THE Template SHALL convey the selected state to assistive technologies using `aria-selected="true"` on the active element
6. THE Template SHALL ensure color contrast ratios meet WCAG 2.1 Level AA standards (minimum 4.5:1 for normal text below 18pt, 3:1 for large text 18pt and above)
7. WHEN the user navigates between the Calendar_Screen and Confirmation_Screen, THE Template SHALL announce the screen change to screen readers using an ARIA live region with `aria-live="polite"`
8. IF the Confirm Booking button is disabled, THEN THE Template SHALL communicate the disabled state to assistive technologies using the `disabled` attribute or `aria-disabled="true"`

---

### Requirement 15: Dark Mode Support

**User Story:** As an admin, I want to enable dark mode for the meeting scheduler, so that users with dark-mode preference get a comfortable visual experience.

#### Acceptance Criteria

1. WHERE config `dark_mode` is true, WHEN the Template loads or config is refreshed, THE Template SHALL call the SDK `applyTheme` with `darkMode: true` and set the `data-theme="dark"` attribute on the root element within 100 milliseconds of config resolution
2. WHERE config `dark_mode` is true, THE Template SHALL ensure all normal-weight text at sizes below 18pt maintains a minimum contrast ratio of 4.5:1 against its background, and all large text (18pt or above, or 14pt bold), icons, and interactive UI component boundaries maintain a minimum contrast ratio of 3:1, per WCAG 2.1 Level AA
3. WHERE config `dark_mode` is false or absent, WHEN the Template loads or config is refreshed, THE Template SHALL render in light mode by applying the configured color values from the admin config and ensuring the `data-theme` attribute is not present on the root element
4. IF the SDK `applyTheme` call fails or throws an error when applying dark mode, THEN THE Template SHALL fall back to light mode rendering using configured colors and shall not display a broken or unstyled layout to the user
