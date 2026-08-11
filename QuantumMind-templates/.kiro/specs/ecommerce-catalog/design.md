# Design Document: eCommerce Catalog Template

## Overview

The eCommerce Catalog Template is a configurable WhatsApp WebView mini-app built with React + TypeScript + Vite that provides a minimal multi-step shopping flow (Intro → Browse Products → Product Detail → Checkout → Confirmation). It integrates with `@quantum/template-sdk` for configuration loading, theming, analytics, and order submission.

This is a WhatsApp WebView — opens when a customer taps a product link in chat. Same concept as food-order-app but for the eCommerce/fashion category.

### Key Design Decisions

1. **5-step linear flow** — Intro → Browse → Detail → Checkout → Confirmation. Uses StepTransition pattern from other templates.
2. **Light theme default** — White background, dark text, accent color for CTAs (matching the Figma).
3. **Cart with size tracking** — Cart key is `productId:size` to track same product in different sizes.
4. **Config-driven product data** — All products, categories from JSON config with Demo Mode fallback.
5. **SDK-first** — getContext, loadConfig, applyTheme, track, createAppointment (for order submission).

## Architecture

Same as food-order-app: main.tsx → App.tsx → Screen components with shared UI components.

### Screen Flow

Intro → BrowseProducts → ProductDetail → Checkout → Confirmation

## Data Models

```typescript
interface EcommerceConfig {
  brand_name: string;
  brand_logo: string;
  hero_image: string;
  tagline: string;
  subtitle: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  font_family: string;
  dark_mode: boolean;
  categories: Category[];
  products: Product[];
  delivery_fee: number;
  tax_rate: number;
  estimated_delivery_time: string;
  currency: string;
  success_message: string;
  success_cta_text: string;
  labels: Labels;
}

interface Category { id: string; name: string; icon?: string; }

interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  images?: string[];
  rating: number;
  reviewCount?: number;
  sizes?: string[];
  colors?: string[];
  deliveryEstimate?: string;
}

type EcomStep = 'intro' | 'browse' | 'detail' | 'checkout' | 'confirmation';
type CartKey = string; // format: "productId:size"
type Cart = Map<CartKey, { productId: string; size: string; quantity: number }>;
```

## Correctness Properties

1. Config merge completeness — merged config always has every default key populated
2. Direction determination — RTL for ar/he/fa/ur, LTR otherwise  
3. Search/category filter correctness
4. Cart quantity bounds [0, 99], removal at 0
5. Cart total computation accuracy
6. Currency formatting with 2 decimals
