import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface ThemeStore {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
  getSystemPreference: () => ThemeMode;
}

export const LIGHT_THEME: Record<string, string> = {
  '--theme-bg': '#FAFAFA',
  '--theme-accent': '#1A1A1A',
  '--background': '#FFFFFF',
  '--foreground': '#1A1A1A',
  '--surface': '#F5F5F5',
  '--surface-muted': '#EEEEEE',
  '--border': '#E0E0E0',
  '--muted': '#666666',
};

export const DARK_THEME: Record<string, string> = {
  '--theme-bg': '#1A1A1A',
  '--theme-accent': '#FFFFFF',
  '--background': '#0D0D0D',
  '--foreground': '#F5F5F5',
  '--surface': '#1F1F1F',
  '--surface-muted': '#2A2A2A',
  '--border': '#333333',
  '--muted': '#888888',
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'dark' as ThemeMode,

      toggle: () => {
        set((state) => ({
          mode: state.mode === 'dark' ? 'light' : 'dark',
        }));
      },

      setMode: (mode: ThemeMode) => {
        set({ mode });
      },

      getSystemPreference: (): ThemeMode => {
        if (typeof window === 'undefined') return 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
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
