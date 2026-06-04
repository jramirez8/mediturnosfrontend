import { Platform } from 'react-native';

/**
 * Storage simple para Expo Go/Web.
 * No importa expo-secure-store para evitar bootloops en Expo Go desincronizado.
 */
const memoryStorage: Record<string, string> = {};
const isWeb = Platform.OS === 'web';

function hasLocalStorage() {
  return isWeb && typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
}

const AUTH_KEYS = [
  'access_token',
  'usuario_id',
  'paciente_id',
  'role',
  'token',
  'jwt',
  'auth',
];

export async function hardClearAuthStorage(): Promise<void> {
  Object.keys(memoryStorage).forEach((key) => delete memoryStorage[key]);

  if (hasLocalStorage()) {
    try {
      AUTH_KEYS.forEach((key) => globalThis.localStorage.removeItem(key));
      if ('sessionStorage' in globalThis) {
        AUTH_KEYS.forEach((key) => globalThis.sessionStorage.removeItem(key));
      }

      Object.keys(globalThis.localStorage)
        .filter((key) => {
          const lower = key.toLowerCase();
          return lower.includes('mediturnos') || lower.includes('auth') || lower.includes('token') || lower.includes('usuario') || lower.includes('paciente');
        })
        .forEach((key) => globalThis.localStorage.removeItem(key));

      if ('sessionStorage' in globalThis) {
        Object.keys(globalThis.sessionStorage)
          .filter((key) => {
            const lower = key.toLowerCase();
            return lower.includes('mediturnos') || lower.includes('auth') || lower.includes('token') || lower.includes('usuario') || lower.includes('paciente');
          })
          .forEach((key) => globalThis.sessionStorage.removeItem(key));
      }
    } catch {
      // si el browser bloquea localStorage, igual ya limpiamos memoria
    }
  }
}

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (hasLocalStorage()) {
      try {
        return globalThis.localStorage.getItem(key);
      } catch {
        return memoryStorage[key] ?? null;
      }
    }

    return memoryStorage[key] ?? null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    memoryStorage[key] = value;

    if (hasLocalStorage()) {
      try {
        globalThis.localStorage.setItem(key, value);
      } catch {
        // fallback memoria ya guardado arriba
      }
    }
  },

  deleteItem: async (key: string): Promise<void> => {
    delete memoryStorage[key];

    if (hasLocalStorage()) {
      try {
        globalThis.localStorage.removeItem(key);
      } catch {
        // nada
      }
    }
  },
};
