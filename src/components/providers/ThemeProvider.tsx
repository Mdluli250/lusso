'use client';

/**
 * ThemeProvider — applies the luxury warm palette on initial load.
 *
 * Single-theme provider. The dark mode toggle has been removed as part
 * of the luxury rebrand. This component ensures CSS variables are set
 * correctly on mount.
 */

import { useEffect } from 'react';
import { LUXURY_THEME } from '@/store/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply luxury theme CSS variables to :root
    const root = document.documentElement;
    Object.entries(LUXURY_THEME).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  return <>{children}</>;
}
