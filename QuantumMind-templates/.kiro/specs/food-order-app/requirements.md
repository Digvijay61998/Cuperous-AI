# Requirements Document

## Introduction

The Food Order App Template is a configurable, JSON-driven WhatsApp WebView mini-app that enables end-users to browse a food menu, customize items, and place orders directly from a WhatsApp chat conversation. The template opens when a user taps a CTA button in the chat, presents a multi-step ordering flow (Intro → Home/Browse → Product Detail → Customization → Payment → Success), and submits the order via the QuantumMind Template SDK. The entire flow is driven by admin-editable configuration — zero code changes are required per-restaurant. The design follows a dark theme with orange accent colors, rounded cards, and prominent food imagery optimized for a 430px mobile viewport.

## Glossary

- **Template**: A self-contained React + Vite WebView application within the QuantumMind Templates monorepo that is built, zipped, and uploaded for hosting
- **Template_SDK**: The shared package (`@quantum/template-sdk`) providing context reading, config fetching, theme application, analytics tracking, and backend actions
- **Config**: A JSON object fetched at runtime from `GET /template/:id/config` containing all admin-editable values (labels, colors, images, menu items, prices, etc.)
- **Manifest**: A `manifest.json` file declaring template metadata and the `templateConfig` schema array (key, type, label, defaultValue, group)
- **Context**: Runtime parameters passed via URL query string (vid, ph, name, bid, cid, src, tid, lead, lang) identifying the visitor, bot, and conversation
- **Order_Flow**: The multi-step user journey: Intro → Home → Product_Detail → Customization → Payment → Success
- **Intro_Screen**: A welcome/onboarding screen showing branding and a CTA to enter the ordering flow
- **Home_Screen**: The main food browsing screen with categories, search, food card grid, and bottom navigation
- **Product_Detail_Screen**: A full-view screen showing food item details, spicy level, portion selection, and order action
- **Customization_Screen**: A screen for configuring toppings, sides, spicy level, and portion for a customizable menu item
- **Payment_Screen**: The checkout screen displaying order summary, taxes, delivery fees, and payment method selection
- **Success_Screen**: A confirmation modal shown after successful payment with receipt details
- **Profile_Screen**: A user account screen displaying editable personal information and order history access
- **Support_Screen**: A live chat interface for customer support communication
- **Menu_Item**: A food product defined in config with id, name, category, price, image, rating, description, and customization options
- **Category**: A grouping of menu items (e.g., All, Combos, Sliders, Classic) defined in config
- **Topping**: An add-on ingredient for customizable items (e.g., Tomato, Onions, Cheese) with optional additional cost
- **Side_Option**: A complementary dish served alongside the main item (e.g., Fries, Coleslaw, Salad)
- **Bottom_Navigation**: A fixed navigation bar at the screen bottom with icons for Home, Profile, Cart (center FAB), Messages, and Favorites
- **WebView**: The in-app browser frame within WhatsApp where the template renders
- **CTA**: Call-to-action button
- **RTL**: Right-to-left text direction for languages such as Arabic and Hebrew
- **Demo_Mode**: A fallback operational state where the template renders with default config and simulates successful ordering when the backend is unreachable
- **FAB**: Floating Action Button — the elevated center button in the bottom navigation

## Requirements

### Requirement 1: Template Scaffolding and Manifest

**User Story:** As a template developer, I want the food-order-app to follow the established monorepo conventions, so that it integrates with the existing build pipeline and admin tooling.

#### Acceptance Criteria

1. THE Template SHALL include a `manifest.json` at its root declaring name as "Food Order App", description, industry as "food", category as "ordering", tags (at least "food", "order", "delivery", "restaurant"), supportedLanguages (at least "en"), supportsDarkMode as true, estimatedDuration, and a templateConfig array containing at least 1 entry where each entry defines key, type, label, defaultValue, and group
2. THE Template SHALL declare `@quantum/template-sdk` as a workspace dependency and import context, config, theme, analytics, and actions from the SDK
3. THE Template SHALL reside in the `templates/food-order-app/` directory and include a root `index.html` entry point, so that it is discoverable by the monorepo workspace and build tooling
4. THE Template SHALL be buildable via Vite producing a `dist/` folder with `index.html` at the root, and TypeScript compilation (`tsc --noEmit`) SHALL complete with zero errors
5. THE Template SHALL be packageable via the existing `build-and-zip.ts` tooling into a single ZIP file under `releases/food-order-app.zip` with `index.html` located at the archive root
6. THE Template SHALL produce a production bundle where the sum of all files in `dist/` is below 200 KB when gzip-compressed

