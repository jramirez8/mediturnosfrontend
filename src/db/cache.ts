import { Platform } from 'react-native';

/**
 * Cache liviana y a prueba de Expo Go/Web.
 *
 * Motivo del parche:
 * expo-sqlite estaba rompiendo el bundle web/Expo Router porque intentaba resolver
 * wa-sqlite.wasm desde node_modules. Para la entrega de hoy priorizamos que la app
 * arranque siempre. Cuando armemos Development Build/EAS, reactivamos SQLite real.
 */

type CacheEntry = {
  value: unknown;
  updatedAt: number;
};

const memoryCache = new Map<string, CacheEntry>();

function webKey(key: string) {
  return `mediturnos-cache:${key}`;
}

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
}

export async function setCachedJson<T>(key: string, value: T) {
  const updatedAt = Date.now();
  const entry: CacheEntry = { value, updatedAt };

  memoryCache.set(key, entry);

  if (canUseLocalStorage()) {
    try {
      globalThis.localStorage.setItem(webKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn('No se pudo guardar cache web:', error);
    }
  }
}

export async function getCachedJson<T>(key: string, maxAgeMs?: number): Promise<T | null> {
  let entry = memoryCache.get(key);

  if (!entry && canUseLocalStorage()) {
    try {
      const raw = globalThis.localStorage.getItem(webKey(key));
      if (raw) entry = JSON.parse(raw) as CacheEntry;
    } catch (error) {
      console.warn('No se pudo leer cache web:', error);
    }
  }

  if (!entry) return null;
  if (maxAgeMs && Date.now() - entry.updatedAt > maxAgeMs) return null;

  return entry.value as T;
}

export async function clearAppCache() {
  memoryCache.clear();

  if (canUseLocalStorage()) {
    try {
      Object.keys(globalThis.localStorage)
        .filter((key) => key.startsWith('mediturnos-cache:'))
        .forEach((key) => globalThis.localStorage.removeItem(key));
    } catch (error) {
      console.warn('No se pudo limpiar cache web:', error);
    }
  }
}
