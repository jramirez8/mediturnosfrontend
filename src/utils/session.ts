import { Platform } from 'react-native';
import { router } from 'expo-router';

type BrowserWindow = {
  location?: {
    pathname?: string;
    search?: string;
    replace: (path: string) => void;
  };
};

export function hardRedirectToLogin(params?: Record<string, string>) {
  const query = params ? new URLSearchParams(params).toString() : '';
  const loginPath = query ? `/login?${query}` : '/login';

  router.replace(loginPath);

  // En Expo Web, a veces el estado queda vivo dentro del bundle aunque router.replace haya corrido.
  // Si seguimos en web, hacemos un redirect duro para garantizar pantalla limpia.
  if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && 'window' in globalThis) {
    setTimeout(() => {
      try {
        const win = (globalThis as unknown as { window?: BrowserWindow }).window;
        const location = win?.location;
        if (location && ((location.pathname ?? '') !== '/login' || (query && location.search !== `?${query}`))) {
          location.replace(loginPath);
        }
      } catch {
        // router.replace ya intentó navegar; no rompemos la app por esto.
      }
    }, 80);
  }
}

export async function logoutAndGoToLogin(logout: () => Promise<void>) {
  try {
    await logout();
  } finally {
    hardRedirectToLogin();
  }
}