---

### Requirement 2: Configuration Loading and Defaults

**User Story:** As an admin, I want to configure the food ordering template entirely through JSON without code changes, so that the same template serves restaurants, cafes, food trucks, and other food businesses.

#### Acceptance Criteria

1. WHEN the Template loads, THE Config_Loader SHALL call `loadConfig` from Template_SDK to fetch admin-editable configuration values and SHALL complete the config fetch within 10 seconds of page load
2. IF the config fetch fails, the template ID cannot be resolved, or the fetch exceeds a 3-second timeout, THEN THE Config_Loader SHALL fall back to default configuration values defined in the template source and SHALL render the template using those defaults without displaying an error to the end user (Demo_Mode)
3. THE Template SHALL expose a templateConfig schema in manifest.json covering: brand_name, brand_logo, hero_image, primary_color, secondary_color, accent_color, text_color, background_color, font_family, dark_mode, categories, menu_items, toppings, side_options, delivery_fee, tax_rate, estimated_delivery_time, currency, payment_methods, success_message, success_cta_text, and labels, where each entry specifies a key, type, label, defaultValue, and group
4. WHEN config values are loaded and contain only a subset of configurable keys, THE Config_Loader SHALL merge the fetched values with the template-defined defaults so that every key resolves to either the fetched value or the default value
5. WHEN config values are loaded, THE Template SHALL apply theme tokens (primaryColor, secondaryColor, accentColor, textColor, backgroundColor, fontFamily, darkMode) via the SDK `applyTheme` function as CSS custom properties on the document root element
6. THE Template SHALL render all user-facing static text (headings, button labels, placeholder text, success messages, and section titles) from the `labels` config object, and IF a label key is missing from the config, THEN THE Template SHALL display the corresponding default value defined in the template source

---

### Requirement 3: Context Initialization and Pre-fill

**User Story:** As a WhatsApp user opening the food ordering template, I want my name and contact information pre-filled automatically, so that I can order faster without re-entering information.

#### Acceptance Criteria

1. WHEN the Template mounts, THE Context_Reader SHALL call `getContext` from Template_SDK to extract visitor identity (visitorId, phone, name, lang) from URL query parameters and make the resulting context object available to all child components within 500 ms of mount
2. WHEN context contains a name value that is a non-empty string of at most 100 characters, THE Payment_Screen SHALL pre-fill the customer name in the order details
3. WHEN context contains a phone value that is a non-empty string of at most 20 characters, THE Payment_Screen SHALL associate the phone number with the order submission
4. IF context does not contain a name value or the name value is empty, THEN THE Template SHALL proceed without pre-filling customer name fields
5. WHEN context contains a lang value, THE Template SHALL apply the corresponding language labels from config and set the document direction attribute to RTL for languages whose lang value is one of ["ar", "he", "fa", "ur"], and to LTR for all other lang values
6. IF the `getContext` call fails to parse URL parameters, THEN THE Template SHALL fall back to default values (lang "en", empty name, empty phone) and render the template in its default LTR English state

---

### Requirement 4: Intro Screen

**User Story:** As a user, I want to see a branded welcome screen when I open the food ordering link, so that I know which restaurant I am ordering from and feel invited to start browsing.

#### Acceptance Criteria

1. THE Intro_Screen SHALL display the brand logo (from config `brand_logo`) centered on the screen; IF `brand_logo` is empty or absent, THEN THE Intro_Screen SHALL display a fallback text element showing the brand name from config `brand_name`
2. THE Intro_Screen SHALL display the brand name (from config `brand_name`, default: "Foodgo") as a prominent heading
3. THE Intro_Screen SHALL display a hero background image (from config `hero_image`) with food imagery; IF `hero_image` is empty, THEN THE Intro_Screen SHALL display a gradient background using the primary and accent colors
4. THE Intro_Screen SHALL display a tagline text (from config `labels.intro_tagline`, default: "Delicious food delivered to your door") below the brand name
5. THE Intro_Screen SHALL display a primary CTA button with text from config `labels.get_started` (default: "Order Now") that navigates the user to the Home_Screen
6. WHEN the Intro_Screen renders, THE Template SHALL fire an analytics `view` event via Template_SDK `track` containing the templateId and platform from the runtime context

