# Implementation Plan: Food Order App

## Overview

Implement a 4-step food ordering WebView template for WhatsApp chat: Intro → Browse Menu → Checkout → Confirmation. The template uses React + Vite with `@quantum/template-sdk`, CSS slide/fade transitions, a 2-column food card grid, horizontal category pills, search filtering, running cart footer, and config-driven Demo Mode. Default palette: Dark #2D2D3A / Orange accent #FF6B00. Bundle must be < 200KB gzipped. TypeScript is the implementation language.

## Tasks

- [x] 1. Set up project structure, types, and config
  - [x] 1.1 Scaffold template directory and build config
    - Create `templates/food-order-app/` with `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, and `manifest.json`
    - `package.json` mirrors beauty-services-catalog dependencies (react, react-dom, @quantum/template-sdk, vitest, fast-check, @testing-library/react, jsdom)
    - `vite.config.ts` uses React plugin with vitest jsdom config
    - `manifest.json` declares name "Food Order App", industry "food", category "ordering", tags ["food", "order", "delivery", "restaurant"], supportedLanguages ["en"], supportsDarkMode true, estimatedDuration "3 minutes", and templateConfig schema entries for all configurable keys (brand_name, brand_logo, hero_image, primary_color, secondary_color, accent_color, text_color, background_color, font_family, dark_mode, categories, menu_items, delivery_fee, tax_rate, estimated_delivery_time, currency, success_message, success_cta_text, labels)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 1.2 Define TypeScript types and interfaces
    - Create `src/types.ts` with `FoodOrderConfig`, `Category`, `MenuItem`, `Labels`, `OrderPayload`, `FoodStep`, `TransitionDirection` interfaces
    - FoodStep: 'intro' | 'browse_menu' | 'checkout' | 'confirmation'
    - Include Cart type as `Map<string, number>` (itemId → quantity)
    - _Requirements: 2.3_

  - [x] 1.3 Create default config and config merging logic
    - Create `src/config/defaults.ts` exporting a complete `FoodOrderConfig` default object with brand_name "Foodgo", primary_color "#FF6B00", background_color "#2D2D3A", text_color "#FFFFFF", 4 demo categories (All, Combos, Burgers, Sides), 6 demo menu items (burgers, fries, etc. with prices, ratings, images), delivery_fee 1.5, tax_rate 0.1, estimated_delivery_time "24 mins", currency "USD", and all default labels
    - Implement `mergeConfig(partial: Partial<FoodOrderConfig>): FoodOrderConfig` that deep-merges fetched config with defaults ensuring no key is ever undefined
    - _Requirements: 2.2, 2.4, 2.5, 2.6_

  - [x] 1.4 Create CSS styles with custom properties and dark theme
    - Create `src/styles.css` using CSS custom properties (--qt-primary, --qt-secondary, --qt-accent, --qt-text, --qt-bg, --qt-font) and template-specific tokens
    - Implement step transition animations (slide-left/slide-right + fade using transform and opacity, 300ms)
    - Dark mode as default: dark background #2D2D3A, light text #FFFFFF, orange accent #FF6B00
    - Light mode via `[data-theme="light"]` selector
    - Food card styles: rounded corners (16px), soft shadows, 2-column grid
    - Category pill styles: rounded-full, accent fill for active
    - Cart footer: fixed bottom, dark surface, accent CTA button
    - Mobile-first layout targeting 430px with max-width centered on larger viewports
    - All interactive elements minimum 44×44px tap area
    - _Requirements: 18.1, 18.2, 18.5, 18.6, 18.7, 19.1, 19.3, 19.5, 21.1, 21.2, 21.3, 21.4_

- [x] 2. Implement utility modules
  - [x] 2.1 Implement cart computation utilities
    - Create `src/utils/cart.ts` with pure functions:
      - `computeSubtotal(cart: Map<string, number>, menuItems: MenuItem[]): number` — sum of (price × quantity) for all cart items
      - `computeTax(subtotal: number, taxRate: number): number` — subtotal × taxRate
      - `computeTotal(subtotal: number, tax: number, deliveryFee: number): number` — sum of all
      - `getCartItemCount(cart: Map<string, number>): number` — sum of all quantities
      - `addToCart(cart: Map<string, number>, itemId: string): Map<string, number>` — increment quantity
      - `removeFromCart(cart: Map<string, number>, itemId: string): Map<string, number>` — decrement quantity (min 0, remove key at 0)
    - _Requirements: 7.3, 11.2_

  - [x] 2.2 Implement formatting utilities
    - Create `src/utils/format.ts` with:
      - `formatCurrency(amount: number, currency: string, locale: string): string` using `Intl.NumberFormat` with exactly 2 fraction digits
    - _Requirements: 20.4, 20.5_

  - [x] 2.3 Implement filter utilities
    - Create `src/utils/filters.ts` with:
      - `filterByCategory(items: MenuItem[], categoryId: string): MenuItem[]` — returns all items if "all", else filters by categoryId
      - `filterBySearch(items: MenuItem[], query: string): MenuItem[]` — case-insensitive name match, returns all if empty query
    - _Requirements: 5.3, 5.4, 6.3_

  - [x] 2.4 Implement RTL direction utility
    - Create `src/utils/direction.ts` with `resolveDirection(lang: string): 'rtl' | 'ltr'`
    - Return "rtl" for "ar", "he", "fa", "ur"; "ltr" for all others
    - _Requirements: 20.2, 20.3_

  - [ ]* 2.5 Write property tests for utilities (Properties 1-8)
    - Create `src/__tests__/setup.ts` with vitest/jsdom setup and SDK mocks
    - Create `src/__tests__/config.property.test.ts` — Property 1: config merge completeness
    - Create `src/__tests__/direction.property.test.ts` — Property 2: RTL direction determination
    - Create `src/__tests__/filter.property.test.ts` — Properties 3 & 4: search and category filter
    - Create `src/__tests__/cart.property.test.ts` — Properties 5, 6, 8: cart bounds, total computation, item count
    - Create `src/__tests__/format.property.test.ts` — Property 7: currency formatting
    - All tests use fast-check with minimum 100 iterations
    - _Requirements: 2.2, 2.4, 3.5, 5.3, 6.3, 7.3, 11.2, 20.2, 20.4_

- [x] 3. Implement shared UI components
  - [x] 3.1 Implement StepIndicator and StepTransition components
    - Create `src/components/StepIndicator.tsx` — horizontal step progress bar with 4 steps (Intro, Browse, Checkout, Confirmation), visual states for completed/active/upcoming
    - Create `src/components/StepTransition.tsx` — CSS slide/fade animation wrapper (forward: slide-right-in, backward: slide-left-in, 300ms duration)
    - Use `aria-label` for accessibility on step indicator
    - _Requirements: 15.5, 22.1, 22.4_

  - [x] 3.2 Implement CategoryBar component
    - Create `src/components/CategoryBar.tsx` — horizontal scrollable pill-shaped category buttons
    - "All" category always prepended
    - Active pill: accent color fill; Inactive: muted/transparent background
    - Rounded-full corners, min 44px tap height
    - `aria-pressed` for selected state
    - _Requirements: 6.1, 6.2, 6.4, 19.5, 22.5_

  - [x] 3.3 Implement SearchBar component
    - Create `src/components/SearchBar.tsx` — search input with search icon
    - Placeholder text from config labels
    - Calls onChange on each keystroke (debounce happens in parent)
    - `aria-label` for accessibility
    - _Requirements: 5.2, 22.2_

  - [x] 3.4 Implement FoodCard component
    - Create `src/components/FoodCard.tsx` — card for 2-column grid display
    - Shows: food image (gradient placeholder if missing), food name (truncated at 40 chars with ellipsis), price formatted with currency, star rating with yellow star icon, Add/quantity/Remove controls
    - Rounded corners (16px), soft shadow, dark card background
    - Add button: accent color; shows quantity badge when in cart
    - `alt` text on image uses item name
    - Min 44×44px tap targets
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 19.1, 19.3, 22.6_

  - [x] 3.5 Implement CartFooter component
    - Create `src/components/CartFooter.tsx` — fixed bottom footer
    - Shows: "{count} items · {formattedTotal}" and Continue button
    - Continue button disabled when cart is empty (count === 0)
    - Dark surface background, accent CTA button
    - Does not obscure last food card (scroll padding above)
    - _Requirements: 7.1, 15.1, 22.7_

- [x] 4. Implement screen components
  - [x] 4.1 Implement IntroScreen
    - Create `src/components/IntroScreen.tsx` with:
      - Hero background (config hero_image or gradient fallback using primary+accent colors)
      - Brand logo (config brand_logo, fallback to brand_name text)
      - Brand name heading ("Foodgo" default)
      - Tagline text (config labels.intro_tagline, default: "Delicious food delivered to your door")
      - "Order Now" CTA button (config labels.get_started)
    - Fire analytics `view` event on render
    - Semantic HTML (section, h1, button)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 17.1_

  - [x] 4.2 Implement BrowseMenuScreen
    - Create `src/components/BrowseMenuScreen.tsx` composing:
      - Header with brand name + greeting text (config labels.home_greeting)
      - SearchBar for filtering
      - CategoryBar with categories from config
      - 2-column FoodCard grid showing filtered menu items
      - CartFooter with running total
    - Category selection filters cards; search filters within selected category
    - Empty state message when no items match
    - Debounce search at 300ms
    - Fire `start` analytics on first item added to cart
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5, 17.2_

  - [x] 4.3 Implement CheckoutScreen
    - Create `src/components/CheckoutScreen.tsx` with:
      - Order summary: list of cart items with names, quantities, line totals
      - Subtotal, Tax, Delivery Fee, Total — all computed and formatted
      - Estimated delivery time (from config)
      - Customer details form: Name (pre-filled from context, max 100 chars), Phone (pre-filled, max 20 chars), Notes (optional, max 500 chars)
      - "Place Order" button (config labels.place_order)
    - On confirm: disable button, show loading, call `createOrder` from SDK with OrderPayload
    - On success: navigate to Confirmation
    - On failure: re-enable button, show inline error, preserve data
    - Prevent duplicate submissions
    - Associate all inputs with labels
    - _Requirements: 3.2, 3.3, 11.1, 11.2, 11.3, 11.6, 11.7, 11.8, 11.9, 11.10, 16.1, 22.2_

  - [x] 4.4 Implement ConfirmationScreen
    - Create `src/components/ConfirmationScreen.tsx` with:
      - Green checkmark circle icon (animated scale-in)
      - "Success!" heading (config labels.success_heading)
      - Confirmation message (config success_message)
      - "Go Back" / "Return to Chat" CTA (config success_cta_text) that calls window.close()
    - Fire analytics `complete` event with order details
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 17.4, 19.6_

- [x] 5. Implement App shell and SDK integration
  - [x] 5.1 Implement main entry point and App.tsx
    - Create `src/main.tsx` mounting React app into root div
    - Create `src/App.tsx` managing:
      - Loading state with 3s config timeout (splash screen with brand logo)
      - SDK initialization: getContext → loadConfig (3s race) → mergeConfig → applyTheme → resolveDirection
      - Step state machine: intro → browse_menu → checkout → confirmation
      - StepIndicator + StepTransition wrapper + active screen rendering
      - Cart state (Map<string, number>), customer info from context
      - Forward/backward navigation with state preservation
      - Back button on steps 2-3 (hidden on intro and confirmation)
      - Analytics: view on mount, step on navigation, start on first add, complete on success, abandon on beforeunload, error on failure
      - Demo Mode fallback on config failure
      - Dark mode: set data-theme="dark" when dark_mode is true
      - RTL: set dir attribute based on lang context
      - ARIA live region for screen reader announcements
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 3.1, 3.4, 3.5, 3.6, 13.1, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 15.1, 15.2, 15.3, 15.4, 15.5, 16.2, 16.3, 16.4, 16.5, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 20.1, 20.2, 20.3, 21.1, 21.2, 21.3, 21.4, 22.1, 22.3, 22.4_

- [x] 6. Build verification and final validation
  - [x] 6.1 Verify TypeScript compilation and Vite build
    - Run `tsc --noEmit` — must complete with zero errors
    - Run `vite build` — must produce dist/index.html at root
    - Verify gzipped bundle total < 200 KB
    - Ensure template builds correctly within the monorepo
    - _Requirements: 1.4, 1.5, 1.6, 18.4_

## Notes

- Tasks marked with `*` are optional property tests (can be skipped for faster delivery)
- Each task references specific requirements for traceability
- The template follows the same monorepo patterns as beauty-services-catalog
- TypeScript is the implementation language (React + Vite with .tsx components)
- Default color palette: Dark #2D2D3A / Orange accent #FF6B00
- 4-step linear flow (same pattern as other templates)
- No profile/support/chat screens — this is a WhatsApp WebView, not a standalone app

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["1.3", "2.1", "2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["2.5"] },
    { "id": 4, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 5, "tasks": ["4.1", "4.2", "4.3", "4.4"] },
    { "id": 6, "tasks": ["5.1"] },
    { "id": 7, "tasks": ["6.1"] }
  ]
}
```
