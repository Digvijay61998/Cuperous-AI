import type { RouteDef } from '../types';

/**
 * The single source of truth for the site's route list.
 *
 * Three consumers read this array:
 *   1. vite.config.ts  — turns it into rollupOptions.input
 *   2. scripts/postbuild.ts — emits sitemap.xml from it
 *   3. NavHeader / Footer — resolve their links from it
 *
 * Because all three derive from one array, a route cannot exist in the build
 * without appearing in the sitemap, or be linked without being built.
 *
 * Nested paths emit as `<dir>/index.html` so S3 static website hosting
 * resolves them with no rewrite rule.
 */

/** Industry detail slugs. Kept adjacent to industries.ts content. */
export const INDUSTRY_SLUGS = [
  'healthcare',
  'real-estate',
  'finance',
  'distributors',
  'education',
  'home-services',
  'e-commerce',
  'automobiles',
] as const;

/** Feature detail slugs. */
export const FEATURE_SLUGS = [
  'whatsapp-api-integration',
  'knowledge-base',
  'marketing-campaigns',
  'shared-inbox',
  'flow-builder',
] as const;

export const routes: RouteDef[] = [
  {
    path: '/',
    entryName: 'index',
    htmlPath: 'index.html',
    title: 'JarCube — Turn WhatsApp Into Your Business Growth Engine',
    description:
      'JarCube turns WhatsApp into an AI assistant that works around the clock to capture leads, answer questions and keep customers coming back.',
  },
  {
    path: '/pricing',
    entryName: 'pricing',
    htmlPath: 'pricing/index.html',
    title: 'Pricing — JarCube',
    description:
      'Four straightforward plans, from ₹999 a month. Compare agent seats, contacts, automation allowances and flows across Starter, Growth, Business and Enterprise.',
  },
  {
    path: '/industry',
    entryName: 'industry',
    htmlPath: 'industry/index.html',
    title: 'Industries — JarCube',
    description:
      'See how healthcare, real estate, finance, retail and six other sectors put WhatsApp automation to work with JarCube.',
  },
  {
    path: '/partner',
    entryName: 'partner',
    htmlPath: 'partner/index.html',
    title: 'Become a Partner — JarCube',
    description:
      'Earn recurring commission reselling JarCube. Transparent revenue share, technical support handled by us, and a product your clients keep using.',
  },
  {
    path: '/contact',
    entryName: 'contact',
    htmlPath: 'contact/index.html',
    title: 'Contact JarCube',
    description:
      'Questions about putting JarCube to work in your business? Message us on WhatsApp, drop us an email, or give us a call.',
  },
  {
    path: '/blog',
    entryName: 'blog',
    htmlPath: 'blog/index.html',
    title: 'Blog — JarCube',
    description:
      'Practical writing on WhatsApp Business: automation patterns, campaign tactics and what actually moves conversion.',
  },
  {
    path: '/legal/privacy-policy',
    entryName: 'legal-privacy-policy',
    htmlPath: 'legal/privacy-policy/index.html',
    title: 'Privacy Policy — JarCube',
    description: 'How JarCube collects, uses and protects your information.',
  },
  {
    path: '/legal/terms-of-service',
    entryName: 'legal-terms-of-service',
    htmlPath: 'legal/terms-of-service/index.html',
    title: 'Terms of Service — JarCube',
    description: 'The terms that govern your use of the JarCube platform.',
  },

  // --- Industry detail routes (8) ---
  {
    path: '/industry/healthcare',
    entryName: 'industry-healthcare',
    htmlPath: 'industry/healthcare/index.html',
    title: 'WhatsApp Automation for Healthcare — JarCube',
    description:
      'Cut call volume and missed follow-ups. Let patients book appointments, collect reports and get answers over WhatsApp.',
  },
  {
    path: '/industry/real-estate',
    entryName: 'industry-real-estate',
    htmlPath: 'industry/real-estate/index.html',
    title: 'WhatsApp Automation for Real Estate — JarCube',
    description:
      'Answer property enquiries in seconds and send brochures and floor plans straight into the chat.',
  },
  {
    path: '/industry/finance',
    entryName: 'industry-finance',
    htmlPath: 'industry/finance/index.html',
    title: 'WhatsApp Automation for Finance — JarCube',
    description:
      'Share statements and forms securely, qualify leads and clear repeat queries without tying up your team.',
  },
  {
    path: '/industry/distributors',
    entryName: 'industry-distributors',
    htmlPath: 'industry/distributors/index.html',
    title: 'WhatsApp Automation for Distributors — JarCube',
    description:
      'Take orders, confirm stock and answer pricing and delivery questions without the daily back-and-forth.',
  },
  {
    path: '/industry/education',
    entryName: 'industry-education',
    htmlPath: 'industry/education/index.html',
    title: 'WhatsApp Automation for Education — JarCube',
    description:
      'Handle admission enquiries at volume, send prospectuses on request and explain fees without repeating yourself.',
  },
  {
    path: '/industry/home-services',
    entryName: 'industry-home-services',
    htmlPath: 'industry/home-services/index.html',
    title: 'WhatsApp Automation for Home Services — JarCube',
    description:
      'Book jobs, confirm slots and cut no-shows with reminders that go out on their own.',
  },
  {
    path: '/industry/e-commerce',
    entryName: 'industry-e-commerce',
    htmlPath: 'industry/e-commerce/index.html',
    title: 'WhatsApp Automation for E-commerce — JarCube',
    description:
      'Send order updates, handle returns and answer product questions before the inbox piles up.',
  },
  {
    path: '/industry/automobiles',
    entryName: 'industry-automobiles',
    htmlPath: 'industry/automobiles/index.html',
    title: 'WhatsApp Automation for Automobiles — JarCube',
    description:
      'Book test drives, send service reminders and follow up on leads while they are still warm.',
  },

  // --- Feature detail routes (5) ---
  {
    path: '/features/whatsapp-api-integration',
    entryName: 'features-whatsapp-api-integration',
    htmlPath: 'features/whatsapp-api-integration/index.html',
    title: 'WhatsApp API & Webhook Integration — JarCube',
    description:
      'Connect JarCube to the tools you already run. Trigger actions with webhooks and APIs, and keep data in step across systems.',
  },
  {
    path: '/features/knowledge-base',
    entryName: 'features-knowledge-base',
    htmlPath: 'features/knowledge-base/index.html',
    title: 'AI Knowledge Base & Bot Training — JarCube',
    description:
      'Train your assistant on your own documents, website and CRM fields so its answers sound like your business.',
  },
  {
    path: '/features/marketing-campaigns',
    entryName: 'features-marketing-campaigns',
    htmlPath: 'features/marketing-campaigns/index.html',
    title: 'WhatsApp Marketing Campaigns — JarCube',
    description:
      'Run broadcasts and watch delivery, opens and clicks as they land, then act on what the numbers tell you.',
  },
  {
    path: '/features/shared-inbox',
    entryName: 'features-shared-inbox',
    htmlPath: 'features/shared-inbox/index.html',
    title: 'Multi-Agent Shared Inbox — JarCube',
    description:
      'Run a whole team on one WhatsApp number, with departments, roles and routing that puts each chat in the right hands.',
  },
  {
    path: '/features/flow-builder',
    entryName: 'features-flow-builder',
    htmlPath: 'features/flow-builder/index.html',
    title: 'Drag-and-Drop Flow Builder — JarCube',
    description:
      'Build automated WhatsApp journeys by dragging blocks around. No code, no waiting on a developer.',
  },

  // --- Error document (built, but kept out of the sitemap) ---
  {
    path: '/404',
    entryName: '404',
    htmlPath: '404.html',
    title: 'Page Not Found — JarCube',
    description: 'That page does not exist.',
    noIndex: true,
  },
];

/** Routes eligible for sitemap.xml. */
export const indexableRoutes = (): RouteDef[] =>
  routes.filter((r) => !r.noIndex);

/** Look up a route by its path. */
export const routeByPath = (path: string): RouteDef | undefined =>
  routes.find((r) => r.path === path);
