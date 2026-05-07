'use client';

import { useEffect } from 'react';
import { animationEngine } from './AnimationEngine';
import { getColorTheme } from '../../lib/scentColorMap';

/**
 * React hook that animates the CSS color theme whenever `colorHex` changes.
 * Looks up the `ColorTheme` via `getColorTheme` and calls
 * `animationEngine.animateColorTheme()` to smoothly transition
 * `--theme-bg` and `--theme-accent` on `:root`.
 *
 * @param colorHex - The scent profile string (e.g. "lavender", "cinnamon") or null to skip animation.
 *
 * Requirements: 3.4, 5.4
 */
export function useColorTheme(colorHex: string | null): void {
  useEffect(() => {
    if (colorHex === null) return;

    const theme = getColorTheme(colorHex);
    animationEngine.animateColorTheme(theme.bg, theme.accent);
  }, [colorHex]);
}
