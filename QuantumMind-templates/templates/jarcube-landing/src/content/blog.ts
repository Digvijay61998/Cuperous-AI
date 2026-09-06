import type { BlogPost } from '../types';

/**
 * Blog post index.
 *
 * Excerpts only — full post pages are out of scope for this build. The
 * blogTeasers flag and the empty-content guard mean this can be trimmed to an
 * empty array without leaving a broken section behind.
 */
export const blogPosts: BlogPost[] = [
  {
    slug: 'whatsapp-business-account-restricted',
    title: 'Your WhatsApp Business account got restricted. Here is what to do.',
    excerpt:
      'Restrictions almost always trace back to a handful of causes: message quality ratings falling, template rejections stacking up, or a policy trip nobody noticed. Here is how to work out which one hit you and how to get back to sending.',
    date: '2026-02-18',
    readMinutes: 7,
    author: 'JarCube Team',
  },
  {
    slug: 'whatsapp-business-app-vs-api',
    title: 'WhatsApp Business app or API? How to tell which one you have outgrown.',
    excerpt:
      'The free app is genuinely fine until it is not. The switch usually comes down to three things: how many people need to answer, whether you need automation that survives contact with real customers, and what your message volume looks like.',
    date: '2026-02-11',
    readMinutes: 9,
    author: 'JarCube Team',
  },
  {
    slug: 'click-to-whatsapp-ads-no-messages',
    title: 'Your Click-to-WhatsApp ads get clicks but nobody messages. Why.',
    excerpt:
      'Clicks without conversations nearly always means the gap between ad and first reply is doing the damage — an empty chat window, a slow first response, or a greeting that gives people nothing to react to.',
    date: '2026-02-04',
    readMinutes: 6,
    author: 'JarCube Team',
  },
];