---

### Requirement 5: Home Screen — Header and Search

**User Story:** As a user, I want to see a branded header with search capability on the home screen, so that I can quickly find specific food items.

#### Acceptance Criteria

1. THE Home_Screen SHALL display a header containing the brand name (from config `brand_name`), a greeting text (from config `labels.home_greeting`, default: "Order your favourite food!"), and a profile avatar icon that navigates to the Profile_Screen
2. THE Home_Screen SHALL display a search input field with placeholder text (from config `labels.search_placeholder`, default: "Search food...") and a filter icon button
3. WHEN the user types text into the search field, THE Home_Screen SHALL filter the displayed menu items to show only items whose name contains the search text (case-insensitive match) within 300 milliseconds of the last keystroke
4. WHEN the search field is cleared, THE Home_Screen SHALL restore the full menu item listing for the currently selected category
5. IF the search query returns no matching items, THEN THE Home_Screen SHALL display an empty-state message indicating no items match the search

---

### Requirement 6: Home Screen — Category Navigation

**User Story:** As a user, I want to browse food by category, so that I can quickly find the type of food I am looking for.

#### Acceptance Criteria

1. THE Home_Screen SHALL render category tabs as a horizontal scrollable list of pill-shaped buttons based on the `categories` config array, with an "All" category prepended that shows all menu items regardless of category
2. WHEN the Home_Screen first renders, THE Home_Screen SHALL select the "All" category by default and display all available menu items
3. WHEN a user taps a category tab, THE Home_Screen SHALL filter the displayed menu items to show only items matching the selected category, SHALL visually highlight the active tab using the accent color, and SHALL reset any active search query
4. THE Home_Screen SHALL render each category tab displaying the category name, and the active tab SHALL be visually distinguished with a filled background using the accent color while inactive tabs use a transparent or muted background

---

### Requirement 7: Home Screen — Food Card Grid

**User Story:** As a user, I want to browse food items displayed as visual cards with key information, so that I can quickly decide what to order.

#### Acceptance Criteria

1. THE Home_Screen SHALL render menu items in a 2-column grid layout where each card displays: food image (with a placeholder gradient if image is absent), food name (truncated with ellipsis beyond 40 characters), star rating (numeric, 1.0–5.0, displayed with a yellow star icon), and a heart/favorite icon button
2. WHEN a user taps a food card, THE Home_Screen SHALL navigate to the Product_Detail_Screen for the selected menu item
3. WHEN a user taps the heart icon on a food card, THE Home_Screen SHALL toggle the favorite state for that item and visually indicate the favorited state with a filled heart icon using the accent color
4. THE Home_Screen SHALL render food card images with rounded corners (minimum 12px border-radius) and soft drop shadows consistent with the dark theme design
5. IF the `menu_items` config array is empty, THEN THE Home_Screen SHALL display an empty-state message indicating no menu items are available

---

### Requirement 8: Home Screen — Bottom Navigation

**User Story:** As a user, I want persistent navigation at the bottom of the screen, so that I can quickly access different sections of the app.

#### Acceptance Criteria

1. THE Home_Screen SHALL display a fixed Bottom_Navigation bar at the screen bottom containing five navigation targets: Home icon, Profile icon, Cart FAB (center, elevated), Messages icon, and Favorites icon
2. THE Bottom_Navigation SHALL render the center Cart FAB as an elevated circular button (minimum 56px diameter) visually distinct from the other navigation icons, using the accent color as its background
3. WHEN a user taps the Profile icon, THE Template SHALL navigate to the Profile_Screen
4. WHEN a user taps the Messages icon, THE Template SHALL navigate to the Support_Screen
5. WHEN a user taps the Favorites icon, THE Home_Screen SHALL filter the food card grid to display only favorited items; WHEN tapped again, THE Home_Screen SHALL restore the previous category view
6. THE Bottom_Navigation SHALL visually indicate the currently active section by highlighting the corresponding icon with the accent color

