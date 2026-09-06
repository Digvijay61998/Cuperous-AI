import type { FeatureFlags } from '../types';

/**
 * Build-time feature flags.
 *
 * A disabled section is omitted from the rendered output entirely rather than
 * hidden with CSS, so shipping one switched off costs nothing in page weight.
 *
 * `pricing` is deliberately one flag covering three surfaces: the /pricing
 * page body, the landing-page teaser, and the nav link. Turning it off cannot
 * leave a link pointing at an empty page.
 */
export const flags: FeatureFlags = {
  // Pricing is live — four tiers with the monthly/annual toggle.
  pricing: true,

  // Off until written logo permission is recorded per company.
  logoWall: false,

  // Off until real customer quotes are supplied.
  testimonials: false,

  blogTeasers: true,
  pricingTeaser: true,
};
