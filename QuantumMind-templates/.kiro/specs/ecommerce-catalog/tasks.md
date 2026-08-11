# Implementation Plan: eCommerce Catalog

## Overview

Implement a 5-step eCommerce product catalog WebView template for WhatsApp: Intro → Browse Products → Product Detail → Checkout → Confirmation. Uses React + Vite with `@quantum/template-sdk`. Light theme default with white background (#FFFFFF), dark text (#000000), rounded cards, 2-column product grid, size selection pills, image carousels, and smooth step transitions. Bundle < 200KB gzipped.

## Tasks

- [x] 1. Set up project structure, types, and config
  - [x] 1.1 Scaffold template directory and build config
    - Create `templates/ecommerce-catalog/` with `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, and `manifest.json`
    - Same dependency structure as food-order-app
    - manifest.json: name "eCommerce Catalog", industry "ecommerce", category "ordering", tags, supportsDarkMode true, full templateConfig schema
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 1.2 Define TypeScript types and interfaces
    - Create `src/types.ts` with EcommerceConfig, Category, Product, Labels, OrderPayload, EcomStep, TransitionDirection, CartEntry
    - _Requirements: 2.3_

  - [x] 1.3 Create default config and config merging
    - Create `src/config/defaults.ts` with defaultConfig and mergeConfig function
    - 4 demo categories (All, Women, Men, Accessories), 6 demo products
    - Light theme colors: bg #FFFFFF, text #000000, primary #F83758
    - _Requirements: 2.2, 2.4, 2.5, 2.6_

  - [x] 1.4 Create CSS styles
    - Create `src/styles.css` — light theme default, dark mode via [data-theme="dark"]
    - All component styles: intro hero, search bar, category row, product grid, product detail, checkout, confirmation
    - Step transitions, cart footer, mobile-first 375px
    - _Requirements: 18.1, 18.2, 18.4, 18.5, 18.6, 19.1, 19.3, 19.4_

- [x] 2. Implement utility modules
  - [x] 2.1 Implement cart utilities
    - Create `src/utils/cart.ts` with addToCart, removeFromCart, getCartTotal, getCartItemCount, computeSubtotal, computeTotal
    - Cart key format: "productId:size"
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7_

  - [x] 2.2 Implement format and filter utilities
    - Create `src/utils/format.ts` — formatCurrency, formatRating
    - Create `src/utils/filters.ts` — filterByCategory, filterBySearch
    - Create `src/utils/direction.ts` — resolveDirection
    - _Requirements: 5.2, 5.3, 5.4, 21.2, 21.4, 21.5_

- [x] 3. Implement shared UI components
  - [x] 3.1 Implement StepIndicator, StepTransition, SearchBar, CategoryRow
    - StepIndicator: 5-step progress bar
    - StepTransition: slide/fade animation wrapper
    - SearchBar: search input with icon
    - CategoryRow: horizontal scrollable category icons
    - _Requirements: 5.1, 5.5, 5.6, 5.7, 17.1, 20.4, 20.5_

  - [x] 3.2 Implement ProductCard, CartFooter, SizePicker
    - ProductCard: image, name, price (sale + original + discount%), rating, add button
    - CartFooter: fixed bottom with count + total + Continue
    - SizePicker: horizontal pill buttons for size selection
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 8.2, 8.3, 8.4, 8.5, 8.6, 9.5, 9.6_

- [x] 4. Implement screen components
  - [x] 4.1 Implement IntroScreen
    - Hero image with gradient overlay, tagline, subtitle, "Get Started" CTA
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 4.2 Implement BrowseProductsScreen
    - Header, SearchBar, CategoryRow, ProductCard grid, CartFooter
    - Category/search filtering, add to cart
    - _Requirements: 5.1-5.7, 6.1, 7.1-7.7, 8.1-8.6_

  - [x] 4.3 Implement ProductDetailScreen
    - Image carousel, size picker, rating, price, description, action buttons
    - _Requirements: 9.1-9.6, 10.1-10.8_

  - [x] 4.4 Implement CheckoutScreen
    - Cart items list, order summary (subtotal, delivery, total), customer form, Place Order button
    - _Requirements: 12.1-12.5, 13.1-13.7_

  - [x] 4.5 Implement ConfirmationScreen
    - Star celebration, success message, "Continue" CTA
    - _Requirements: 14.1-14.5_

- [x] 5. Implement App shell and SDK integration
  - [x] 5.1 Implement main.tsx and App.tsx
    - SDK initialization, config loading with 3s timeout, theme, direction
    - Step state machine: intro → browse → detail → checkout → confirmation
    - Cart state, navigation, analytics lifecycle
    - _Requirements: 2.1, 3.1-3.6, 15.1-15.5, 16.1-16.7, 17.1-17.5_

- [x] 6. Build verification
  - [x] 6.1 Verify TypeScript and Vite build
    - tsc --noEmit: zero errors
    - vite build: dist/index.html, <200KB gzipped
    - _Requirements: 1.4, 1.5, 1.6, 18.3_

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["1.3", "2.1", "2.2"] },
    { "id": 3, "tasks": ["3.1", "3.2"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 5, "tasks": ["5.1"] },
    { "id": 6, "tasks": ["6.1"] }
  ]
}
```
