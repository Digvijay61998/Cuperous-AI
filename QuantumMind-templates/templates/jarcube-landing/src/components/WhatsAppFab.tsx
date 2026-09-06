import React from 'react';
import { site } from '../content/site';
import { buildWhatsAppLink, messageTemplates } from '../utils/whatsapp';

/**
 * Persistent WhatsApp affordance, pinned bottom-right on every route.
 *
 * A plain anchor rather than a scripted widget: it works with JavaScript off,
 * costs nothing to render, and behaves correctly when opened in a new tab.
 */
const WhatsAppFab: React.FC = () => (
  <a
    className="jc-fab"
    href={buildWhatsAppLink(site.whatsappNumber, messageTemplates.general)}
    aria-label={`Message ${site.brandName} on WhatsApp`}
  >
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {/* Speech bubble with a tail, rather than the WhatsApp glyph itself —
          the brand mark is Meta's and not ours to redraw. */}
      <path d="M12 2.6c-5.2 0-9.4 3.9-9.4 8.7 0 2.7 1.3 5.1 3.4 6.7l-1 3.4 3.6-1.6c1.1.3 2.2.5 3.4.5 5.2 0 9.4-3.9 9.4-8.7S17.2 2.6 12 2.6z" />
      <circle cx="8.4" cy="11.3" r="1.15" fill="var(--jc-success)" />
      <circle cx="12" cy="11.3" r="1.15" fill="var(--jc-success)" />
      <circle cx="15.6" cy="11.3" r="1.15" fill="var(--jc-success)" />
    </svg>
    <span className="jc-fab__label">Chat with us</span>
  </a>
);

export default WhatsAppFab;
