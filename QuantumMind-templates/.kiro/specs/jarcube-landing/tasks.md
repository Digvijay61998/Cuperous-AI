# Implementation Plan: JarCube Landing Site

## Overview

Build a 21-route static marketing site for JarCube at `templates/jarcube-landing/`, using React + TypeScript + Vite in multi-page mode (one emitted HTML file per route) so it hosts directly from S3 with no server runtime or rewrite rules. Content lives in typed data modules; the eight industry detail pages generate from one template. Lead capture composes `wa.me` deep links client-side. Feature flags gate pricing, logo wall, testimonials, and blog teasers. Palette: ink `#0F172A`, surface `#F8FAFC`, primary `#4338CA`, accent `#F59E0B`. Bundle budget: JS + CSS under 350 KB gzipped.

## Tasks

- [ ] 1. Scaffold, tokens, and content modules
  - [ ] 1.1 Scaffold the workspace package
    - Create `templates/jarcube-landing/` with `package.json` (name `jarcube-landing`, scripts `dev`/`build`/`typecheck`/`test`), `tsconfig.json` extending `../../tsconfig.base.json`, and the same dependency set as `templates/food-order-app`
    - Verify `pnpm install` resolves it as a workspace package
    - _Requirements: 1.1, 1.2, 1.7_

  - [ ] 1.2 Define TypeScript interfaces
    - Create `src/types.ts` with `SiteConfig`, `FeatureFlags`, `BillingPeriod`, `TierCtaKind`, `PricingTier`, `PricingConfig`, `Industry`, `PartnerConfig`, `LogoEntry`, `Testimonial`, `FaqEntry`, `FeaturePage`, `BlogPost`, `RouteDef`
    - _Requirements: 1.7_

  - [ ] 1.3 Author the route manifest
    - Create `src/content/routes.ts` exporting all 21 `RouteDef` entries: `/`, `/pricing`, `/industry`, 8 industry details, 5 feature pages, `/partner`, `/contact`, `/blog`, 2 legal
    - Each entry carries `path`, `entryName`, `htmlPath`, `title`, `description`
    - This manifest is the single source feeding Vite inputs, the sitemap, and nav links
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.11_

  - [ ] 1.4 Author site config and feature flags
    - Create `src/content/site.ts` with brand name, WhatsApp number `917558510587`, emails, phones, offices, office hours, socials, `baseUrl`, and `signupUrl: null`
    - Create `src/content/flags.ts` with `pricing`, `logoWall`, `testimonials`, `blogTeasers`, `pricingTeaser` — set `logoWall: false` and `testimonials: false` initially
    - _Requirements: 19.6, 18.3, 27.6_

  - [ ] 1.5 Author the pricing data module
    - Create `src/content/pricing.ts` with all four tiers: Starter ₹999/₹9,990, Growth ₹2,999/₹29,990 (`mostPopular: true`), Business ₹7,999/₹79,990, Enterprise null/null
    - Populate per-tier limits, `headlineLimits`, `inheritsFrom`, full feature lists, and CTA kinds (Starter signup, Growth trial, Business demo, Enterprise sales)
    - Set `annualSavingsPct: 17`, `currencySymbol: '₹'`, and the Meta charges disclaimer text
    - Label message allowances as JarCube platform automation allowances, not WhatsApp quotas
    - _Requirements: 17.1, 17.3, 17.4, 17.5, 17.7, 17.8, 17.9, 17.10, 18.1, 18.2_

  - [ ] 1.6 Author remaining content modules
    - `src/content/industries.ts` — 8 entries with slug, name, painPoint, ≥3 useCases, icon
    - `src/content/faq.ts` — question/answer entries
    - `src/content/features.ts` — 5 feature pages with title, summary, body sections
    - `src/content/partner.ts` — `commissionRatePct: 20`, benefits, model terms, 6 feature groups, responsibilities, comparison rows using neutral category descriptions naming no competitor
    - `src/content/blog.ts` — post entries
    - `src/content/logos.ts` — entries with `permissionObtained: false` pending sign-off
    - `src/content/testimonials.ts` — empty array pending real supplied quotes
    - _Requirements: 24.4, 26.3, 26.4, 26.5, 26.9, 26.10, 26.11, 23.1, 23.4, 23.6_

  - [ ] 1.7 Build the design token stylesheet
    - Create `src/styles/tokens.css` defining the full token set: colour palette, neutral ramp, both font stacks, spacing scale, radii, elevations
    - Add `[data-theme="dark"]` overrides for the same tokens
    - Add the `prefers-reduced-motion: reduce` clamp to `0.01ms`
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [ ] 1.8 Build the base and layout stylesheets
    - Create `src/styles/base.css` (reset, typography, focus-visible rings at ≥3:1, skip-link, `.sr-only`) and `src/styles/layout.css` (1200px max-width container, section rhythm, responsive grid helpers)
    - Reference tokens for every colour, font, spacing, radius, and shadow value
    - _Requirements: 4.4, 21.1, 21.2, 21.3, 22.3, 22.4_

