import { create } from 'zustand';
import { api } from '../api/client';
import { hardClearAuthStorage, storage } from '../api/storage';
import { clearAppCache, purgeLegacyCache } from '../db/cache';

type AuthState = {
  token: string | null;
  usuarioId: string | null;
  pacienteId: string | null;
  role: string | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    storage.deleteItem('role'),
    hardClearAuthStorage(),
    clearAppCache(),
    purgeLegacyCache(),
  ]);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  usuarioId: null,
  pacienteId: null,
  role: null,
  loading: false,
  hydrated: false,

  loadToken: async () => {
    await purgeLegacyCache();
    const [token, usuarioId, pacienteId, role] = await Promise.all([
      storage.getItem('access_token'),
      storage.getItem('usuario_id'),
      storage.getItem('paciente_id'),
      storage.getItem('role'),
    ]);

    // Limpieza de versiones anteriores: hubo builds que guardaban tokens falsos.
    if (token?.startsWith('demo-token-')) {
      await clearEverythingAuthRelated();
      set({ token: null, usuarioId: null, pacienteId: null, role: null, hydrated: true, loading: false });
      return;
    }

    set({ token, usuarioId, pacienteId, role, hydrated: true, loading: false });
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
    set({ loading: true, token: null, usuarioId: null, pacienteId: null, role: null, hydrated: true });
    await clearEverythingAuthRelated();

    try {
      const response = await api.post('/api/auth/login', { identificador: email, email, password });

      const token = pickString(response.data?.token, response.data?.accessToken, response.data?.jwt);
      if (!token) {
        throw new Error('El backend respondió el login pero no devolvió JWT. Revisá AuthLoginResponse/token/accessToken/jwt.');
      }

      const uId = pickString(response.data?.usuarioId, response.data?.userId, response.data?.id, response.data?.usuario?.id);
      const pId = pickString(response.data?.pacienteId, response.data?.paciente?.id);
      const role = pickString(response.data?.role, response.data?.rol, response.data?.tipoUsuario, response.data?.usuario?.rol);

      await storage.setItem('access_token', token);
      if (uId) await storage.setItem('usuario_id', uId);
      if (role) await storage.setItem('role', role);

      set({ token, usuarioId: uId, role, hydrated: true });

      if (pId) {
        await storage.setItem('paciente_id', pId);
        set({ pacienteId: pId });
      } else if (uId) {
        await get().fetchPacienteId(uId);
      }
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    // Estado primero: la UI debe salir aunque falle storage/cache.
    set({ token: null, usuarioId: null, pacienteId: null, role: null, loading: false, hydrated: true });
    await clearEverythingAuthRelated();
    set({ token: null, usuarioId: null, pacienteId: null, role: null, loading: false, hydrated: true });
  },
}));
