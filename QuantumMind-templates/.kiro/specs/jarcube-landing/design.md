# Design Document: JarCube Landing Site

## Overview

A statically-hosted marketing site for JarCube, a WhatsApp Business platform. Built with React + TypeScript + Vite as a **multi-page application** — one emitted HTML file per route — so it serves directly from S3 with no server runtime and no SPA rewrite rules.

21 routes. All lead capture composes `wa.me` deep links client-side, since static hosting has no backend.

### Key Design Decisions

1. **MPA, not SPA.** Vite `build.rollupOptions.input` maps one HTML entry per route. Each route's HTML contains its own full markup, `<title>`, meta, and OG tags. A direct request to `/partner` returns partner HTML with a 200 — no CloudFront function needed, and crawlers see real content.

2. **Content lives in typed data modules, not JSX.** Industries, FAQ, pricing, features, blog posts, and site config are each a single `.ts` module. The eight industry detail pages are generated from one template reading a keyed record, so a structural change lands on all eight. Prevents the divergence the requirements guard against.

3. **`templates/jarcube-landing/`, not a new top-level dir.** `pnpm-workspace.yaml` globs `templates/*` and `build-and-zip.ts` hardcodes `templates/<slug>`. Placing it here means `pnpm build:template jarcube-landing` works with zero tooling edits.

4. **Own vite.config, not `createTemplateConfig`.** The shared factory is single-entry and tuned for WebView bundles. This site needs multi-entry input. It still sets `base: './'` for path-agnostic hosting.

5. **Islands, not hydration of everything.** Most sections are static markup. Only interactive bits (nav toggle, announcement dismiss, FAQ accordion, billing toggle, carousel, forms) mount as small independent React roots. Keeps JS small.

6. **Feature flags as build-time constants.** One `flags.ts`. Disabled sections are omitted from output, not hidden with CSS.

---

## Architecture

```mermaid
graph TD
    subgraph Build
        MANIFEST[routes.ts manifest]
        VITE[vite.config.ts multi-entry]
        MANIFEST --> VITE
    end

    subgraph Content["Content modules (typed, single source)"]
        SITE[site.ts config]
        FLAGS[flags.ts]
        PRICING[pricing.ts]
        IND[industries.ts]
        FAQ[faq.ts]
        FEAT[features.ts]
        BLOG[blog.ts]
        PARTNER[partner.ts]
        LOGOS[logos.ts]
        TESTI[testimonials.ts]
    end

    subgraph Shell["Page shell"]
        ANN[AnnouncementBar]
        NAV[NavHeader]
        FOOT[Footer]
        WA[WhatsAppFab]
    end

    subgraph Shared["Shared sections"]
        FAQS[FaqSection]
        BOOK[BookACallSection]
        FORM[LeadForm]
    end

    subgraph Routes["21 emitted HTML entries"]
        HOME[/]
        PRICE[/pricing]
        INDIDX[/industry]
        IND8[8x /industry/:slug]
        FEAT5[5x /features/:slug]
        PART[/partner]
        CONT[/contact]
        BLOGIDX[/blog]
        LEGAL2[2x /legal/:slug]
        NF[404.html]
    end

    Content --> Routes
    Shell --> Routes
    Shared --> Routes
    VITE --> Routes

    Routes --> DIST[dist/]
    DIST --> ZIP[releases/jarcube-landing.zip]
    ZIP --> S3[S3 + CloudFront]
```

### Emitted output shape

Nested routes emit as directory + `index.html` so S3 static hosting resolves them without rewrite rules:

```
dist/
├── index.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── pricing/index.html
├── industry/index.html
├── industry/healthcare/index.html          (x8)
├── features/shared-inbox/index.html         (x5)
├── partner/index.html
├── contact/index.html
├── blog/index.html
├── legal/privacy-policy/index.html          (x2)
└── assets/
```

---

## Design System

Cube/geometric motif, deliberately distinct from any competitor palette.

### Tokens

