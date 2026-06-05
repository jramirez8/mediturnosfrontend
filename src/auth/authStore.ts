import { create } from 'zustand';
import { api } from '../api/client';
import { hardClearAuthStorage, storage } from '../api/storage';
import { clearAppCache, purgeLegacyCache } from '../db/cache';
import { normalizeRole, routeForRole } from './roles';

type LoginResult = {
  role: string | null;
  route: string;
};

type AuthState = {
  token: string | null;
  usuarioId: string | null;
  pacienteId: string | null;
  profesionalId: string | null;
  role: string | null;
  nombreCompleto: string | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  fetchPacienteId: (uId: string) => Promise<string | null>;
};

function pickString(...values: any[]) {
  const found = values.find((value) => value !== undefined && value !== null && value !== '');
  return found === undefined ? null : String(found);
}

async function clearEverythingAuthRelated() {
  await Promise.allSettled([
    storage.deleteItem('access_token'),
    storage.deleteItem('usuario_id'),
    storage.deleteItem('paciente_id'),
    storage.deleteItem('profesional_id'),
    storage.deleteItem('role'),
    storage.deleteItem('nombre_completo'),
    hardClearAuthStorage(),
    clearAppCache(),
    purgeLegacyCache(),
  ]);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  usuarioId: null,
  pacienteId: null,
  profesionalId: null,
  role: null,
  nombreCompleto: null,
  loading: false,
  hydrated: false,

  loadToken: async () => {
    await purgeLegacyCache();
    const [token, usuarioId, pacienteId, profesionalId, role, nombreCompleto] = await Promise.all([
      storage.getItem('access_token'),
      storage.getItem('usuario_id'),
      storage.getItem('paciente_id'),
      storage.getItem('profesional_id'),
      storage.getItem('role'),
      storage.getItem('nombre_completo'),
    ]);

    // Limpieza de versiones anteriores: hubo builds que guardaban tokens falsos.
    if (token?.startsWith('demo-token-')) {
      await clearEverythingAuthRelated();
      set({ token: null, usuarioId: null, pacienteId: null, profesionalId: null, role: null, nombreCompleto: null, hydrated: true, loading: false });
      return;
    }

    set({ token, usuarioId, pacienteId, profesionalId, role, nombreCompleto, hydrated: true, loading: false });
  },

  fetchPacienteId: async (uId: string) => {
    try {
      const response = await api.get(`/api/pacientes/usuario/${uId}`);
      const pId = pickString(response.data?.id, response.data?.pacienteId);
      if (!pId) return null;
      await storage.setItem('paciente_id', pId);
      set({ pacienteId: pId });
      return pId;
    } catch (e) {
      console.warn('No se pudo obtener pacienteId desde backend.', e);
      return null;
    }
  },

  login: async (email, password) => {
    set({ loading: true, token: null, usuarioId: null, pacienteId: null, profesionalId: null, role: null, nombreCompleto: null, hydrated: true });
    await clearEverythingAuthRelated();

    try {
      const response = await api.post('/api/auth/login', { identificador: email, email, password });

      const token = pickString(response.data?.token, response.data?.accessToken, response.data?.jwt);
      if (!token) {
        throw new Error('El backend respondió el login pero no devolvió JWT. Revisá AuthLoginResponse/token/accessToken/jwt.');
      }

      const uId = pickString(response.data?.usuarioId, response.data?.userId, response.data?.id, response.data?.usuario?.id);
      const pId = pickString(response.data?.pacienteId, response.data?.paciente?.id);
      const profId = pickString(response.data?.profesionalId, response.data?.profesional?.id);
      const rawRole = pickString(response.data?.role, response.data?.rol, response.data?.tipoUsuario, response.data?.usuario?.rol);
      const normalizedRole = normalizeRole(rawRole);
      const role = normalizedRole ?? rawRole;
      const nombreCompleto = pickString(response.data?.nombreCompleto, response.data?.nombre, response.data?.usuario?.nombreCompleto);

      if (!normalizedRole) {
        throw new Error('El backend devolvió un rol desconocido. No puedo enrutar al panel correcto.');
      }

      await storage.setItem('access_token', token);
      if (uId) await storage.setItem('usuario_id', uId);
      if (role) await storage.setItem('role', role);
      if (nombreCompleto) await storage.setItem('nombre_completo', nombreCompleto);
      if (profId) await storage.setItem('profesional_id', profId);

      set({ token, usuarioId: uId, role, profesionalId: profId, nombreCompleto, hydrated: true });

      if (pId) {
        await storage.setItem('paciente_id', pId);
        set({ pacienteId: pId });
      } else if (uId && normalizedRole === 'PATIENT') {
        await get().fetchPacienteId(uId);
      }

      return { role, route: routeForRole(role) };
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    // Estado primero: la UI debe salir aunque falle storage/cache.
    set({ token: null, usuarioId: null, pacienteId: null, profesionalId: null, role: null, nombreCompleto: null, loading: false, hydrated: true });
    await clearEverythingAuthRelated();
    set({ token: null, usuarioId: null, pacienteId: null, profesionalId: null, role: null, nombreCompleto: null, loading: false, hydrated: true });
  },
}));
