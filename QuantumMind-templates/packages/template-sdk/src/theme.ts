/**
 * Minimal theming helper. Templates read brand values from their config
 * (primary_color, logo, etc.) and apply them as CSS variables so styling stays
 * data-driven and per-tenant customisable in future.
 */
export interface ThemeTokens {
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  darkMode?: boolean;
}

export const applyTheme = (tokens: ThemeTokens, target: HTMLElement = document.documentElement) => {
  const set = (name: string, value?: string) => {
    if (value) target.style.setProperty(name, value);
  };
  set('--qt-primary', tokens.primaryColor);
  set('--qt-secondary', tokens.secondaryColor);
  set('--qt-text', tokens.textColor);
  set('--qt-bg', tokens.backgroundColor);
  set('--qt-font', tokens.fontFamily);
  if (tokens.darkMode) {
    target.setAttribute('data-theme', 'dark');
  } else {
    target.removeAttribute('data-theme');
  }
};

export const themeFromConfig = (config: Record<string, any>): ThemeTokens => ({
  primaryColor: config.primary_color,
  secondaryColor: config.secondary_color,
  textColor: config.text_color,
  backgroundColor: config.background_color,
  fontFamily: config.font_family,
  darkMode: config.dark_mode === true || config.dark_mode === 'true',
});