---

### Requirement 9: Product Detail Screen

**User Story:** As a user, I want to see full details of a food item including description, rating, and delivery time, so that I can make an informed ordering decision.

#### Acceptance Criteria

1. THE Product_Detail_Screen SHALL display a header with a back arrow button (navigating to the Home_Screen) and a search icon button
2. THE Product_Detail_Screen SHALL display a large food image (from the selected Menu_Item image field) with a subtle drop shadow effect
3. THE Product_Detail_Screen SHALL display the food name, star rating (with yellow star icon and numeric value), and estimated delivery time (from config `estimated_delivery_time`, default: "24 mins")
4. THE Product_Detail_Screen SHALL display a description text (from the selected Menu_Item description field) below the title and rating section
5. THE Product_Detail_Screen SHALL display a spicy level slider control with labels "Mild" and "Hot" at the extremes, allowing the user to select a spice preference on a continuous scale
6. THE Product_Detail_Screen SHALL display a portion counter with decrement button (-), current count (minimum 1, maximum 20), and increment button (+)
7. THE Product_Detail_Screen SHALL display the total price (item price multiplied by portion count) formatted with the config `currency` symbol, and an "ORDER NOW" button (text from config `labels.order_now`, default: "ORDER NOW")
8. WHEN the user taps the "ORDER NOW" button, THE Product_Detail_Screen SHALL add the item (with selected spicy level and portion count) to the order and navigate to the Payment_Screen
9. WHERE the selected Menu_Item has customization options (toppings or sides available), WHEN the user taps the "ORDER NOW" button, THE Product_Detail_Screen SHALL navigate to the Customization_Screen instead of the Payment_Screen

---

### Requirement 10: Product Customization Screen

**User Story:** As a user, I want to customize my food item with toppings and sides, so that I get exactly what I want.

#### Acceptance Criteria

1. THE Customization_Screen SHALL display a header with a back arrow button (navigating to the Product_Detail_Screen) and a search icon button
2. THE Customization_Screen SHALL display the food image and a title "Customize Your [item name]" using the selected Menu_Item name
3. THE Customization_Screen SHALL display a spicy level slider control identical in function to the Product_Detail_Screen slider
4. THE Customization_Screen SHALL display a portion counter identical in function to the Product_Detail_Screen counter
5. THE Customization_Screen SHALL display a "Toppings" section as a horizontal scrollable list of topping options (from config `toppings` array), where each option shows: topping image, topping name, and a checkbox for selection
6. THE Customization_Screen SHALL display a "Sides" section as a horizontal scrollable list of side options (from config `side_options` array), where each option shows: side image, side name, and a checkbox for selection
7. WHEN a user taps a topping or side option, THE Customization_Screen SHALL toggle the selection state of that option and update the visual checkbox indicator
8. THE Customization_Screen SHALL display the total price (base item price multiplied by portion count, plus any additional costs from selected toppings and sides) formatted with the config `currency` symbol, and an "ORDER NOW" button
9. WHEN the user taps the "ORDER NOW" button, THE Customization_Screen SHALL add the customized item (with spicy level, portion count, selected toppings, and selected sides) to the order and navigate to the Payment_Screen

---

### Requirement 11: Payment Screen

**User Story:** As a user, I want to review my order totals and select a payment method, so that I can complete my food order.

#### Acceptance Criteria

