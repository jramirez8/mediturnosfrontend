import { Platform } from 'react-native';

/**
 * Cache real-only para Expo Go/Web.
 *
 * No usa expo-sqlite para evitar el problema del wa-sqlite.wasm en Expo Web.
 * La clave del parche: NO lee caches viejas del proyecto, porque versiones previas
 * llegaron a guardar datos demo. Este prefijo v3 arranca limpio.
 */

type CacheEntry = {
  value: unknown;
  updatedAt: number;
  source: 'backend';
};

const CACHE_PREFIX = 'mediturnos-real-cache-v3:';
const LEGACY_PREFIXES = ['mediturnos-cache:', 'mediturnos-real-cache-v1:', 'mediturnos-real-cache-v2:'];
const memoryCache = new Map<string, CacheEntry>();

function webKey(key: string) {
  return `${CACHE_PREFIX}${key}`;
}

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof globalThis !== 'undefined' && 'localStorage' in globalThis;
}

export async function purgeLegacyCache() {
  if (!canUseLocalStorage()) return;
  try {
    Object.keys(globalThis.localStorage)
      .filter((key) => LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix)))
      .forEach((key) => globalThis.localStorage.removeItem(key));
  } catch (error: unknown) {
    console.warn('No se pudo limpiar cache legacy:', error);
  }
}

export async function setCachedJson<T>(key: string, value: T) {
  const entry: CacheEntry = { value, updatedAt: Date.now(), source: 'backend' };
  memoryCache.set(key, entry);

  if (canUseLocalStorage()) {
    try {
      globalThis.localStorage.setItem(webKey(key), JSON.stringify(entry));
    } catch (error: unknown) {
      console.warn('No se pudo guardar cache real:', error);
    }
  }
}

export async function getCachedJson<T>(key: string, maxAgeMs?: number): Promise<T | null> {
  let entry = memoryCache.get(key);

  if (!entry && canUseLocalStorage()) {
    try {
      const raw = globalThis.localStorage.getItem(webKey(key));
      if (raw) entry = JSON.parse(raw) as CacheEntry;
    } catch (error: unknown) {
      console.warn('No se pudo leer cache real:', error);
    }
  }

  if (!entry) return null;
  if (entry.source !== 'backend') return null;
  if (maxAgeMs && Date.now() - entry.updatedAt > maxAgeMs) return null;

  return entry.value as T;
}

export async function clearAppCache() {
  memoryCache.clear();

  if (canUseLocalStorage()) {
    try {
      Object.keys(globalThis.localStorage)
        .filter((key) => key.startsWith(CACHE_PREFIX) || LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix)))
        .forEach((key) => globalThis.localStorage.removeItem(key));
    } catch (error: unknown) {
      console.warn('No se pudo limpiar cache:', error);
    }
  }
}
