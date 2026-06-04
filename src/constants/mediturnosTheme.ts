export type MediturnosTheme = {
  mode: 'light' | 'dark';
  colors: {
    bg: string; surface: string; surfaceMuted: string; primary: string; primaryDark: string; primaryLight: string; secondary: string; ink: string; muted: string; soft: string; border: string; success: string; warning: string; danger: string; purple: string; overlay: string;
  };
  radius: { sm: number; md: number; lg: number; xl: number };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  shadow: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number };
};

export const lightMt: MediturnosTheme = {
  mode: 'light' as const,
  colors: {
    bg: '#F6FAF9',
    surface: '#FFFFFF',
    surfaceMuted: '#ECFDF5',
    primary: '#0F766E',
    primaryDark: '#115E59',
    primaryLight: '#CCFBF1',
    secondary: '#2563EB',
    ink: '#0F172A',
    muted: '#64748B',
    soft: '#94A3B8',
    border: '#DDEBE8',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    purple: '#7C3AED',
    overlay: 'rgba(15, 23, 42, 0.08)',
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 26,
    xl: 34,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
};

export const darkMt: MediturnosTheme = {
  ...lightMt,
  mode: 'dark',
  colors: {
    bg: '#071312',
    surface: '#0F1F1D',
    surfaceMuted: '#12312D',
    primary: '#2DD4BF',
    primaryDark: '#99F6E4',
    primaryLight: '#134E4A',
    secondary: '#60A5FA',
    ink: '#E6FFFB',
    muted: '#9FB9B4',
    soft: '#6D8782',
    border: '#214540',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    purple: '#C4B5FD',
    overlay: 'rgba(230, 255, 251, 0.08)',
  },
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 3,
  },
};

export function getMtTheme(mode: 'light' | 'dark') {
  return mode === 'dark' ? darkMt : lightMt;
}

// Compatibilidad hacia atrás: varios archivos viejos importan `mt`.
// La UI nueva usa useMtTheme() para cambiar en caliente.
export const mt = lightMt;
