import { Platform } from 'react-native';

/**
 * Storage de guerra para Expo Go / entrega.
 *
 * No importa expo-secure-store a propósito: en Expo Go desincronizado puede tirar
 * "getValueWithKeyAsync is not a function" y dejar la app en bootloop.
 * Para HOY priorizamos que la app arranque y navegue siempre.
 *
 * - Web: localStorage.
 * - Android/iOS Expo Go: memoria durante la sesión.
 *
 * Cuando armemos development build estable, volvemos a SecureStore.
 */
const memoryStorage: Record<string, string> = {};
const isWeb = Platform.OS === 'web';

function hasLocalStorage() {
  return isWeb && typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
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