1. THE Payment_Screen SHALL display a header with a back arrow button (navigating to the previous screen) and a search icon button
2. THE Payment_Screen SHALL display an order summary section showing: subtotal (labeled "Order"), tax amount (computed as subtotal multiplied by config `tax_rate`, default: 0.1), delivery fee (from config `delivery_fee`, default: 2.00), and total (subtotal + tax + delivery fee)
3. THE Payment_Screen SHALL display the estimated delivery time (from config `estimated_delivery_time`, default: "24 mins")
4. THE Payment_Screen SHALL display a "Payment Methods" section with radio button options for each method in config `payment_methods` array (default: ["Credit card", "Debit card"]), with the first method pre-selected
5. THE Payment_Screen SHALL display a "Save card details for future payments" checkbox option
6. THE Payment_Screen SHALL display the total price and a "Pay Now" button (text from config `labels.pay_now`, default: "Pay Now")
7. WHEN the user taps the "Pay Now" button, THE Payment_Screen SHALL disable the button, display a loading indicator, and call `makePayment` from Template_SDK with the order payload (items, quantities, customizations, total, payment method, customer details)
8. IF the `makePayment` call succeeds, THEN THE Payment_Screen SHALL navigate to the Success_Screen
9. IF the `makePayment` call fails, THEN THE Payment_Screen SHALL re-enable the "Pay Now" button, hide the loading indicator, and display an inline error message indicating the payment could not be processed
10. WHILE the `makePayment` call is in progress, THE Payment_Screen SHALL prevent additional taps on the "Pay Now" button from triggering duplicate submissions

---

### Requirement 12: Success Screen

**User Story:** As a user, I want to see a clear payment confirmation after ordering, so that I know my order has been placed successfully.

#### Acceptance Criteria

1. WHEN payment is submitted successfully, THE Success_Screen SHALL display a centered modal overlay with a green checkmark circle icon indicating success
2. THE Success_Screen SHALL display a "Success!" heading (from config `labels.success_heading`, default: "Success!")
3. THE Success_Screen SHALL display a confirmation message (from config `success_message`, default: "Your payment was successful. A receipt for this purchase has been sent to your email.")
4. THE Success_Screen SHALL display a "Go Back" button (text from config `success_cta_text`, default: "Go Back") that signals the user to close the WebView or navigates back to the Home_Screen
5. WHEN the Success_Screen renders, THE Template SHALL fire an analytics `complete` event with a payload containing the order items, total price, and payment method

---

### Requirement 13: Profile Screen

**User Story:** As a user, I want to view and edit my profile information, so that my delivery details are accurate for future orders.

#### Acceptance Criteria

1. THE Profile_Screen SHALL display a profile photo placeholder (circular, with initials fallback when no photo is available)
2. THE Profile_Screen SHALL display editable fields for: Name (pre-filled from context if available), Email, Delivery Address, and Password (masked)
3. THE Profile_Screen SHALL display navigation links for "Payment Details" and "Order History" sections
4. THE Profile_Screen SHALL display an "Edit Profile" button that enables editing of the profile fields
5. THE Profile_Screen SHALL display a "Log out" button that navigates back to the Intro_Screen
6. THE Profile_Screen SHALL display a back navigation mechanism to return to the Home_Screen

---

### Requirement 14: Customer Support Screen

**User Story:** As a user, I want to access live chat support within the app, so that I can get help with my order without leaving the food ordering experience.

#### Acceptance Criteria

1. THE Support_Screen SHALL display a chat interface with message bubbles visually distinguished between sent messages (user) and received messages (support agent) using different alignment and background colors
2. THE Support_Screen SHALL display avatar circles adjacent to each message bubble to identify the sender
3. THE Support_Screen SHALL display timestamps below or adjacent to message bubbles indicating when each message was sent
4. THE Support_Screen SHALL display a message input field at the bottom with a send button
5. WHEN the user types a message and taps the send button, THE Support_Screen SHALL display the message as a sent bubble and clear the input field
6. THE Support_Screen SHALL display a back navigation mechanism to return to the Home_Screen

---

### Requirement 15: Step Navigation and Flow Management

**User Story:** As a user, I want seamless navigation between screens with the ability to go back, so that I can change my selections at any point before paying.

#### Acceptance Criteria

1. THE Template SHALL implement the Order_Flow as a sequential progression: Intro → Home → Product_Detail → Customization (optional) → Payment → Success
2. WHILE the user is on any screen after the Intro_Screen and before the Success_Screen, THE Template SHALL provide a back navigation mechanism (back arrow button) that navigates to the immediately preceding screen
3. WHEN the user navigates back, THE Template SHALL preserve all previously entered selections (selected items, quantities, spicy levels, toppings, sides, payment method) so that they remain populated when the user returns forward
4. WHEN the user reaches the Success_Screen, THE Template SHALL hide the back navigation button and prevent backward navigation to the Payment_Screen
5. THE Template SHALL apply smooth CSS transitions between screens (fade or slide animations) with a duration between 200ms and 400ms

