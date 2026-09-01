import axios from 'axios';
import { Platform } from 'react-native';
import { hardRedirectToLogin } from '../utils/session';
import { hardClearAuthStorage, storage } from './storage';
import { DEMO_MODE, demoAdapter } from '../demo/demoApi';

const DEFAULT_API_ORIGIN = 'https://mediturnosbackend-production.up.railway.app';
const configuredApiOrigin = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_ORIGIN;

function isVercelHostedWeb() {
  if (Platform.OS !== 'web') return false;

  const location = (globalThis as { location?: { hostname?: string } }).location;
  if (!location?.hostname)
    return false;

  const host = location.hostname.toLowerCase();
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
  adapter: DEMO_MODE ? demoAdapter : undefined,
});

let redirectingExpiredSession = false;

function requestPath(url?: string) {
  if (!url) return '';
  try {
    return new URL(url, API_ORIGIN).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function isAuthenticationRequest(url?: string) {
  const path = requestPath(url);
  return path.includes('/api/auth/login') || path.includes('/api/auth/2fa') || path.includes('/api/auth/register') || path.includes('/api/auth/registro') || path.includes('/api/auth/verify') || path.includes('/api/auth/password');
}

function errorText(error: unknown) {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  if (!responseData) return String((error as { message?: unknown })?.message ?? '');
  if (typeof responseData === 'string') return responseData;
  const data = responseData as { message?: unknown; error?: unknown; detail?: unknown };
  return [data.message, data.error, data.detail, (error as { message?: unknown })?.message]
    .filter(Boolean)
    .join(' ');
}

function isExpiredSessionError(error: unknown) {
  const status = Number((error as { response?: { status?: unknown } })?.response?.status);
  if (isAuthenticationRequest((error as { config?: { url?: string } })?.config?.url)) return false;

  const text = errorText(error).toLowerCase();
  const mentionsExpiredToken = /(token|jwt|sesi[oó]n).*(inv[aá]lid|vencid|expir)|unauthorized|no autorizado/.test(text);
  if (mentionsExpiredToken) return true;

  return status === 401;
}

async function redirectExpiredSession() {
  if (redirectingExpiredSession) return;
  redirectingExpiredSession = true;
  await hardClearAuthStorage();
  hardRedirectToLogin({ sessionExpired: '1' });
}

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
    if (isExpiredSessionError(error)) {
      void redirectExpiredSession();
    }
    if (error?.code === 'ECONNABORTED') {
      error.message = 'El servicio está tardando en responder. Revisá tu conexión e intentá nuevamente.';
    }
    if (!error?.response && error?.message === 'Network Error') {
      error.message = 'No hay conexión a internet. Revisá tu conexión e intentá nuevamente.';
    }
    return Promise.reject(error);
  }
);
