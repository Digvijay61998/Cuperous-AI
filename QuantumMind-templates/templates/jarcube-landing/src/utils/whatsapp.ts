/**
 * WhatsApp deep-link composition.
 *
 * Every CTA and form on the site routes through here. The site is statically
 * hosted with no backend, so a wa.me link is the only lead channel — which
 * makes correct encoding the whole ballgame. User-entered text goes into a URL
 * query parameter, so anything unencoded could inject extra parameters or
 * silently truncate the message at an `&`.
 */

/** Strips anything that is not a digit, so "+91 755 8510587" still works. */
const normaliseNumber = (raw: string): string => raw.replace(/\D/g, '');

/**
 * Build a wa.me link with a pre-composed message.
 *
 * The message is encoded with encodeURIComponent, which escapes `&`, `?`, `#`,
 * `=`, `+` and newlines — so the result always has exactly one `text`
 * parameter regardless of what the user typed.
 */
export function buildWhatsAppLink(number: string, message: string): string {
  const digits = normaliseNumber(number);
  if (!digits) {
    throw new Error('buildWhatsAppLink: number must contain at least one digit');
  }

  // No message means open the chat with an empty composer.
  if (!message) return `https://wa.me/${digits}`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Interpolate `{placeholder}` tokens in a template from a field map.
 *
 * Returns the raw (unencoded) message — buildWhatsAppLink handles encoding.
 * Splitting it this way means there is exactly one place encoding happens, so
 * it cannot be double-applied or forgotten.
 *
 * Unmatched placeholders resolve to an empty string rather than being left
 * as literal braces in the customer's message.
 */
export function composeLeadMessage(
  template: string,
  fields: Record<string, string> = {},
): string {
  return template
    .replace(/\{(\w+)\}/g, (_match, key: string) => fields[key] ?? '')
    // Collapse blank lines left behind by empty optional fields.
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Message templates used across the site. */
export const messageTemplates = {
  general: 'Hi JarCube — I would like to know more about the platform.',

  demo:
    'Hi JarCube — I would like to book a demo.\n\nName: {name}\nBusiness: {business}',

  pricingTier:
    'Hi JarCube — I am interested in the {tier} plan. Could you tell me more?',

  contact:
    'Hi JarCube — new enquiry.\n\nName: {name}\nBusiness: {business}\nPhone: {phone}\n\n{message}',

  partner:
    'Hi JarCube — I would like to apply to the partner programme.\n\nName: {name}\nBusiness: {business}\nPhone: {phone}\n\n{message}',

  newsletter:
    'Hi JarCube — please add me to the newsletter.\n\nEmail: {email}',

  industry:
    'Hi JarCube — I run a business in {industry} and would like to see how JarCube would work for us.',
} as const;

/**
 * Resolve a tier CTA to a destination.
 *
 * While `signupUrl` is null the trial and signup CTAs fall back to WhatsApp,
 * so no plan button ever renders as a dead link.
 */
export function resolveTierCtaHref(
  kind: 'trial' | 'signup' | 'demo' | 'sales',
  tierName: string,
  whatsappNumber: string,
  signupUrl: string | null,
): string {
  if ((kind === 'trial' || kind === 'signup') && signupUrl) {
    const url = new URL(signupUrl);
    url.searchParams.set('plan', tierName.toLowerCase());
    return url.toString();
  }

  return buildWhatsAppLink(
    whatsappNumber,
    composeLeadMessage(messageTemplates.pricingTier, { tier: tierName }),
  );
}
