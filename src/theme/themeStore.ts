import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import { getMtTheme } from '../constants/mediturnosTheme';
import { storage } from '../api/storage';

export type ThemeMode = 'light' | 'dark' | 'system';
const THEME_KEY = 'mediturnos_theme_mode';

type ThemeState = {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  loadTheme: () => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  hydrated: false,

  setMode: async (mode) => {
    await storage.setItem(THEME_KEY, mode);
    set({ mode, hydrated: true });
  },

  toggleDarkMode: async () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    await get().setMode(next);
  },

  loadTheme: async () => {
    const saved = await storage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      set({ mode: saved, hydrated: true });
      return;
    }
    set({ mode: 'light', hydrated: true });
  },
}));

export function useResolvedThemeMode(): 'light' | 'dark' {
  const mode = useThemeStore((state) => state.mode);
  const systemScheme = useColorScheme();

  if (mode === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }

  return mode;
}

export function useMtTheme() {
  return getMtTheme(useResolvedThemeMode());
}