| Token | Value | Use |
|---|---|---|
| `--jc-ink` | `#0F172A` | Body text, dark surfaces |
| `--jc-surface` | `#F8FAFC` | Page background |
| `--jc-primary` | `#4338CA` | CTAs, links, active states |
| `--jc-primary-hover` | `#3730A3` | Hover |
| `--jc-accent` | `#F59E0B` | Badges, highlights, "most popular" |
| `--jc-success` | `#10B981` | Positive comparison rows |
| `--jc-n50` … `--jc-n900` | 6-step ramp | Borders, muted text, fills |
| `--jc-font-head` | Plus Jakarta Sans, system fallback | Headings |
| `--jc-font-body` | Inter, system fallback | Body |
| `--jc-r-sm/md/lg/xl` | 8 / 12 / 20 / 28px | Radii |
| `--jc-e1/e2/e3` | 3-step shadow ramp | Elevation |
| `--jc-s1` … `--jc-s16` | 4px-based scale | Spacing |

Dark mode overrides the same tokens under `[data-theme="dark"]`. Every colour/font/radius/shadow declaration references a token — no literals outside the definitions.

### Motion

All transitions 150–400ms. Under `prefers-reduced-motion: reduce`, a global rule clamps `animation-duration` and `transition-duration` to `0.01ms`.

### Illustration

All product visuals, icons, and industry glyphs are inline SVG authored for JarCube. No third-party raster assets are embedded. Hero renders a stylised WhatsApp conversation as SVG + CSS.

---

## Components and Interfaces

### Page shell

| Component | Interactive | Responsibility |
|---|---|---|
| `PageShell` | no | Wraps every route: skip link, announcement, nav, `<main>`, footer, FAB |
| `AnnouncementBar` | yes | Dismissible, persists to `localStorage`, try/catch guarded |
| `NavHeader` | yes | Sticky; collapses below 900px to `aria-expanded` toggle, focus returns on close |
| `Footer` | partial | Link columns, newsletter `LeadForm`, legal, copyright |
| `WhatsAppFab` | no | Anchor to `wa.me` deep link |
| `SeoHead` | no | Per-route title, description, canonical, OG, Twitter, JSON-LD |

### Shared sections

| Component | Consumed by | Notes |
|---|---|---|
| `FaqSection` | `/`, `/partner`, `/contact` | Answers in initial HTML for indexability; `aria-expanded` + `aria-controls` |
| `BookACallSection` | `/`, `/industry`, 8 industry details, `/partner` | Heading, copy, WhatsApp CTA |
| `LeadForm` | `/contact`, `/partner`, footer | Parameterised by message template + visible field set |

### Landing sections (render order)

`Hero` → `FeatureGrid` → `LogoWall`⚑ → `Testimonials`⚑ → `Process` → `IndustryDemos` → `PricingTeaser`⚑ → `FaqSection` → `BlogTeasers`⚑ → `BookACallSection`

⚑ = feature-flagged. Disabled or empty-content sections are omitted from output entirely, so no residual vertical gap.

### Route-specific

| Component | Route | Notes |
|---|---|---|
| `PricingTable` | `/pricing` | 4 tiers, billing toggle, Growth elevated |
| `BillingToggle` | `/pricing` | Radiogroup semantics, keyboard operable |
| `MetaChargesNote` | `/pricing`, teaser | Shared disclaimer |
| `IndustryCardGrid` | `/industry` | 8 cards from content module |
| `IndustryDetailPage` | 8 routes | One implementation, keyed by slug |
| `CommissionTable` | `/partner` | `<caption>`, `scope` headers, computed from rate |
| `FeatureMatrix` | `/partner` | 6 capability groups |
| `ComparisonTable` | `/partner` | Neutral categories, names no competitor |
| `ResponsibilitySplit` | `/partner` | L1/L2, basic/complex flows |

---

## Data Models

