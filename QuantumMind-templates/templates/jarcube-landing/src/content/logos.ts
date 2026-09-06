import type { LogoEntry } from '../types';

/**
 * Customer logo manifest.
 *
 * `permissionObtained` gates rendering per entry. Set it true only once
 * written sign-off from that company is on file — putting a company's mark on
 * your site implies an endorsement, and that is theirs to grant.
 *
 * Entries can sit here indefinitely with the flag false. Nothing breaks, and
 * the LogoWall omits itself entirely while no entry qualifies.
 *
 * `needsLightBacking` is for predominantly dark marks that would disappear
 * against a light section background.
 */
export const logos: LogoEntry[] = [
  // Pending written permission — not rendered while permissionObtained is false.
  // {
  //   name: 'Star Health Insurance',
  //   src: '/assets/logos/star-health.png',
  //   permissionObtained: false,
  //   needsLightBacking: false,
  // },
  // {
  //   name: 'LeadSquared',
  //   src: '/assets/logos/leadsquared.png',
  //   permissionObtained: false,
  //   needsLightBacking: false,
  // },
];

/** Only entries cleared for use reach the render. */
export const permittedLogos = (): LogoEntry[] =>
  logos.filter((l) => l.permissionObtained);
