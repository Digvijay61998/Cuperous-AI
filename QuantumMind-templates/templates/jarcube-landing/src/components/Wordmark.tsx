import React from 'react';
import { site } from '../content/site';

/**
 * JarCube wordmark: an isometric cube glyph beside the brand name.
 *
 * The cube is three rhombi sharing a centre vertex, which reads as a box from
 * any size and stays legible at 24px in the nav. Drawn as SVG so it inherits
 * currentColor and scales without a raster asset.
 */

interface WordmarkProps {
  /** Renders the glyph only, for tight spaces. */
  markOnly?: boolean;
  className?: string;
}

export const CubeMark: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {/* Top face — lightest, catches the light */}
    <path d="M16 3.5 28 10 16 16.5 4 10z" fill="var(--jc-primary)" opacity="0.95" />
    {/* Left face — mid tone */}
    <path d="M4 10v12l12 6.5V16.5z" fill="var(--jc-primary)" opacity="0.65" />
    {/* Right face — darkest, in shadow */}
    <path d="M28 10v12L16 28.5V16.5z" fill="var(--jc-primary)" opacity="0.4" />
    {/* Accent spark on the top face, tying to the accent token */}
    <circle cx="16" cy="10" r="2.2" fill="var(--jc-accent)" />
  </svg>
);

const Wordmark: React.FC<WordmarkProps> = ({ markOnly = false, className }) => (
  <span className={`jc-wordmark ${className ?? ''}`}>
    <CubeMark />
    {markOnly ? null : (
      <span className="jc-wordmark__text">{site.brandName}</span>
    )}
  </span>
);

export default Wordmark;
