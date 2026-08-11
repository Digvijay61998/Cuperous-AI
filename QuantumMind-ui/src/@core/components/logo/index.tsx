import React from 'react'

// ** Config
import themeConfig from 'src/configs/themeConfig'

type Props = {
  width?: number
  height?: number

  /** Extra inline styles merged over the defaults. */
  style?: React.CSSProperties
}

/**
 * The JarCube brand mark.
 *
 * Single source of truth for the app logo — every surface (vertical nav header,
 * app bars, login, fallback spinner) renders through this component, so swapping
 * `public/logo.png` updates the whole app.
 *
 * The mark is wider than it is tall and ships on a transparent background, so it
 * is scaled with `object-fit: contain` rather than being cropped to a circle
 * (the old circular crop clipped the sides of the cube).
 */
export default function Logo({ width = 40, height = 40, style }: Props) {
  return (
    <img
      src='/logo.png'
      alt={`${themeConfig.templateName} logo`}
      width={width}
      height={height}
      style={{ objectFit: 'contain', display: 'block', flexShrink: 0, ...style }}
    />
  )
}
