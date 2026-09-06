/**
 * Shared type definitions for the JarCube landing site.
 *
 * Content modules under src/content/ are the single source of truth for
 * everything the site renders. These interfaces describe their shape.
 */

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

/**
 * One route in the site. The route manifest drives three things at once:
 * the Vite build inputs, the generated sitemap, and the nav links. Keeping
 * them fed from one array is what stops them drifting apart.
 */
export interface RouteDef {
  /** User-facing path, e.g. "/industry/healthcare". Root is "/". */
  path: string;
  /** Rollup input key — must be unique across the manifest. */
  entryName: string;
  /** Path to the HTML entry file, relative to the package root. */
  htmlPath: string;
  /** Per-route <title>. */
  title: string;
  /** Per-route meta description. */
  description: string;
  /** Excluded from sitemap.xml when true (e.g. the 404 document). */
  noIndex?: boolean;
}

// ---------------------------------------------------------------------------
// Site configuration
// ---------------------------------------------------------------------------

export interface ContactEmail {
  label: string;
  address: string;
}

export interface ContactPhone {
  label: string;
  /** E.164 without the leading "+", suitable for wa.me and tel: URLs. */
  e164: string;
  /** Human-readable form shown in the UI. */
  display: string;
}

export interface OfficeAddress {
  label: string;
  address: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteConfig {
  brandName: string;
  tagline: string;
  /** WhatsApp business number, E.164 without "+". */
  whatsappNumber: string;
  emails: ContactEmail[];
  phones: ContactPhone[];
  offices: OfficeAddress[];
  officeHours: string;
  socials: SocialLink[];
  /** Absolute origin, used for canonical URLs, OG tags and the sitemap. */
  baseUrl: string;
  /** Null until a signup destination exists; CTAs then fall back to WhatsApp. */
  signupUrl: string | null;
  /** Legal entity shown in the footer copyright line. */
  legalEntity: string;
}

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

/**
 * Build-time flags. A disabled section is omitted from the output entirely
 * rather than hidden with CSS, so it costs nothing to ship it switched off.
 */
export interface FeatureFlags {
  /** Gates the /pricing body, the landing teaser, and the nav link together. */
  pricing: boolean;
  logoWall: boolean;
  testimonials: boolean;
  blogTeasers: boolean;
  pricingTeaser: boolean;
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export type BillingPeriod = 'monthly' | 'annual';

export type TierCtaKind = 'trial' | 'signup' | 'demo' | 'sales';

export type TierId = 'starter' | 'growth' | 'business' | 'enterprise';

export interface TierLimits {
  /** Strings throughout so "Unlimited" and "Custom" are representable. */
  agents: string;
  contacts: string;
  messages: string;
  flows: string;
  numbers: string;
}

export interface PricingTier {
  id: TierId;
  name: string;
  positioning: string;
  /** Null renders a non-numeric custom-pricing label (Enterprise). */
  monthly: number | null;
  annual: number | null;
  mostPopular: boolean;
  limits: TierLimits;
  /** Condensed one-liner for the landing page teaser. */
  headlineLimits: string;
  /** Name of the tier this one builds on, or null for the entry tier. */
  inheritsFrom: string | null;
  features: string[];
  cta: { kind: TierCtaKind; label: string };
}

export interface PricingConfig {
  currencySymbol: string;
  /** Advertised annual discount. Verified against real prices at test time. */
  annualSavingsPct: number;
  tiers: PricingTier[];
  /** Clarifies that Meta per-message fees are billed separately. */
  metaChargesDisclaimer: string;
  /** Framing for the allowance rows, to avoid reading as WhatsApp quotas. */
  allowanceNote: string;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

export type IconName =
  | 'inbox'
  | 'robot'
  | 'megaphone'
  | 'flow'
  | 'plug'
  | 'stethoscope'
  | 'building'
  | 'bank'
  | 'truck'
  | 'graduation'
  | 'wrench'
  | 'cart'
  | 'car'
  | 'clock'
  | 'shield'
  | 'chart'
  | 'users'
  | 'sparkle'
  | 'check'
  | 'cross';

// ---------------------------------------------------------------------------
// Industries
// ---------------------------------------------------------------------------

/**
 * Drives the /industry index, all eight detail routes, and the landing-page
 * demo cards. One entry per industry, read by all three.
 */
export interface Industry {
  slug: string;
  name: string;
  /** The manual-process pain point, shown on the index card and detail page. */
  painPoint: string;
  /** Framing question used on the landing-page demo card. */
  question: string;
  /** Concrete JarCube automations — at least three per industry. */
  useCases: string[];
  icon: IconName;
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export interface FaqEntry {
  question: string;
  answer: string;
}

// ---------------------------------------------------------------------------
// Feature pages
// ---------------------------------------------------------------------------

export interface FeatureSection {
  heading: string;
  body: string;
}

export interface FeaturePage {
  slug: string;
  /** Short label used on the landing-page feature grid. */
  cardTitle: string;
  /** One-sentence grid description. */
  cardSummary: string;
  icon: IconName;
  /** Page <h1>. */
  title: string;
  intro: string;
  sections: FeatureSection[];
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO 8601 date. */
  date: string;
  readMinutes: number;
  author: string;
}

// ---------------------------------------------------------------------------
// Partner programme
// ---------------------------------------------------------------------------

export interface PartnerBenefit {
  title: string;
  body: string;
}

export interface PartnerFeatureItem {
  name: string;
  body: string;
}

export interface PartnerFeatureGroup {
  group: string;
  items: PartnerFeatureItem[];
}

export interface ResponsibilityEntry {
  title: string;
  owner: 'partner' | 'jarcube';
  body: string;
}

export interface ComparisonRow {
  category: string;
  /** Limitation of generic alternatives. Names no competitor product. */
  generic: string;
  jarcube: string;
}

export interface PartnerConfig {
  /** Commission table values are computed from this, never hard-coded. */
  commissionRatePct: number;
  monthlySalesExample: number;
  exampleMonths: number;
  benefits: PartnerBenefit[];
  modelTerms: string[];
  featureGroups: PartnerFeatureGroup[];
  responsibilities: ResponsibilityEntry[];
  comparison: ComparisonRow[];
}

/** One computed row of the partner commission illustration. */
export interface CommissionRow {
  month: number;
  sales: number;
  commission: number;
  cumulative: number;
  growthPct: number;
}

// ---------------------------------------------------------------------------
// Social proof
// ---------------------------------------------------------------------------

export interface LogoEntry {
  name: string;
  src: string;
  /** False keeps the entry out of the render until sign-off is recorded. */
  permissionObtained: boolean;
  /** Dark marks need a light backing surface to stay legible. */
  needsLightBacking: boolean;
}

export interface Testimonial {
  quote: string;
  attribution: string;
  organisation: string;
  /** Optional headline figure, e.g. "3x faster replies". */
  metric?: string;
}

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export interface ProcessStep {
  heading: string;
  body: string;
}
