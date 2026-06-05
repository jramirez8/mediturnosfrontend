import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryStorage: Record<string, string> = {};
const isWeb = Platform.OS === 'web';

function hasLocalStorage() {
  return isWeb && typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
}

const AUTH_KEYS = [
  'access_token',
  'usuario_id',
  'paciente_id',
  'profesional_id',
  'role',
  'nombre_completo',
  'token',
  'jwt',
  'auth',
];

function shouldKeepPersistentDeviceAuthKey(key: string) {
  return key.startsWith('biometric_');
}

async function nativeGet(key: string) {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryStorage[key] ?? null;
  }
}

async function nativeSet(key: string, value: string) {
  memoryStorage[key] = value;
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // fallback memoria ya guardado
  }
}

async function nativeDelete(key: string) {
  delete memoryStorage[key];
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // nada
  }
}

export async function hardClearAuthStorage(): Promise<void> {
  Object.keys(memoryStorage)
    .filter((key) => !shouldKeepPersistentDeviceAuthKey(key))
    .forEach((key) => delete memoryStorage[key]);

  if (!isWeb) {
    await Promise.all(AUTH_KEYS.map((key) => nativeDelete(key)));
    return;
  }

  if (hasLocalStorage()) {
    try {
      AUTH_KEYS.forEach((key) => globalThis.localStorage.removeItem(key));
      if ('sessionStorage' in globalThis) {
        AUTH_KEYS.forEach((key) => globalThis.sessionStorage.removeItem(key));
      }

      Object.keys(globalThis.localStorage)
        .filter((key) => {
          const lower = key.toLowerCase();
          if (shouldKeepPersistentDeviceAuthKey(key)) return false;
          return lower.includes('mediturnos') || lower.includes('auth') || lower.includes('token') || lower.includes('usuario') || lower.includes('paciente');
        })
        .forEach((key) => globalThis.localStorage.removeItem(key));

      if ('sessionStorage' in globalThis) {
        Object.keys(globalThis.sessionStorage)
          .filter((key) => {
            const lower = key.toLowerCase();
            if (shouldKeepPersistentDeviceAuthKey(key)) return false;
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
    if (!isWeb) return nativeGet(key);

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
    if (!isWeb) {
      await nativeSet(key, value);
      return;
    }

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
    if (!isWeb) {
      await nativeDelete(key);
      return;
    }

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