```typescript
// site.ts — single source for all contact details
interface SiteConfig {
  brandName: string;                 // "JarCube"
  whatsappNumber: string;            // "917558510587" — E.164, no +
  emails: { label: string; address: string }[];
  phones: { label: string; e164: string; display: string }[];
  offices: { label: string; address: string }[];
  officeHours: string;
  socials: { platform: string; url: string }[];
  baseUrl: string;                   // for canonical + OG + sitemap
  signupUrl: string | null;          // null → CTAs fall back to WhatsApp
}

// flags.ts
interface FeatureFlags {
  pricing: boolean;        // gates /pricing body + teaser + nav link
  logoWall: boolean;
  testimonials: boolean;
  blogTeasers: boolean;
  pricingTeaser: boolean;
}

// pricing.ts — consumed by BOTH /pricing and the landing teaser
type BillingPeriod = 'monthly' | 'annual';
type TierCtaKind = 'trial' | 'signup' | 'demo' | 'sales';

interface PricingTier {
  id: 'starter' | 'growth' | 'business' | 'enterprise';
  name: string;
  positioning: string;
  monthly: number | null;            // null → Enterprise, renders "Custom"
  annual: number | null;
  mostPopular: boolean;
  limits: {
    agents: string;                  // string to allow "Unlimited"
    contacts: string;
    messages: string;
    flows: string;
    numbers: string;
  };
  headlineLimits: string;            // teaser one-liner
  inheritsFrom: string | null;       // "Everything in Starter, plus:"
  features: string[];
  cta: { kind: TierCtaKind; label: string };
}

interface PricingConfig {
  currencySymbol: string;            // "₹"
  annualSavingsPct: number;          // 17
  tiers: PricingTier[];
  metaChargesDisclaimer: string;
}

// industries.ts — drives /industry index, 8 detail pages, landing demos
interface Industry {
  slug: string;
  name: string;
  painPoint: string;
  useCases: string[];                // >= 3
  icon: IconName;
}

// partner.ts
interface PartnerConfig {
  commissionRatePct: number;         // 20 — CommissionTable computes from this
  monthlySalesExample: number;
  exampleMonths: number;             // 3
  benefits: { title: string; body: string }[];
  modelTerms: string[];
  featureGroups: { group: string; items: { name: string; body: string }[] }[];
  responsibilities: { title: string; owner: 'partner' | 'jarcube'; body: string }[];
  comparison: { category: string; generic: string; jarcube: string }[];
}

// logos.ts — permission-gated
interface LogoEntry {
  name: string;
  src: string;
  permissionObtained: boolean;       // false → omitted from render
  needsLightBacking: boolean;
}

// testimonials.ts — empty array in production until real quotes supplied
interface Testimonial {
  quote: string;
  attribution: string;
  organisation: string;
  metric?: string;
}
```

### WhatsApp deep link composition

Single helper, used by every CTA and form. Encoding is the security-relevant part — unencoded user input could inject into the URL.

```typescript
function buildWhatsAppLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function composeLeadMessage(
  template: string,
  fields: Record<string, string>
): string;   // interpolates, then the whole result is encoded by buildWhatsAppLink
```

`LeadForm` never posts anywhere. On valid submit it opens the composed link via user-initiated navigation.

---

## Correctness Properties

### Property 1: Route manifest ↔ build output parity
*For any* route manifest, the build emits exactly one HTML file per declared route at the path implied by that route, and the sitemap enumerates exactly the same set — no route is emitted without a sitemap entry and none appears in the sitemap without an emitted file.

**Validates: Requirements 1.5, 2.2, 2.6, 3.11**

### Property 2: WhatsApp link encoding safety
*For any* field values containing arbitrary characters — including `&`, `?`, `#`, `=`, newlines, and non-ASCII — the composed deep link has exactly one `?text=` parameter and the decoded `text` equals the intended message, so no input can inject additional URL parameters.

**Validates: Requirements 19.4, 19.5**

### Property 3: Pricing display consistency
*For any* pricing config and *any* billing period, the price shown for a tier on `/pricing` equals the price shown for that same tier in the landing teaser; and a tier with a null price renders a non-numeric custom label in both places.

**Validates: Requirements 12.3, 17.3, 17.4**

