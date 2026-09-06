import React, { useEffect, useState } from 'react';
import { buildWhatsAppLink, messageTemplates } from '../utils/whatsapp';
import { site } from '../content/site';

const STORAGE_KEY = 'jc-announcement-dismissed';

/**
 * Dismissible announcement bar.
 *
 * localStorage access is wrapped both ways: a browser in private mode, or with
 * storage disabled, throws on access rather than returning null. Guarding means
 * the bar still renders and dismissal degrades to session-only, which is a
 * better outcome than the whole shell failing to mount.
 *
 * Renders nothing on first paint until the stored state is read, so a
 * previously-dismissed bar does not flash into view and then disappear.
 */
const AnnouncementBar: React.FC = () => {
  const [resolved, setResolved] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      // Storage unavailable — treat as not dismissed, session-only from here.
    }
    setResolved(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Persisting failed; the bar stays hidden for this session regardless.
    }
  };

  if (!resolved || dismissed) return null;

  return (
    <div className="jc-announcement" role="region" aria-label="Announcement">
      <div className="jc-announcement__inner">
        <p className="jc-announcement__text">
          New: build WhatsApp mini-apps your customers use without leaving the chat.
        </p>
        <a
          className="jc-announcement__cta"
          href={buildWhatsAppLink(site.whatsappNumber, messageTemplates.general)}
        >
          See how
        </a>
        <button
          type="button"
          className="jc-announcement__close"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
