import { create } from 'zustand';

export type ThemeMode = 'light';

interface ThemeStore {
  mode: ThemeMode;
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

export const useThemeStore = create<ThemeStore>()(() => ({
  mode: 'light' as ThemeMode,
}));
