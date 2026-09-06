import type { SiteConfig } from '../types';

/**
 * Single source of truth for every contact detail on the site.
 *
 * Nothing else should hard-code the WhatsApp number, an email address or an
 * office address — components read them from here so a change lands once.
 */
export const site: SiteConfig = {
  brandName: 'JarCube',
  tagline: 'Every customer conversation, handled.',

  // E.164 without the leading "+", which is what wa.me expects.
  whatsappNumber: '917558510587',

  emails: [
    { label: 'General enquiries', address: 'hello@jarcube.com' },
    { label: 'Support', address: 'support@jarcube.com' },
  ],

  phones: [
    { label: 'WhatsApp & calls', e164: '917558510587', display: '+91 75585 10587' },
  ],

  // Empty until real addresses are confirmed. The contact page omits the
  // address section entirely rather than rendering a blank container.
  offices: [],

  officeHours: 'Monday to Friday, 9:00 AM – 6:00 PM IST',

  socials: [
    { platform: 'LinkedIn', url: 'https://www.linkedin.com/company/jarcube' },
    { platform: 'Instagram', url: 'https://www.instagram.com/jarcube' },
    { platform: 'YouTube', url: 'https://www.youtube.com/@jarcube' },
  ],

  baseUrl: 'https://jarcube.com',

  // Null until a signup destination exists. While null, trial and sign-up
  // CTAs resolve to a WhatsApp deep link instead of a dead href.
  signupUrl: null,

  legalEntity: 'JarCube',
};