---

### Requirement 16: Error Handling and Demo Mode

**User Story:** As a user, I want the food ordering template to handle errors gracefully, so that I am not left on a broken screen.

#### Acceptance Criteria

1. IF the `makePayment` API call fails, THEN THE Template SHALL display an inline error message on the Payment_Screen indicating the payment could not be processed, preserve all user-entered data, and present a retry option that re-submits the same request without requiring the user to navigate back
2. IF the config endpoint does not respond within 3 seconds, THEN THE Template SHALL render using hardcoded default configuration values (Demo_Mode), allowing all screens and transitions to be navigated without further backend calls; IF the config endpoint responds after the 3-second timeout has elapsed, THEN THE Template SHALL ignore the late response and remain in Demo_Mode
3. IF a network error occurs during any API interaction other than the analytics call itself, THEN THE Template SHALL fire an analytics `error` event with a payload containing the failed endpoint path and the error message string
4. WHILE config is being fetched, THE Template SHALL display a splash/loading state (brand logo with food imagery background) for no longer than 3 seconds, transitioning to the Intro_Screen once config is resolved or the timeout elapses
5. IF the analytics endpoint is unreachable, THEN THE Template SHALL silently discard the event without retrying and without affecting the user-facing flow

---

### Requirement 17: Analytics and Event Tracking

**User Story:** As a restaurant owner, I want to track user engagement through the ordering funnel, so that I can understand drop-off points and optimize conversions.

#### Acceptance Criteria

1. WHEN the Template mounts and fires its initial render, THE Template SHALL fire a `view` analytics event via Template_SDK `track` containing the templateId and platform from the runtime context
2. WHEN the user adds a first item to the order in a session, THE Template SHALL fire a `start` analytics event including the selected item identifier and category
3. WHEN the user navigates between screens, THE Template SHALL fire a step-level tracking event with the `step` property set to one of the defined screen names: `intro`, `home`, `product_detail`, `customization`, `payment`, or `success`
4. WHEN the user successfully completes payment, THE Template SHALL fire a `complete` analytics event with the order items, total price, and payment method
5. IF the user closes the WebView before reaching the Success_Screen, THEN THE Template SHALL fire an `abandon` analytics event with the `lastStep` property set to the last screen the user was on
6. IF any error occurs during the ordering flow, THEN THE Template SHALL fire an `error` analytics event with a `message` property describing the failure reason
7. THE Template SHALL fire each analytics event exactly once per triggering action to prevent duplicate tracking data

---

### Requirement 18: Mobile-First Layout and Performance

**User Story:** As a user on a mobile device with varying network quality, I want the food ordering template to load fast and feel native, so that I can complete my order without frustration.

#### Acceptance Criteria

1. THE Template SHALL render all screens without horizontal overflow or content truncation at any viewport width between 320px and 480px
2. THE Template SHALL use touch-optimized interaction targets with a minimum tap area of 44x44 CSS pixels for all interactive elements including buttons, icons, form inputs, and selectable cards
3. THE Template SHALL achieve a Largest Contentful Paint (LCP) below 2 seconds when tested using a simulated 4G connection profile
4. THE Template SHALL produce a total production bundle (all JS + CSS + assets) below 200 KB gzipped
5. THE Template SHALL use CSS variables from the SDK theme system for all color, background, and font-family declarations, applying no hardcoded color or font values except within CSS variable fallback defaults
6. WHEN the viewport width exceeds 480px, THE Template SHALL constrain the layout to a maximum width of 430px centered horizontally to match the Figma design viewport
7. THE Template SHALL implement the dark theme as the default visual mode with a dark background color (default: "#2D2D3A") and light text color (default: "#FFFFFF"), with orange accent color (default: "#FF6B00") for interactive elements and highlights

---

### Requirement 19: Visual Design Consistency

**User Story:** As a user, I want the food ordering app to have a polished, consistent visual design matching the Figma mockup, so that the experience feels professional and trustworthy.

#### Acceptance Criteria

