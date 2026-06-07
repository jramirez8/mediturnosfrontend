import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from './storage';

const DEFAULT_API_ORIGIN = 'https://mediturnosbackend-production.up.railway.app';
const configuredApiOrigin = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_ORIGIN;

function isVercelHostedWeb() {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname.toLowerCase();
  const forcedMode = process.env.EXPO_PUBLIC_API_MODE;

  if (forcedMode === 'direct') return false;
  if (forcedMode === 'proxy') return true;

  const isLocalHost = ['localhost', '127.0.0.1'].includes(host);
  if (isLocalHost) return false;

  return (
    host === 'mediturnos.net.ar' ||
    host === 'www.mediturnos.net.ar' ||
    host === 'vercel.app' ||
    host.endsWith('.vercel.app')
  );
}

/**
 * En Android/iOS y en desarrollo local pegamos directo al backend de Railway.
 * En Vercel Web usamos URLs relativas (/api/...), y vercel.json las proxyea al backend.
 * Eso evita el bloqueo CORS que en navegador aparece como "Network Error".
 */
export const USE_VERCEL_API_PROXY = isVercelHostedWeb();
export const API_ORIGIN = configuredApiOrigin.replace(/\/$/, '');
export const API_BASE_URL = USE_VERCEL_API_PROXY ? '' : API_ORIGIN;

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const [token, usuarioId, role, nombreCompleto] = await Promise.all([
    storage.getItem('access_token'),
    storage.getItem('usuario_id'),
    storage.getItem('role'),
    storage.getItem('nombre_completo'),
  ]);

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Ayuda al backend/auditoría a identificar al actor real de cada operación.
  // El JWT sigue siendo la fuente de verdad; estos headers son complemento para logs y auditoría.
  if (usuarioId) config.headers['X-Mediturnos-Actor-Id'] = usuarioId;
  if (role) config.headers['X-Mediturnos-Actor-Role'] = role;
  if (nombreCompleto) config.headers['X-Mediturnos-Actor-Name'] = nombreCompleto;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.code === 'ECONNABORTED') {
      error.message = 'El servidor tardó demasiado en responder.';
    }
    if (!error?.response && error?.message === 'Network Error') {
      error.message = 'No pudimos conectarnos con el servicio. Revisá tu conexión e intentá nuevamente.';
    }
    return Promise.reject(error);
  }
);
