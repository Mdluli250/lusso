'use client';

/**
 * ThemeProvider — applies the correct theme on initial load.
 *
 * On mount, checks if there's a stored theme preference. If not,
 * detects system preference and applies it. Also applies the current
 * theme's CSS variables via AnimationEngine.
 *
 * Requirements: 10.2, 10.4, 10.5
 */

import { useEffect } from 'react';
import { useThemeStore, LIGHT_THEME, DARK_THEME } from '@/store/themeStore';
import { animationEngine } from '@/components/animation/AnimationEngine';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const getSystemPreference = useThemeStore((s) => s.getSystemPreference);

  useEffect(() => {
    // Check if there's a stored preference in localStorage
    const stored = localStorage.getItem('lusso-theme');
    if (!stored) {
      // No stored preference — apply system preference
      const systemPref = getSystemPreference();
      setMode(systemPref);
    }
  }, [getSystemPreference, setMode]);

  // Apply theme CSS variables whenever mode changes
  useEffect(() => {
    const theme = mode === 'light' ? LIGHT_THEME : DARK_THEME;
    // Apply all CSS variables to :root
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    // Also animate the main theme colors for smooth transition
    animationEngine.animateColorTheme(theme['--theme-bg'], theme['--theme-accent']);
  }, [mode]);

  return <>{children}</>;
}