1. THE Template SHALL render food cards with rounded corners (minimum 16px border-radius), soft box shadows, and a semi-transparent dark background consistent with the Figma design
2. THE Template SHALL render the Bottom_Navigation with a curved/notched cutout accommodating the center FAB button, using a dark surface color distinct from the page background
3. THE Template SHALL render star ratings using a yellow/gold star icon (color: "#FFD700") adjacent to the numeric rating value
4. THE Template SHALL render the spicy level slider with a gradient track from green (mild) to red (hot) with a circular thumb control
5. THE Template SHALL render category pills with rounded-full corners, where the active pill uses the accent color fill and inactive pills use a muted/transparent background
6. THE Template SHALL render the success checkmark as a circular green icon (minimum 64px diameter) centered within the success modal

---

### Requirement 20: Internationalization and RTL Support

**User Story:** As an admin serving multilingual customers, I want to configure all labels in any language and support RTL layouts, so that the template works for Arabic, Hebrew, and other RTL audiences.

#### Acceptance Criteria

1. THE Template SHALL render all user-facing text strings (headings, button labels, field labels, status messages) from the config `labels` object, falling back to the English default value defined in the manifest `templateConfig` when a label key is absent or empty in the config
2. WHEN the context `lang` parameter is set to an RTL language code (ar, he, fa, ur), THE Template SHALL set the `dir` attribute on the document root element to `rtl` and apply CSS logical properties such that text alignment, reading order, and flex/grid layout direction are reversed
3. IF the context `lang` parameter is not provided or is empty, THEN THE Template SHALL default to `en` and render in LTR direction
4. THE Template SHALL format currency values using the `Intl.NumberFormat` API with the locale derived from the `lang` context parameter and the currency code specified in the config `currency` field, displaying a minimum of 2 and maximum of 2 fraction digits
5. THE Template SHALL format all price displays consistently across all screens (Home_Screen cards, Product_Detail_Screen, Customization_Screen, Payment_Screen) using the same formatting function

---

### Requirement 21: Dark Mode and Theming

**User Story:** As an admin, I want the food ordering template to support both dark and light modes, so that the template adapts to different branding preferences.

#### Acceptance Criteria

1. WHERE config `dark_mode` is true (default), WHEN the Template loads, THE Template SHALL call the SDK `applyTheme` with `darkMode: true` and set the `data-theme="dark"` attribute on the root element within 100 milliseconds of config resolution
2. WHERE config `dark_mode` is true, THE Template SHALL ensure all text maintains a minimum contrast ratio of 4.5:1 against its background for normal text and 3:1 for large text, icons, and interactive UI component boundaries per WCAG 2.1 Level AA
3. WHERE config `dark_mode` is false, WHEN the Template loads, THE Template SHALL render in light mode by applying the configured color values and ensuring the `data-theme` attribute is not present on the root element
4. IF the SDK `applyTheme` call fails or throws an error, THEN THE Template SHALL fall back to the default dark theme using hardcoded CSS variable values and SHALL not display a broken or unstyled layout

---

### Requirement 22: Accessibility

**User Story:** As a user with assistive technology, I want the food ordering template to be accessible, so that I can browse and order food independently.

#### Acceptance Criteria

1. THE Template SHALL use semantic HTML elements (header, main, nav, section, button, form, label) throughout all screens
2. THE Template SHALL associate all form inputs (search field, portion counter, message input) with visible labels using `<label>` elements or `aria-label` attributes
3. THE Template SHALL ensure all interactive elements are keyboard-navigable using Tab key in logical reading order, with focus indicators that have a minimum contrast ratio of 3:1 against adjacent colors
4. WHEN the user navigates to a new screen, THE Template SHALL announce the new screen heading text to screen readers using an ARIA live region with `aria-live="polite"`
5. WHEN a category tab, topping, side option, or payment method is selected, THE Template SHALL convey the selected state to assistive technologies using `aria-pressed` or `aria-selected` attributes
6. THE Template SHALL provide `alt` text for all food images; IF a Menu_Item lacks a description for alt text, THEN THE Template SHALL use the item name as the alt text value
7. IF a navigation button ("ORDER NOW", "Pay Now") is disabled, THEN THE Template SHALL communicate the disabled state to assistive technologies using the `disabled` attribute or `aria-disabled="true"`
