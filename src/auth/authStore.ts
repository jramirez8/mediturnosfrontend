import { create } from 'zustand';
import { api } from '../api/client';
import { hardClearAuthStorage, storage } from '../api/storage';
import { clearAppCache, purgeLegacyCache } from '../db/cache';
import { normalizeRole, routeForRole } from './roles';
import { authenticateDevice, getBiometricInfo, promoteDeviceSessionToActive } from '../utils/deviceAuth';
import { DEMO_MODE, DEMO_PASSWORD, DEMO_USERS } from '../demo/demoApi';

type LoginResult = {
  role: string | null;
  route: string;
  requiresTwoFactor?: boolean;
  usuarioId?: string | null;
  destination?: string | null;
};

type AuthState = {
  token: string | null;
  usuarioId: string | null;
  pacienteId: string | null;
  profesionalId: string | null;
  profesionalInstitucionId: string | null;
  role: string | null;
  nombreCompleto: string | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginWithDeviceAuth: () => Promise<LoginResult>;
  verifyTwoFactor: (usuarioId: string, codigo: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  fetchPacienteId: (uId: string) => Promise<string | null>;
};

function pickString(...values: any[]) {
  const found = values.find((value) => value !== undefined && value !== null && value !== '');
  return found === undefined ? null : String(found);
}

const AUTH_KEYS_ACTIVE = ['access_token', 'usuario_id', 'paciente_id', 'profesional_id', 'profesional_institucion_id', 'role', 'nombre_completo'];

async function clearEverythingAuthRelated() {
  await Promise.allSettled([
    storage.deleteItem('access_token'),
    storage.deleteItem('usuario_id'),
    storage.deleteItem('paciente_id'),
    storage.deleteItem('profesional_id'),
    storage.deleteItem('profesional_institucion_id'),
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
  profesionalInstitucionId: null,
  role: null,
  nombreCompleto: null,
  loading: false,
  hydrated: false,

  loadToken: async () => {
    await purgeLegacyCache();

    const biometric = await getBiometricInfo();
    if (biometric.enabled) {
      // Si el dispositivo tiene ingreso biométrico activado, no restauramos sesión automáticamente:
      // el usuario debe tocar “Ingresar con biometría” y validar huella/rostro/PIN/patrón.
      await Promise.allSettled(AUTH_KEYS_ACTIVE.map((key) => storage.deleteItem(key)));
      set({ token: null, usuarioId: null, pacienteId: null, profesionalId: null, profesionalInstitucionId: null, role: null, nombreCompleto: null, hydrated: true, loading: false });
      return;
    }

    const [token, usuarioId, pacienteId, profesionalId, profesionalInstitucionId, role, nombreCompleto] = await Promise.all([
      storage.getItem('access_token'),
      storage.getItem('usuario_id'),
      storage.getItem('paciente_id'),
      storage.getItem('profesional_id'),
      storage.getItem('profesional_institucion_id'),
      storage.getItem('role'),
      storage.getItem('nombre_completo'),
    ]);


    set({ token, usuarioId, pacienteId, profesionalId, profesionalInstitucionId, role, nombreCompleto, hydrated: true, loading: false });
  },

  fetchPacienteId: async (uId: string) => {
    try {
      const response = await api.get(`/api/pacientes/usuario/${uId}`);
      const pId = pickString(response.data?.id, response.data?.pacienteId);
      if (!pId) return null;
      await storage.setItem('paciente_id', pId);
      set({ pacienteId: pId });
      return pId;
    } catch {
      return null;
    }
  },

  login: async (email, password) => {
    set({ loading: true, token: null, usuarioId: null, pacienteId: null, profesionalId: null, profesionalInstitucionId: null, role: null, nombreCompleto: null, hydrated: true });
    await clearEverythingAuthRelated();

    try {
      if (DEMO_MODE) {
        const demoUser = DEMO_USERS.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
        if (!demoUser || password !== DEMO_PASSWORD) {
          const error = new Error('Credenciales demo incorrectas.') as Error & { response?: { status: number } };
          error.response = { status: 401 };
          throw error;
        }
        const token = `demo-${demoUser.role.toLowerCase()}-session`;
        const pacienteId = 'pacienteId' in demoUser ? demoUser.pacienteId : null;
        const profesionalId = 'profesionalId' in demoUser ? demoUser.profesionalId : null;
        const profesionalInstitucionId = 'profesionalInstitucionId' in demoUser ? demoUser.profesionalInstitucionId : null;
        await Promise.all([
          storage.setItem('access_token', token),
          storage.setItem('usuario_id', demoUser.usuarioId),
          storage.setItem('role', demoUser.role),
          storage.setItem('nombre_completo', demoUser.nombre),
          pacienteId ? storage.setItem('paciente_id', pacienteId) : Promise.resolve(),
          profesionalId ? storage.setItem('profesional_id', profesionalId) : Promise.resolve(),
          profesionalInstitucionId ? storage.setItem('profesional_institucion_id', profesionalInstitucionId) : Promise.resolve(),
        ]);
        set({ token, usuarioId: demoUser.usuarioId, pacienteId, profesionalId, profesionalInstitucionId, role: demoUser.role, nombreCompleto: demoUser.nombre, hydrated: true });
        return { role: demoUser.role, route: routeForRole(demoUser.role) };
      }
      const response = await api.post('/api/auth/login', { identificador: email, email, password });

      const uId = pickString(response.data?.usuarioId, response.data?.userId, response.data?.id, response.data?.usuario?.id);

      if (response.data?.requiereSegundoFactor || response.data?.requiresTwoFactor) {
        return {
          role: pickString(response.data?.role, response.data?.rol),
          route: '/login',
          requiresTwoFactor: true,
          usuarioId: uId,
          destination: pickString(response.data?.segundoFactorDestino, response.data?.twoFactorDestination),
        };
      }

      const token = pickString(response.data?.token, response.data?.accessToken, response.data?.jwt);
      if (!token) {
        throw new Error('No pudimos iniciar sesión con la respuesta recibida.');
      }


      const pId = pickString(response.data?.pacienteId, response.data?.paciente?.id);
      const profId = pickString(response.data?.profesionalId, response.data?.profesional?.id);
      const profInstId = pickString(response.data?.profesionalInstitucionId, response.data?.profesionalInstitucion?.id, response.data?.profesional?.profesionalInstitucionId);
      const rawRole = pickString(response.data?.role, response.data?.rol, response.data?.tipoUsuario, response.data?.usuario?.rol);
      const normalizedRole = normalizeRole(rawRole);
      const role = normalizedRole ?? rawRole;
      const nombreCompleto = pickString(response.data?.nombreCompleto, response.data?.nombre, response.data?.usuario?.nombreCompleto);

      if (!normalizedRole) {
        throw new Error('Tu usuario no tiene un rol válido asignado.');
      }

      await storage.setItem('access_token', token);
      if (uId) await storage.setItem('usuario_id', uId);
      if (role) await storage.setItem('role', role);
      if (nombreCompleto) await storage.setItem('nombre_completo', nombreCompleto);
      if (profId) await storage.setItem('profesional_id', profId);
      if (profInstId) await storage.setItem('profesional_institucion_id', profInstId);

      set({ token, usuarioId: uId, role, profesionalId: profId, profesionalInstitucionId: profInstId, nombreCompleto, hydrated: true });

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


  verifyTwoFactor: async (usuarioId, codigo) => {
    set({ loading: true, token: null, usuarioId: null, pacienteId: null, profesionalId: null, profesionalInstitucionId: null, role: null, nombreCompleto: null, hydrated: true });
    try {
      const response = await api.post('/api/auth/2fa/verify', { usuarioId: Number(usuarioId), codigo });
      const token = pickString(response.data?.token, response.data?.accessToken, response.data?.jwt);
      if (!token) throw new Error('No pudimos validar el segundo factor.');

      const uId = pickString(response.data?.usuarioId, response.data?.userId, response.data?.id, response.data?.usuario?.id);
      const pId = pickString(response.data?.pacienteId, response.data?.paciente?.id);
      const profId = pickString(response.data?.profesionalId, response.data?.profesional?.id);
      const profInstId = pickString(response.data?.profesionalInstitucionId, response.data?.profesionalInstitucion?.id, response.data?.profesional?.profesionalInstitucionId);
      const rawRole = pickString(response.data?.role, response.data?.rol, response.data?.tipoUsuario, response.data?.usuario?.rol);
      const normalizedRole = normalizeRole(rawRole);
      const role = normalizedRole ?? rawRole;
      const nombreCompleto = pickString(response.data?.nombreCompleto, response.data?.nombre, response.data?.usuario?.nombreCompleto);
      if (!normalizedRole) throw new Error('Tu usuario no tiene un rol válido asignado.');

      await storage.setItem('access_token', token);
      if (uId) await storage.setItem('usuario_id', uId);
      if (role) await storage.setItem('role', role);
      if (nombreCompleto) await storage.setItem('nombre_completo', nombreCompleto);
      if (profId) await storage.setItem('profesional_id', profId);
      if (profInstId) await storage.setItem('profesional_institucion_id', profInstId);
      if (pId) await storage.setItem('paciente_id', pId);

      set({ token, usuarioId: uId, pacienteId: pId, profesionalId: profId, profesionalInstitucionId: profInstId, role, nombreCompleto, hydrated: true });
      return { role, route: routeForRole(role) };
    } finally {
      set({ loading: false });
    }
  },

  loginWithDeviceAuth: async () => {
    set({ loading: true });
    try {
      const auth = await authenticateDevice('Ingresar a Mediturnos');
      if (!auth.success) throw new Error(auth.error ?? 'No pudimos validar el método del dispositivo.');

      const session = await promoteDeviceSessionToActive();
      const normalizedRole = normalizeRole(session.role);
      if (!normalizedRole) throw new Error('La sesión guardada tiene un rol desconocido. Ingresá con contraseña una vez más.');

      set({
        token: session.token,
        usuarioId: session.usuarioId,
        pacienteId: session.pacienteId,
        profesionalId: session.profesionalId,
        profesionalInstitucionId: session.profesionalInstitucionId ?? null,
        role: normalizedRole,
        nombreCompleto: session.nombreCompleto,
        hydrated: true,
        loading: false,
      });

      return { role: normalizedRole, route: routeForRole(normalizedRole) };
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    // Estado primero: la UI debe salir aunque falle storage/cache.
    set({ token: null, usuarioId: null, pacienteId: null, profesionalId: null, profesionalInstitucionId: null, role: null, nombreCompleto: null, loading: false, hydrated: true });
    await clearEverythingAuthRelated();
    set({ token: null, usuarioId: null, pacienteId: null, profesionalId: null, profesionalInstitucionId: null, role: null, nombreCompleto: null, loading: false, hydrated: true });
  },
}));