### Property 4: Annual savings claim is arithmetically honest
*For any* tier with both a monthly and an annual price, the displayed savings percentage equals the rounded actual saving of `annual` against `monthly × 12`, so the advertised discount cannot contradict the listed prices.

**Validates: Requirements 17.5**

### Property 5: Commission table internal consistency
*For any* commission rate and monthly sales figure, each row's commission equals `sales × rate`, the cumulative column equals the running sum of prior rows, and the growth percentage equals `rate × monthIndex`.

**Validates: Requirements 26.6, 26.8**

### Property 6: Flag and empty-content omission
*For any* combination of feature flags and content-module states, a section that is flagged off or whose content module is empty produces no DOM output, and the surviving sections retain their specified relative order.

**Validates: Requirements 8.5, 8.6, 9.4, 9.6, 12.5, 14.4, 14.5, 16.2, 18.4, 27.8**

### Property 7: Permission gating of logos
*For any* logo manifest, only entries with `permissionObtained === true` appear in rendered output.

**Validates: Requirements 23.4, 23.5**

### Property 8: Single `<h1>` per route
*For any* route, the rendered document contains exactly one `<h1>` element.

**Validates: Requirements 6.6, 20.4**

### Property 9: Pricing flag propagation
*For any* state of the pricing flag, when disabled: the teaser is absent from `/`, the nav omits its pricing link, and `/pricing` renders a contact-sales CTA rather than tier cards — no dead link is ever emitted.

**Validates: Requirements 18.3, 18.4, 18.5**

### Property 10: Industry content fan-out
*For any* industry content module, the `/industry` index renders one card per entry and an industry detail route exists for every entry's slug, with name and pain-point text identical between index and detail.

**Validates: Requirements 24.2, 24.4, 25.6, 25.7**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable or throws | Announcement renders; dismissal is session-only. No visible error. |
| Webfont fails to load | System fallback stack renders; layout stable via `font-display: swap`. |
| Logo image 404s | `alt` text renders; layout holds via declared dimensions. |
| Empty content module | Section omitted (Property 6). |
| Reduced motion | Global clamp to 0.01ms. |
| JS disabled | All content is in the initial HTML. FAQ answers use `<details>` fallback semantics; nav links remain reachable; forms degrade to a plain WhatsApp link. |
| Direct request to unknown path | S3 404 document → `404.html` with shell + link home. |

---

## Testing Strategy

**Framework:** Vitest + fast-check for properties, @testing-library/react + jsdom for components, `tsc --noEmit` for types.

```
src/__tests__/
├── setup.ts
├── properties/
│   ├── routes.property.test.ts        # P1
│   ├── whatsapp-link.property.test.ts # P2
│   ├── pricing.property.test.ts       # P3, P4, P9
│   ├── commission.property.test.ts    # P5
│   ├── omission.property.test.ts      # P6, P7
│   └── industries.property.test.ts    # P10
├── components/
│   ├── LeadForm.test.tsx              # validation, encoding, no network
│   ├── NavHeader.test.tsx             # collapse, aria-expanded, focus return
│   ├── FaqSection.test.tsx            # expand/collapse, aria wiring
│   ├── BillingToggle.test.tsx         # keyboard, announced state
│   └── PricingTable.test.tsx          # tier values, popular badge
└── a11y/
    └── landmarks.test.tsx             # P8, heading order, skip link
```

Property tests run ≥100 iterations, tagged `Feature: jarcube-landing, Property N`.

**Verified outside PBT:** contrast ratios (manual/automated audit), LCP (Lighthouse on 4G profile), gzipped bundle budget (build step assertion), real screen-reader behaviour (manual — automated checks can't substitute).

---

## Build Configuration

```typescript
// vite.config.ts — multi-entry, one input per route
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { routes } from './src/content/routes';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2018',
    sourcemap: false,
    rollupOptions: {
      input: Object.fromEntries(
        routes.map(r => [r.entryName, r.htmlPath])
      ),
    },
  },
});
```

A post-build step emits `sitemap.xml` and `robots.txt` from the same `routes` manifest that fed the build inputs — which is what makes Property 1 hold by construction rather than by discipline.
