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
    bg: '#FBF9FF',
    surface: 'rgba(255,255,255,0.93)',
    surfaceMuted: '#F3EEFF',
    primary: '#7C3AED',
    primaryDark: '#4C1D95',
    primaryLight: '#EDE7FF',
    secondary: '#A855F7',
    ink: '#24104F',
    muted: '#756B91',
    soft: '#A39AB8',
    border: '#E4D8FA',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    purple: '#8B5CF6',
    overlay: 'rgba(124, 58, 237, 0.09)',
  },
  radius: { sm: 14, md: 20, lg: 28, xl: 36 },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 },
  shadow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 5,
  },
};

export const darkMt: MediturnosTheme = {
  ...lightMt,
  mode: 'dark',
  colors: {
    bg: '#120821',
    surface: 'rgba(31, 20, 52, 0.94)',
    surfaceMuted: '#24143E',
    primary: '#C4B5FD',
    primaryDark: '#EDE9FE',
    primaryLight: '#37215F',
    secondary: '#A78BFA',
    ink: '#FBF9FF',
    muted: '#C9BFE4',
    soft: '#9588B7',
    border: '#4B3478',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    purple: '#C084FC',
    overlay: 'rgba(196, 181, 253, 0.11)',
  },
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
    elevation: 5,
  },
};

export function getMtTheme(mode: 'light' | 'dark') {
  return mode === 'dark' ? darkMt : lightMt;
}

export const mt = lightMt;
