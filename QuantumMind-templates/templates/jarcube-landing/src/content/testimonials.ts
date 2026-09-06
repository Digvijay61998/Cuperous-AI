import type { Testimonial } from '../types';

/**
 * Customer testimonials.
 *
 * Empty until real quotes are supplied by the customers themselves. A quote
 * attributed to a named company is an endorsement claim, so nothing goes in
 * here that the named party did not actually say and agree to publish.
 *
 * The Testimonials section omits itself while this array is empty, so the
 * landing page stays coherent in the meantime.
 */
export const testimonials: Testimonial[] = [];
