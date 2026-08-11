# Requirements Document

## Introduction

The eCommerce Catalog Template is a configurable, JSON-driven WhatsApp WebView mini-app that enables end-users to browse products, select sizes/variants, add items to a cart, and place orders directly from a WhatsApp chat conversation. The template opens when a user taps a product link in the chat, presents a streamlined 5-step shopping flow (Intro → Browse Products → Product Detail → Cart/Checkout → Confirmation), and submits the order via the QuantumMind Template SDK. The entire flow is driven by admin-editable configuration — zero code changes are required per-business.

The design follows the Figma reference (eCommerce App UI Kit) with a light theme, white background (#FFFFFF), dark text (#000000), rounded cards with subtle shadows, 375px mobile viewport, 2-column product grid, horizontal scrollable category icons with labels, star ratings (★), price display with original price strikethrough and discount percentage, product image carousels with dot indicators, and size selection pill buttons.

## Glossary

- **Template**: A self-contained React + Vite WebView application within the QuantumMind Templates monorepo that is built, zipped, and uploaded for hosting
- **Template_SDK**: The shared package (`@quantum/template-sdk`) providing context reading, config fetching, theme application, analytics tracking, and backend actions
- **Config**: A JSON object fetched at runtime from `GET /template/:id/config` containing all admin-editable values
- **Manifest**: A `manifest.json` file declaring template metadata and the `templateConfig` schema array
- **Context**: Runtime parameters passed via URL query string identifying the visitor, bot, and conversation
- **Shopping_Flow**: The 5-step user journey: Intro → Browse_Products → Product_Detail → Cart_Checkout → Confirmation
- **Intro_Screen**: The first screen showing hero product image with gradient overlay, brand tagline, subtitle, and a "Get Started" CTA button
- **Browse_Products_Screen**: The main catalog screen with search bar, "All Featured" header with filter/sort pills, horizontal category icon row, promotional banner with discount text, "Deal of the day" section headers, and 2-column product card grid
- **Product_Detail_Screen**: The full product view with image carousel (dot indicators, wishlist/nav arrows), size selection pills (6UK–10UK), star ratings with review count, pricing with strikethrough and discount %, product description, "Go to Cart" and "Buy Now" buttons, and delivery estimate
- **Cart_Checkout_Screen**: The order review screen with delivery address card, shopping list (product image, name, variations/colors, sizes, ratings, prices, quantities), order payment details (order amounts, delivery fee, total), and "Proceed to Payment" button
- **Confirmation_Screen**: The success screen with star celebration graphics, "Payment done successfully" message, and "Continue" CTA button
- **Product**: A purchasable item defined in config with id, categoryId, name, price, originalPrice, discount, image, images (carousel array), rating, reviewCount, sizes, colors, description, and deliveryEstimate
- **Category**: A grouping of products defined in config with id, name, and icon (circular icon with label below)
- **Cart**: An in-memory map of product ID + selected size to quantity representing items the user intends to purchase
- **WebView**: The in-app browser frame within WhatsApp where the template renders
- **CTA**: Call-to-action button
- **RTL**: Right-to-left text direction for languages such as Arabic and Hebrew
- **Demo_Mode**: A fallback operational state where the template renders with default config and simulates successful order placement when the backend is unreachable
- **Promotional_Banner**: A configurable visual banner displaying deals (e.g., "50-40% OFF") with "Shop Now" pill button

## Requirements

### Requirement 1: Template Scaffolding and Manifest

**User Story:** As a template developer, I want the ecommerce-catalog template to follow the established monorepo conventions, so that it integrates with the existing build pipeline and admin tooling.

#### Acceptance Criteria

1. THE Template SHALL include a `manifest.json` at its root declaring name as "eCommerce Catalog", description, industry as "ecommerce", category as "ordering", tags (at least "ecommerce", "catalog", "shopping", "products"), supportedLanguages (at least "en"), supportsDarkMode as true, estimatedDuration as "3 minutes", and a templateConfig array where each entry defines key, type, label, defaultValue, and group
2. THE Template SHALL declare `@quantum/template-sdk` as a workspace dependency and import context, config, theme, analytics, and actions from the SDK
3. THE Template SHALL reside in the `templates/ecommerce-catalog/` directory and include a root `index.html` entry point
4. THE Template SHALL be buildable via the shared Vite config producing a `dist/` folder with `index.html` at the root, and TypeScript compilation (`tsc --noEmit`) SHALL complete with zero errors
5. THE Template SHALL be packageable via the existing `build-and-zip.ts` tooling into a single ZIP file under `releases/ecommerce-catalog.zip` with `index.html` located at the archive root
6. THE Template SHALL produce a production bundle where the sum of all files in `dist/` is below 200 KB when gzip-compressed

---

### Requirement 2: Configuration Loading and Defaults

**User Story:** As an admin, I want to configure the template entirely through JSON without code changes, so that the same template serves shoe stores, clothing brands, electronics retailers, and any eCommerce business.

#### Acceptance Criteria

1. WHEN the Template loads, THE Config_Loader SHALL call `loadConfig` from Template_SDK to fetch admin-editable configuration values and SHALL complete the config fetch within 3 seconds of page load
2. IF the config fetch fails or exceeds the 3-second timeout, THEN THE Config_Loader SHALL fall back to default configuration values defined in the template source and render in Demo_Mode without displaying an error to the end user
3. THE Template SHALL expose a templateConfig schema in manifest.json covering: brand_name, brand_logo, hero_image, tagline, subtitle, primary_color, secondary_color, accent_color, text_color, background_color, font_family, dark_mode, categories, products, delivery_fee, tax_rate, estimated_delivery_time, currency, promotional_banner, success_message, success_cta_text, and labels
4. WHEN config values are loaded and contain only a subset of configurable keys, THE Config_Loader SHALL merge the fetched values with the template-defined defaults so that every key resolves to either the fetched value (if present and non-null) or the default value, and no key is ever undefined or null
5. WHEN config values are loaded, THE Template SHALL apply theme tokens via the SDK `applyTheme` function as CSS custom properties on the document root element
6. THE Template SHALL render all user-facing static text from the `labels` config object, and IF a label key is missing, THEN THE Template SHALL display the corresponding default value

---

### Requirement 3: Context Initialization and Pre-fill

**User Story:** As a WhatsApp user opening the shopping template, I want my name and phone number pre-filled automatically, so that I can checkout faster.

#### Acceptance Criteria

1. WHEN the Template mounts, THE Context_Reader SHALL call `getContext` from Template_SDK to extract visitor identity (visitorId, phone, name, lang) from URL query parameters
2. WHEN context contains a name value, THE Cart_Checkout_Screen SHALL pre-fill the customer name field with the context name and the field SHALL remain editable
3. WHEN context contains a phone value, THE Cart_Checkout_Screen SHALL pre-fill the customer phone field with the context phone and the field SHALL remain editable
4. IF context does not contain a name or phone value, THEN THE Cart_Checkout_Screen SHALL display the corresponding field empty with placeholder text
5. WHEN context contains a lang value, THE Template SHALL set the document direction attribute to RTL for lang values in ["ar", "he", "fa", "ur"], and to LTR for all other lang values
6. IF the `getContext` call fails, THEN THE Template SHALL fall back to default values (lang "en", empty name, empty phone) and render in LTR English

---

### Requirement 4: Intro Screen

**User Story:** As a user, I want to see a branded landing page when I open the shopping link, so that I know which store I am browsing.

#### Acceptance Criteria

1. THE Intro_Screen SHALL display a full-bleed hero product image from config `hero_image` with a dark gradient overlay at the bottom half of the screen
2. THE Intro_Screen SHALL display the configured `tagline` text (default: "You want Authentic, here you go!") as a large bold heading over the gradient overlay
3. THE Intro_Screen SHALL display the configured `subtitle` text (default: "Find it here, buy it now!") below the tagline in smaller regular-weight text
4. THE Intro_Screen SHALL display a rounded primary CTA button with text from config `labels.get_started` (default: "Get Started") that navigates the user to the Browse_Products_Screen
5. IF `hero_image` is empty, THEN THE Intro_Screen SHALL display the hero section with a gradient background using the primary and secondary colors
6. WHEN the Intro_Screen renders, THE Template SHALL fire an analytics `view` event via Template_SDK `track` with step name "intro"

---

### Requirement 5: Browse Products Screen — Search and Categories

**User Story:** As a user, I want to search for products and filter by category, so that I can quickly find what I am looking for.

#### Acceptance Criteria

1. THE Browse_Products_Screen SHALL display a search bar with a search icon on the left, placeholder text from config `labels.search_placeholder` (default: "Search any Product.."), and a microphone icon on the right (decorative)
2. WHEN the user enters text in the search bar, THE Browse_Products_Screen SHALL filter displayed products to show only products whose name contains the search text (case-insensitive match)
3. WHEN search text matches zero products, THE Browse_Products_Screen SHALL display an empty-state message from config `labels.no_search_results` (default: "No products match your search")
4. WHEN the user clears the search bar, THE Browse_Products_Screen SHALL restore the full product list for the currently selected category
5. THE Browse_Products_Screen SHALL display an "All Featured" section header with horizontal filter/sort pill buttons (e.g., "Sort", "Filter") aligned to the right
6. THE Browse_Products_Screen SHALL render a horizontal scrollable row of category icons based on the `categories` config array, where each category displays as a circular icon container with the category name label below
7. WHEN the user taps a category icon, THE Browse_Products_Screen SHALL filter products to show only products matching the selected categoryId and visually highlight the active category

---

### Requirement 6: Browse Products Screen — Promotional Banner

**User Story:** As an admin, I want to display a configurable promotional banner with discount information, so that I can highlight current offers to drive sales.

#### Acceptance Criteria

1. WHERE config `promotional_banner` is defined with a non-empty `title` field, THE Browse_Products_Screen SHALL display a rounded promotional banner card with background image or gradient, containing the discount title (default: "50-40% OFF"), subtitle text (default: "Now in (product)"), secondary text (default: "All colours"), and a "Shop Now" pill button
2. THE Promotional_Banner SHALL display pagination dots below the banner indicating the current banner position (supporting multiple banners via horizontal scroll)
3. WHERE config `promotional_banner` is not defined or has an empty `title` field, THE Browse_Products_Screen SHALL omit the promotional banner section

---

### Requirement 7: Browse Products Screen — Product Grid

**User Story:** As a user, I want to browse products in a visual grid with key information at a glance, so that I can make quick purchasing decisions.

#### Acceptance Criteria

1. THE Browse_Products_Screen SHALL display a "Deal of the day" section header with a timer icon and "View all" link aligned to the right, above each product grid section
2. THE Browse_Products_Screen SHALL render products in a 2-column grid layout where each product card displays: product image with rounded corners, product name (truncated with ellipsis beyond 40 characters), short description text, sale price formatted with the config `currency`, original price with strikethrough formatting, discount percentage text (e.g., "50% Off"), and star rating display
3. WHEN a product card contains a discount value greater than 0, THE Product_Card SHALL display both the original price with strikethrough and the discount percentage text in a colored accent
4. WHEN a product card has no image URL, THE Product_Card SHALL display a gradient placeholder background with rounded corners
5. THE Product_Card SHALL display an "Add to Cart" circular icon button overlaid on the bottom-right of the product image that adds 1 unit of the product to the Cart
6. WHEN the user taps the "Add to Cart" button on a product card, THE Browse_Products_Screen SHALL increment the cart quantity for that product by 1 and update the cart footer
7. IF the products config array is empty, THEN THE Browse_Products_Screen SHALL display an empty-state message from config `labels.no_products` (default: "No products available")

---

### Requirement 8: Browse Products Screen — Special Offers and Cart Footer

**User Story:** As a user, I want to see special offers and my cart summary while browsing, so that I know about deals and can proceed to checkout.

#### Acceptance Criteria

1. THE Browse_Products_Screen SHALL display a "Special Offers" banner card with an emoji icon (😱), descriptive offer text, and a thumbnail image aligned to the left
2. WHILE the Cart contains at least 1 item, THE Browse_Products_Screen SHALL display a fixed-position cart footer showing the total item count, the cart subtotal formatted with config `currency`, and a "Continue" button
3. WHILE the Cart is empty, THE Browse_Products_Screen SHALL hide the cart footer
4. WHEN the user taps the "Continue" button on the cart footer, THE Browse_Products_Screen SHALL navigate to the Cart_Checkout_Screen
5. THE Cart_Footer SHALL compute the total item count as the sum of all quantities across all cart entries
6. THE Cart_Footer SHALL compute the subtotal as the sum of (product sale price multiplied by quantity) for all cart entries

---

### Requirement 9: Product Detail Screen — Image and Details

**User Story:** As a user, I want to view full product details including multiple images, available sizes, and a description, so that I can make an informed purchase decision.

#### Acceptance Criteria

1. WHEN the user taps a product card on the Browse_Products_Screen, THE Template SHALL navigate to the Product_Detail_Screen displaying the selected product information
2. THE Product_Detail_Screen SHALL display a product image carousel showing all images from the product `images` array with horizontal dot indicators below; circular navigation arrows (left/right) SHALL appear on the carousel edges; a wishlist heart icon SHALL appear on the right side of the carousel
3. IF the `images` array is empty, THE Product_Detail_Screen SHALL display the single `image` field as the only carousel item
4. THE Product_Detail_Screen SHALL display a "Size:" label followed by the currently selected size value (e.g., "Size: 7UK") above the size selection pills
5. WHERE the product `sizes` array contains at least 1 entry, THE Product_Detail_Screen SHALL display size options as horizontal rounded pill buttons (e.g., "6 UK", "7 UK", "8 UK", "9 UK", "10 UK") with the first size pre-selected and highlighted with a dark filled background
6. WHEN the user taps a size pill, THE Product_Detail_Screen SHALL update the selected size with a filled dark background and deselect the previously selected size to an outlined style

---

### Requirement 10: Product Detail Screen — Pricing, Rating, and Actions

**User Story:** As a user, I want to see the product price breakdown, ratings, and quick action buttons, so that I can decide and purchase quickly.

#### Acceptance Criteria

1. THE Product_Detail_Screen SHALL display the product name as a bold heading (e.g., "NIke Sneakers") followed by a secondary description line (e.g., "Vision Alta Men's Shoes Size (All Colours)")
2. THE Product_Detail_Screen SHALL display a star rating row with 5 star icons (filled/unfilled) followed by the review count number (e.g., "56,890")
3. THE Product_Detail_Screen SHALL display the price section with: original price with strikethrough (e.g., "₹2,999"), sale price (e.g., "₹1,500"), and discount percentage in accent color (e.g., "50% Off")
4. THE Product_Detail_Screen SHALL display a "Product Details" section header followed by the product description text with a "...More" truncation link for long descriptions
5. THE Product_Detail_Screen SHALL display tag pills below the description (e.g., "Nearest Store", "VIP", "Return policy") with small icons
6. THE Product_Detail_Screen SHALL display two rounded action buttons side by side: "Go to cart" button (with cart icon and dark background) that navigates to Cart_Checkout_Screen, and "Buy Now" button (with bag icon and dark background) that adds the product to cart and navigates to Cart_Checkout_Screen
7. THE Product_Detail_Screen SHALL display a delivery estimate bar showing "Delivery in" label and the estimated time from config (e.g., "1 within Hour")
8. THE Product_Detail_Screen SHALL display "View Similar" and "Add to Compare" buttons with icons in outlined rectangular containers below the delivery estimate

---

### Requirement 11: Product Detail Screen — Similar Products

**User Story:** As a user, I want to see similar products below the product details, so that I can explore related options.

#### Acceptance Criteria

1. THE Product_Detail_Screen SHALL display a "Similar To" section header with item count text (e.g., "282+ Items") and filter/sort pill buttons below the main product details
2. THE Product_Detail_Screen SHALL render a horizontal scrollable 2-column grid of similar product cards matching the same card style used in Browse_Products_Screen
3. THE Similar_Products section SHALL display products from the same category as the currently viewed product, excluding the current product

---

### Requirement 12: Cart/Checkout Screen — Shopping List

**User Story:** As a user, I want to review all items in my cart with details before placing my order, so that I can verify my selections.

#### Acceptance Criteria

1. THE Cart_Checkout_Screen SHALL display a "Delivery Address" section with a location icon, showing a pre-filled address card with address text and a secondary card with a plus icon for adding/editing the address
2. THE Cart_Checkout_Screen SHALL display a "Shopping List" section header
3. THE Cart_Checkout_Screen SHALL render each cart item as a horizontal card containing: product image (rounded corners, left-aligned), product name as bold heading, "Variations :" label with color pills (small rounded rectangles showing color names like "Black", "Red"), star rating row with filled stars, price section showing sale price in a rounded badge and original price with strikethrough plus discount percentage text, and "Total Order (1) :" line with the item total at the right
4. THE Cart_Checkout_Screen SHALL display a vertical scrollbar indicator on the right edge when the shopping list exceeds the visible area
5. WHEN the cart is empty, THE Cart_Checkout_Screen SHALL display an empty state message and disable the "Proceed to Payment" button

---

### Requirement 13: Cart/Checkout Screen — Order Payment Details

**User Story:** As a user, I want to see the price breakdown and place my order, so that I know what I am paying.

#### Acceptance Criteria

1. THE Cart_Checkout_Screen SHALL display an "Order Payment Details" section showing: "Order Amounts" line with the subtotal value, "Convenience" line with a "Know More" link and "Apply Coupon" text, "Delivery Fee" line showing the delivery fee or "Free" when delivery fee is 0, a horizontal separator line, and "Order Total" line with the final total value in bold, plus "EMI Available" text with "Details" link below
2. THE Cart_Checkout_Screen SHALL display customer detail fields for full name and phone number, pre-filled from Template_SDK context values when available
3. THE Cart_Checkout_Screen SHALL include a sticky bottom toolbar showing the total price on the left (with currency symbol) and a dark "Proceed to Payment" button on the right
4. THE "Proceed to Payment" button SHALL be enabled only when the cart contains at least 1 item AND the name field contains at least 1 non-whitespace character AND the phone field contains at least 1 non-whitespace character
5. WHEN the user taps "Proceed to Payment", THE Cart_Checkout_Screen SHALL disable the button, display a loading indicator, and call `createAppointment` from Template_SDK with the order payload
6. IF the `createAppointment` call fails, THEN THE Cart_Checkout_Screen SHALL re-enable the button, display an inline error message, and preserve all user-entered data
7. WHILE the `createAppointment` call is in progress, THE Cart_Checkout_Screen SHALL prevent duplicate submissions

---

### Requirement 14: Confirmation Screen

**User Story:** As a user, I want to see a success message after placing my order, so that I know my purchase was received.

#### Acceptance Criteria

1. WHEN the order is submitted successfully, THE Confirmation_Screen SHALL display a celebration visual with a large outlined star containing a checkmark, surrounded by smaller decorative stars scattered around the central element
2. THE Confirmation_Screen SHALL display the text "Payment done successfully." centered below the star celebration graphic inside a rounded card container
3. THE Confirmation_Screen SHALL display a rounded CTA button with text from config `success_cta_text` (default: "Continue") that signals the user to close the WebView
4. WHEN the user taps the CTA button, THE Template SHALL attempt to close the WebView window via `window.close()`
5. WHEN the Confirmation_Screen renders, THE Template SHALL fire an analytics `complete` event with order details

---

### Requirement 15: Error Handling and Demo Mode

**User Story:** As a user, I want the shopping template to handle errors gracefully, so that I am not left on a broken screen.

#### Acceptance Criteria

1. IF the `createAppointment` API call fails, THEN THE Template SHALL display an inline error message on the Cart_Checkout_Screen, preserve all user-entered form data and cart state, and re-enable the submit button for retry
2. IF the config endpoint does not respond within 3 seconds, THEN THE Template SHALL render using hardcoded default configuration values (Demo_Mode); IF the config endpoint responds after the timeout, THE Template SHALL ignore the late response
3. IF a network error occurs during any API interaction other than analytics, THEN THE Template SHALL fire an analytics `error` event with the failed endpoint path and error message
4. WHILE config is being fetched, THE Template SHALL display a loading state (brand initial + shimmer animation) for no longer than 3 seconds
5. IF the analytics endpoint is unreachable, THEN THE Template SHALL silently discard the event without retrying and without affecting the user-facing flow

---

### Requirement 16: Analytics and Event Tracking

**User Story:** As a business owner, I want to track user engagement through the shopping funnel, so that I can understand drop-off points.

#### Acceptance Criteria

1. WHEN the Template mounts, THE Template SHALL fire a `view` analytics event via Template_SDK `track` with step name "intro"
2. WHEN the user adds the first item to the cart in a session, THE Template SHALL fire a `start` analytics event including the product identifier
3. WHEN the user navigates between steps, THE Template SHALL fire a step-level tracking event with the `step` property set to one of: `intro`, `browse_products`, `product_detail`, `cart_checkout`, or `confirmation`
4. WHEN the user successfully completes an order, THE Template SHALL fire a `complete` analytics event with item count and order total
5. IF the user closes the WebView before reaching the Confirmation_Screen, THEN THE Template SHALL fire an `abandon` analytics event with the `lastStep` property
6. IF any error occurs during the shopping flow, THEN THE Template SHALL fire an `error` analytics event with a `message` property and endpoint path
7. THE Template SHALL fire each analytics event exactly once per triggering action to prevent duplicates

---

### Requirement 17: Step Navigation and Progress

**User Story:** As a user, I want to see my progress and navigate back to previous steps, so that I can change my selections.

#### Acceptance Criteria

1. THE Template SHALL display a step indicator component showing the Shopping_Flow steps with each step visually distinguished as completed, current, or upcoming
2. WHILE the user is on any step after Intro_Screen and before Confirmation_Screen, THE Template SHALL display a back arrow (←) button in the top-left that navigates to the immediately preceding step
3. WHEN the user navigates back, THE Template SHALL preserve all previously entered selections (cart items, selected sizes, customer details)
4. WHEN the user navigates from Product_Detail_Screen back to Browse_Products_Screen, THE Template SHALL preserve the category filter state and cart contents
5. WHEN the user reaches the Confirmation_Screen, THE Template SHALL hide the back button and mark all preceding steps as completed

---

### Requirement 18: Mobile-First and Performance

**User Story:** As a user on a mobile device, I want the shopping template to load fast and feel native.

#### Acceptance Criteria

1. THE Template SHALL render all screens without horizontal overflow at any viewport width between 320px and 480px
2. THE Template SHALL use touch-optimized interaction targets with a minimum tap area of 44x44 CSS pixels for all interactive elements
3. THE Template SHALL produce a total production bundle below 200 KB gzipped
4. THE Template SHALL use CSS variables from the SDK theme system (--qt-primary, --qt-secondary, --qt-accent, --qt-text, --qt-bg, --qt-font) for all color and font declarations
5. WHEN the viewport width exceeds 480px, THE Template SHALL constrain the layout to a maximum width of 480px centered horizontally
6. THE Template SHALL lazy-load product images below the viewport fold using the `loading="lazy"` attribute

---

### Requirement 19: Dark Mode Support

**User Story:** As an admin, I want to enable dark mode for the shopping template.

#### Acceptance Criteria

1. WHERE config `dark_mode` is true, THE Template SHALL call the SDK `applyTheme` with `darkMode: true` and set `data-theme="dark"` on the root element
2. WHERE config `dark_mode` is true, THE Template SHALL ensure all text maintains a minimum contrast ratio of 4.5:1 against its background per WCAG 2.1 Level AA
3. WHERE config `dark_mode` is false or absent, THE Template SHALL render in light mode with white background and dark text
4. IF the SDK `applyTheme` call fails, THEN THE Template SHALL fall back to light mode rendering

---

### Requirement 20: Accessibility

**User Story:** As a user with assistive technology, I want the shopping template to be accessible.

#### Acceptance Criteria

1. THE Template SHALL use semantic HTML elements (header, main, nav, section, button, form, label) throughout all screens
2. THE Template SHALL associate all form inputs with visible labels using `<label>` elements or `aria-label` attributes
3. THE Template SHALL ensure all interactive elements are keyboard-navigable with visible focus indicators of at least 2px thickness
4. WHEN the user navigates to a new step, THE Template SHALL announce the step via an ARIA live region with `aria-live="polite"`
5. WHEN a category icon, size pill, or product card is in a selected state, THE Template SHALL convey the state using `aria-pressed` or `aria-selected` attributes
6. THE Template SHALL provide `alt` text for all product images derived from the product name
7. IF a button is disabled, THEN THE Template SHALL communicate the disabled state using the `disabled` attribute or `aria-disabled="true"`

---

### Requirement 21: Internationalization and RTL Support

**User Story:** As an admin serving multilingual customers, I want to configure all labels in any language and support RTL layouts.

#### Acceptance Criteria

1. THE Template SHALL render all user-facing text strings from the config `labels` object, falling back to the English default when a label key is absent
2. WHEN the context `lang` parameter is set to an RTL language code (ar, he, fa, ur), THE Template SHALL set `dir="rtl"` on the document root and apply CSS logical properties for reversed layout
3. IF the context `lang` parameter is not provided, THEN THE Template SHALL default to "en" and render in LTR direction
4. THE Template SHALL format currency values using `Intl.NumberFormat` with the locale from `lang` and currency from config, displaying exactly 2 fraction digits
5. THE Template SHALL format star ratings as numeric values with 1 decimal place followed by the "★" character

---

### Requirement 22: Cart State Management

**User Story:** As a user, I want my cart to correctly track items with their sizes and quantities, so that my order is accurate.

#### Acceptance Criteria

1. THE Cart SHALL use a composite key of product ID and selected size to uniquely identify cart entries, so that the same product in different sizes is tracked as separate line items
2. WHEN the user adds a product from the Browse_Products_Screen (without explicit size selection), THE Cart SHALL use the first size in the product `sizes` array as the default size; IF the `sizes` array is empty, THE Cart SHALL use an empty string as the size key
3. WHEN the user adds a product from the Product_Detail_Screen, THE Cart SHALL use the currently selected size pill value as the size key
4. THE Cart SHALL enforce a minimum quantity of 0 for any cart entry; decrementing from 1 SHALL remove the entry from the cart entirely
5. THE Cart SHALL enforce a maximum quantity of 99 for any single cart entry; incrementing beyond 99 SHALL have no effect
6. THE Cart subtotal computation SHALL equal the sum of (product sale price multiplied by quantity) for all cart entries, computed as a floating-point value rounded to 2 decimal places
7. THE Cart total computation SHALL equal the subtotal plus the config `delivery_fee`, rounded to 2 decimal places