- [ ] 2. Utilities and the multi-page build
  - [ ] 2.1 Implement the WhatsApp deep-link helper
    - Create `src/utils/whatsapp.ts` with `buildWhatsAppLink(number, message)` using `encodeURIComponent`, and `composeLeadMessage(template, fields)`
    - _Requirements: 19.4, 19.5_

  - [ ] 2.2 Implement pricing computation helpers
    - Create `src/utils/pricing.ts` with `formatTierPrice(tier, period, symbol)` returning a custom label for null prices, and `computeAnnualSavingsPct(monthly, annual)` deriving the percentage from the actual prices
    - _Requirements: 17.3, 17.4, 17.5_

  - [ ] 2.3 Implement commission computation helpers
    - Create `src/utils/commission.ts` deriving each row's commission, running cumulative total, and growth percentage from `commissionRatePct` and `monthlySalesExample`
    - _Requirements: 26.6, 26.8_

  - [ ] 2.4 Configure the multi-page Vite build
    - Create `vite.config.ts` with `base: './'`, React plugin, `target: 'es2018'`, and `rollupOptions.input` generated from the route manifest
    - Create the per-route HTML entry files at paths matching each route, so nested routes emit as directory + `index.html`
    - _Requirements: 1.3, 1.4, 1.5, 2.2, 2.3, 2.4_

  - [ ] 2.5 Implement the post-build static-asset step
    - Add a build step generating `sitemap.xml` and `robots.txt` from the same route manifest that feeds the Vite inputs
    - Create the `404.html` entry rendering the page shell and a link to `/`
    - _Requirements: 2.5, 2.6_

  - [ ]* 2.6 Write property tests for utilities
    - Create `src/__tests__/setup.ts`, then property tests: `routes.property.test.ts` (P1), `whatsapp-link.property.test.ts` (P2), `pricing.property.test.ts` (P3, P4), `commission.property.test.ts` (P5)
    - fast-check, ≥100 runs each, tagged `Feature: jarcube-landing, Property N`
    - _Requirements: 1.5, 2.6, 3.11, 17.3, 17.4, 17.5, 19.4, 19.5, 26.6, 26.8_

- [ ] 3. Page shell
  - [ ] 3.1 Implement SeoHead
    - Create `src/components/SeoHead.tsx` emitting per-route title, meta description, canonical, OG tags (title, description, type, url, image), Twitter card, and optional JSON-LD blocks
    - _Requirements: 20.1, 20.2, 20.3, 20.5, 20.6, 20.7_

  - [ ] 3.2 Implement AnnouncementBar
    - Create `src/components/AnnouncementBar.tsx` with dismiss control persisting to `localStorage`, wrapped in try/catch so unavailable storage degrades to session-only without a visible error
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 3.3 Implement NavHeader
    - Create `src/components/NavHeader.tsx`: sticky, wordmark to `/`, links driven by the route manifest, primary CTA
    - Below 900px collapse to a toggle with ≥44×44px tap target, `aria-expanded`, and focus returned to the toggle on close
    - Omit the `/pricing` link when the pricing flag is off
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 18.5, 21.3_

  - [ ] 3.4 Implement Footer and WhatsAppFab
    - Create `src/components/Footer.tsx` with wordmark, tagline, company column, socials column, newsletter `LeadForm`, copyright, both legal links
    - Create `src/components/WhatsAppFab.tsx` as a persistent deep-link affordance
    - _Requirements: 5.8, 5.9, 19.8_

  - [ ] 3.5 Implement PageShell
    - Create `src/components/PageShell.tsx` composing skip link (first focusable, targets `<main>`), announcement, nav, `<main>`, footer, FAB using semantic landmarks
    - _Requirements: 22.1, 22.2_

