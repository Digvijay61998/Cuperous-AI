import React, { useEffect, useRef, useState } from 'react';
import Wordmark from './Wordmark';
import { site } from '../content/site';
import { flags } from '../content/flags';
import { buildWhatsAppLink, messageTemplates } from '../utils/whatsapp';

interface NavLink {
  label: string;
  href: string;
}

/**
 * Nav links, filtered by feature flag.
 *
 * The pricing link is omitted when the pricing flag is off — turning pricing
 * off must not leave a link pointing at a page with no tiers on it.
 */
const navLinks = (): NavLink[] => {
  const links: NavLink[] = [];
  if (flags.pricing) links.push({ label: 'Pricing', href: '/pricing' });
  links.push({ label: 'Industries', href: '/industry' });
  links.push({ label: 'Partner', href: '/partner' });
  links.push({ label: 'Blog', href: '/blog' });
  links.push({ label: 'Contact', href: '/contact' });
  return links;
};

interface NavHeaderProps {
  /** Current route path, used to mark the active link. */
  currentPath: string;
}

const NavHeader: React.FC<NavHeaderProps> = ({ currentPath }) => {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const links = navLinks();

  const close = () => {
    setOpen(false);
    // Return focus to the control that opened the menu, so keyboard users are
    // not dropped back at the top of the document.
    toggleRef.current?.focus();
  };

  // Escape closes the menu wherever focus currently sits.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Prevent the page scrolling behind the open mobile panel.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const ctaHref = buildWhatsAppLink(
    site.whatsappNumber,
    messageTemplates.general,
  );

  return (
    <header className="jc-nav">
      <nav className="jc-nav__inner" aria-label="Main">
        <a className="jc-nav__brand" href="/" aria-label={`${site.brandName} home`}>
          <Wordmark />
        </a>

        <ul className="jc-nav__links">
          {links.map((link) => {
            const active = currentPath === link.href;
            return (
              <li key={link.href}>
                <a
                  className={`jc-nav__link${active ? ' jc-nav__link--active' : ''}`}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="jc-nav__actions">
          <a className="jc-btn jc-btn--primary jc-nav__cta" href={ctaHref}>
            Get started
          </a>

          <button
            ref={toggleRef}
            type="button"
            className="jc-nav__toggle"
            aria-expanded={open}
            aria-controls="jc-mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => (open ? close() : setOpen(true))}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              focusable="false"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Kept in the DOM so the aria-controls reference always resolves. */}
      <div
        id="jc-mobile-menu"
        className={`jc-nav__mobile${open ? ' jc-nav__mobile--open' : ''}`}
        hidden={!open}
      >
        <ul className="jc-nav__mobile-links">
          {links.map((link) => (
            <li key={link.href}>
              <a
                className="jc-nav__mobile-link"
                href={link.href}
                aria-current={currentPath === link.href ? 'page' : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a className="jc-btn jc-btn--primary jc-btn--block" href={ctaHref}>
          Get started
        </a>
      </div>
    </header>
  );
};

export default NavHeader;
