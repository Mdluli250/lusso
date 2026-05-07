'use client';

/**
 * ThemeToggle — sun/moon icon button for toggling dark/light mode.
 *
 * Uses useThemeStore to toggle mode and calls AnimationEngine.animateColorTheme
 * with LIGHT_THEME or DARK_THEME values.
 *
 * Requirements: 10.1, 10.2, 10.5
 */

import { useThemeStore, LIGHT_THEME, DARK_THEME } from '@/store/themeStore';
import { animationEngine } from '@/components/animation/AnimationEngine';

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);

  const handleToggle = () => {
    toggle();
    // After toggling, the new mode is the opposite of current
    const newMode = mode === 'dark' ? 'light' : 'dark';
    const theme = newMode === 'light' ? LIGHT_THEME : DARK_THEME;
    // Apply all CSS variables to :root for full theme switch
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    animationEngine.animateColorTheme(theme['--theme-bg'], theme['--theme-accent']);
  };

  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[var(--theme-accent)]/70 hover:text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 transition-all duration-200"
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mode === 'dark' ? (
        /* Sun icon — shown in dark mode to indicate "switch to light" */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      ) : (
        /* Moon icon — shown in light mode to indicate "switch to dark" */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      )}
    </button>
  );
}