- [ ] 4. Shared sections
  - [ ] 4.1 Implement LeadForm
    - Create `src/components/LeadForm.tsx` with name, business, phone, message fields, each tied to a visible `<label>`
    - Require name and phone; block submit and show field-level validation messages when either is whitespace-only
    - On valid submit compose and open the encoded deep link; never post to any endpoint
    - Parameterise by message template and visible field set for the contact, partner, and newsletter contexts
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 28.3_

  - [ ] 4.2 Implement FaqSection
    - Create `src/components/FaqSection.tsx` reading `faq.ts`, rendering all answer text into the initial HTML for indexability
    - Each question is a button with `aria-expanded` and `aria-controls`; activating an expanded entry collapses it
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 28.1, 28.4_

  - [ ] 4.3 Implement BookACallSection
    - Create `src/components/BookACallSection.tsx` with heading, supporting paragraph, and WhatsApp CTA
    - _Requirements: 15.1, 15.2, 28.2_

- [ ] 5. Landing page sections
  - [ ] 5.1 Implement Hero
    - Single `<h1>`, supporting subheading, primary WhatsApp CTA plus secondary CTA to `/contact`
    - Original inline-SVG conversation visual; optional mount animation 200–600ms honouring reduced motion
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 4.5_

  - [ ] 5.2 Implement FeatureGrid
    - Five cards from `features.ts`, each with original inline-SVG icon, title, one-sentence description, rendered as a single focusable link region per card
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 5.3 Implement LogoWall and Testimonials
    - `LogoWall`: renders only entries with `permissionObtained: true`, applies light backing where `needsLightBacking`, omits the whole section when nothing renders, gated by flag
    - `Testimonials`: renders only real supplied entries with keyboard-operable labelled carousel controls, omits section when empty, gated by flag
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 23.4, 23.5, 23.6_

  - [ ] 5.4 Implement Process and IndustryDemos
    - `Process`: six steps as an ordered list with two-digit ordinals, single column below 700px
    - `IndustryDemos`: six cards from `industries.ts` with original SVG icons, pain-point question, outcome line, link to `/industry`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3_

  - [ ] 5.5 Implement PricingTeaser and MetaChargesNote
    - Teaser reads `pricing.ts` — the same module `/pricing` uses — showing tier name, monthly price, headline limits, link to `/pricing`, and the shared disclaimer; gated by flag
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 18.1_

  - [ ] 5.6 Implement BlogTeasers
    - Up to three cards from `blog.ts` with title, date, read time, post link, plus a link to `/blog`; omit section when empty; gated by flag
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 5.7 Assemble the landing page
    - Compose sections in order: Hero, FeatureGrid, LogoWall, Testimonials, Process, IndustryDemos, PricingTeaser, FAQ, BlogTeasers, BookACall
    - Omitted sections leave no residual vertical gap
    - Add `Organization` and `FAQPage` JSON-LD
    - _Requirements: 16.1, 16.2, 20.5, 20.6_

