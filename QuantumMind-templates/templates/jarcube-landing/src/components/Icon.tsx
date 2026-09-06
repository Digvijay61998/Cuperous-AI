import React from 'react';
import type { IconName } from '../types';

/**
 * Inline SVG icon set, drawn from geometric primitives on a 24x24 grid.
 *
 * Inline rather than an icon font or sprite sheet: these currentColor-inherit,
 * cost no extra request, and there are few enough that a sprite would be
 * ceremony for no gain.
 *
 * Decorative by default (aria-hidden). Pass a `title` when an icon is the only
 * content of a control and needs an accessible name.
 */

interface IconProps {
  name: IconName;
  className?: string;
  title?: string;
}

const paths: Record<IconName, React.ReactNode> = {
  inbox: (
    <>
      <path d="M3 13h4l2 3h6l2-3h4" />
      <path d="M5 5h14l2 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" />
    </>
  ),
  robot: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 4v4" />
      <circle cx="9" cy="14" r="1.2" />
      <circle cx="15" cy="14" r="1.2" />
      <path d="M2 13v3M22 13v3" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
    </>
  ),
  flow: (
    <>
      <rect x="3" y="3" width="6" height="5" rx="1.5" />
      <rect x="15" y="8" width="6" height="5" rx="1.5" />
      <rect x="3" y="16" width="6" height="5" rx="1.5" />
      <path d="M9 5.5h3a2 2 0 0 1 2 2v3M9 18.5h3a2 2 0 0 0 2-2v-3" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v6M15 3v6" />
      <path d="M6 9h12v3a6 6 0 0 1-12 0z" />
      <path d="M12 18v3" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5 3v6a4 4 0 0 0 8 0V3" />
      <path d="M9 13v3a4 4 0 0 0 8 0v-2" />
      <circle cx="18" cy="11" r="2" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V6l7-3v18" />
      <path d="M11 10h7a1 1 0 0 1 1 1v10" />
      <path d="M7 9v.01M7 13v.01M7 17v.01M15 14v.01M15 18v.01" />
    </>
  ),
  bank: (
    <>
      <path d="M3 10 12 4l9 6" />
      <path d="M5 10v9M19 10v9M9 14v5M15 14v5" />
      <path d="M3 21h18" />
    </>
  ),
  truck: (
    <>
      <path d="M2 7h11v9H2z" />
      <path d="M13 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  graduation: (
    <>
      <path d="M12 4 2 9l10 5 10-5z" />
      <path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
    </>
  ),
  wrench: (
    <>
      <path d="M15 3a5 5 0 0 0-4.5 7.2L4 17v3h3l6.8-6.8A5 5 0 1 0 15 3z" />
      <path d="M6.5 17.5h.01" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.6L20 8H6" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </>
  ),
  car: (
    <>
      <path d="M4 15l1.5-5A2 2 0 0 1 7.4 8.6h9.2a2 2 0 0 1 1.9 1.4L20 15" />
      <path d="M3 15h18v3H3z" />
      <circle cx="7" cy="18.5" r="1.4" />
      <circle cx="17" cy="18.5" r="1.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.2 2.9 7.8 7 9 4.1-1.2 7-4.8 7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 20v-6M13 20V9M18 20v-9" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M17.5 14.2A5.5 5.5 0 0 1 21 20" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
};

const Icon: React.FC<IconProps> = ({ name, className, title }) => (
  <svg
    className={className ?? 'jc-icon'}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    focusable="false"
  >
    {title ? <title>{title}</title> : null}
    {paths[name]}
  </svg>
);

export default Icon;
