import type { ColorTheme } from '@/types';

/**
 * Maps scent profile names (lowercase) to their corresponding ColorTheme values.
 * These drive the CSS variable transitions (--theme-bg, --theme-accent) on :root.
 */
export const SCENT_COLOR_MAP: Record<string, ColorTheme> = {
  lavender: { bg: '#2D1B69', accent: '#9B59B6' },
  cinnamon: { bg: '#4A1C00', accent: '#E67E22' },
  vanilla: { bg: '#3D2B1F', accent: '#F5DEB3' },
  rose: { bg: '#4A0E2E', accent: '#E91E63' },
  eucalyptus: { bg: '#0D3B2E', accent: '#27AE60' },
  sandalwood: { bg: '#3E2723', accent: '#8D6E63' },
  ocean: { bg: '#0D1B2A', accent: '#2980B9' },
  citrus: { bg: '#3D2E00', accent: '#F39C12' },
  cedar: { bg: '#2E1A0F', accent: '#5D4037' },
};

/** Default theme used when a scent profile has no mapping. */
const DEFAULT_THEME: ColorTheme = { bg: '#1A1A1A', accent: '#FFFFFF' };

/**
 * Returns the ColorTheme for a given scent profile string.
 * Falls back to the default dark theme for unknown scents.
 *
 * @param scentProfile - e.g. "Lavender", "cinnamon", "Vanilla"
 */
export function getColorTheme(scentProfile: string): ColorTheme {
  return SCENT_COLOR_MAP[scentProfile.toLowerCase()] ?? DEFAULT_THEME;
}
