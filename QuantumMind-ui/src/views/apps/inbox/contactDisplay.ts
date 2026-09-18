import { InboxThread } from 'src/services/socket.services';

/**
 * Presentation rules for a channel contact, shared by the sidebar row and the
 * thread header so the two can never disagree about what a contact is called.
 *
 * The server already decides the LABEL (see `toThreadName` in inbox.mapper.ts).
 * What is decided here is purely visual: whether initials mean anything, and
 * whether the phone number adds information or just prints twice.
 */

/**
 * The secondary line under a contact's name.
 *
 * Empty when the name IS the phone number. The server falls back to a formatted
 * number when a contact has no display name, and repeating it underneath tells the
 * agent nothing while making every nameless row look twice as noisy.
 *
 * The raw `chatId` is never shown: for a privacy-mode contact it is an `@lid`,
 * which reads as a bug rather than as a person.
 */
export const contactSubtitle = (thread: InboxThread): string => {
  if (!thread.hasContactName) return '';

  return thread.phoneLabel || thread.phone || '';
};

/**
 * Initials for the avatar, or null to fall back to a generic icon.
 *
 * Null when the label is a phone number or a placeholder: `getInitials` on
 * `+91 82083 23163` yields punctuation and digits, which looks like a rendering
 * fault. A person glyph is the honest representation of "we do not know who this
 * is".
 */
export const contactInitialsSource = (thread: InboxThread): string | null =>
  thread.hasContactName && thread.name ? thread.name : null;
