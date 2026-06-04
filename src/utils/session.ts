import { Platform } from 'react-native';
import { router } from 'expo-router';

export function hardRedirectToLogin() {
  router.replace('/login' as any);

  // En Expo Web, a veces el estado queda vivo dentro del bundle aunque router.replace haya corrido.
  // Si seguimos en web, hacemos un redirect duro para garantizar pantalla limpia.
  if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && 'window' in globalThis) {
    setTimeout(() => {
      try {
        const win = (globalThis as any).window;
        const path = win?.location?.pathname ?? '';
        if (!path.endsWith('/login')) {
          win.location.replace('/login');
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