- [ ] 6. Remaining routes
  - [ ] 6.1 Implement the pricing page
    - `PricingTable` with four tier cards, per-tier limits and feature lists, Growth badged and elevated
    - `BillingToggle` defaulting to monthly, keyboard operable, selected period announced to assistive technology
    - Tier CTAs by kind, falling back to WhatsApp deep links while `signupUrl` is null
    - Disclaimer beneath the cards; when the pricing flag is off render a contact-sales CTA instead of tiers
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 17.11, 18.1, 18.2, 18.3, 18.4_

  - [ ] 6.2 Implement the industry index and detail template
    - `/industry`: eyebrow, single `<h1>`, intro, eight cards from `industries.ts`, each a single focusable link region, plus BookACall
    - One `IndustryDetailPage` implementation keyed by slug rendering pain-point, ≥3 use cases, industry-specific WhatsApp CTA, and BookACall — generating all eight routes
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7_

  - [ ] 6.3 Implement the partner page
    - Hero, benefits cards, partnership model (20/80 split, Meta charges borne by client or partner, resale threshold by mutual discussion)
    - `CommissionTable` as a `<table>` with `<caption>` and `scope` headers, values computed from `commissionRatePct`
    - `FeatureMatrix` across six capability groups, `ResponsibilitySplit` (L1 partner / L2 JarCube, basic vs complex flows), `ComparisonTable` with neutral categories naming no competitor
    - FAQ, BookACall, and a partner-application `LeadForm`
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 26.8, 26.9, 26.10, 26.11, 26.12, 26.13_

  - [ ] 6.4 Implement the contact page
    - Eyebrow, single `<h1>`, intro; `tel:` and `mailto:` links, socials, `LeadForm`, office addresses, office hours, FAQ
    - All details sourced from `site.ts`; omit the address section when no office is declared
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8_

  - [ ] 6.5 Implement feature, blog, and legal pages
    - Five feature detail pages from `features.ts`; `/blog` index from `blog.ts`; privacy policy and terms pages
    - Each with its own single `<h1>` and SEO metadata
    - _Requirements: 3.6, 3.7, 3.8, 20.1, 20.4_

- [ ] 7. Verification
  - [ ]* 7.1 Write component and accessibility tests
    - Component tests for `LeadForm` (validation, encoding, no network), `NavHeader` (collapse, aria-expanded, focus return), `FaqSection`, `BillingToggle`, `PricingTable`
    - Accessibility tests for single `<h1>` per route (P8), heading order without skipped levels, landmark presence, skip link
    - Omission property tests (P6, P7) and industry fan-out (P10)
    - _Requirements: 8.5, 8.6, 9.4, 12.5, 14.4, 16.2, 18.4, 20.4, 22.1, 22.2, 22.8, 24.2, 25.7_

  - [ ] 7.2 Verify build, output shape, and budgets
    - Run `tsc --noEmit` for zero errors and `pnpm build:template jarcube-landing`
    - Confirm `dist/index.html` at root, one HTML per route at its nested path, `404.html`, `robots.txt`, `sitemap.xml` present
    - Confirm `releases/jarcube-landing.zip` has `index.html` at the archive root
    - Confirm JS + CSS total under 350 KB gzipped
    - Check no horizontal overflow from 320px to 1920px, and that images below the fold carry `loading="lazy"` and explicit dimensions
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 2.5, 2.6, 21.1, 21.4, 21.5, 21.6_

## Notes

- Tasks marked `*` are optional test tasks and can be deferred without blocking a shippable build
- `logoWall` and `testimonials` flags start off: logos await written permission, testimonials await real supplied quotes
- The route manifest feeds Vite inputs, the sitemap, and nav links — keeping Property 1 true by construction
- `signupUrl` is null until a signup destination exists, so trial and sign-up CTAs resolve to WhatsApp deep links

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.7"] },
    { "id": 2, "tasks": ["1.3", "1.4", "1.8"] },
    { "id": 3, "tasks": ["1.5", "1.6", "2.1"] },
    { "id": 4, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 5, "tasks": ["2.5", "2.6", "3.1", "3.2"] },
    { "id": 6, "tasks": ["3.3", "3.4", "4.1"] },
    { "id": 7, "tasks": ["3.5", "4.2", "4.3"] },
    { "id": 8, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 9, "tasks": ["5.7", "6.1", "6.2", "6.3", "6.4", "6.5"] },
    { "id": 10, "tasks": ["7.1"] },
    { "id": 11, "tasks": ["7.2"] }
  ]
}
```
