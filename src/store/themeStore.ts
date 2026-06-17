import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light';

interface ThemeStore {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
  getSystemPreference: () => ThemeMode;
}

/** Luxury warm palette — the only theme */
export const LUXURY_THEME: Record<string, string> = {
  '--theme-bg': '#faf7f2',
  '--theme-accent': '#2c2825',
  '--background': '#faf7f2',
  '--foreground': '#2c2825',
  '--surface': '#ffffff',
  '--surface-muted': '#f5f0ea',
  '--border': '#e8dfd5',
  '--muted': '#7a7068',
};

/** @deprecated Kept for backward compatibility — resolves to LUXURY_THEME */
export const LIGHT_THEME = LUXURY_THEME;
/** @deprecated Kept for backward compatibility — resolves to LUXURY_THEME */
export const DARK_THEME = LUXURY_THEME;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'light' as ThemeMode,

      toggle: () => {
        // No-op — single theme only
      },

      setMode: () => {
        // Always light/luxury
        set({ mode: 'light' });
      },

      getSystemPreference: (): ThemeMode => {
        return 'light';
      },
    }),
    {
      name: 'lusso-theme',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);
