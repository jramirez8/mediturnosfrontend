import { api } from './client';
import { getCachedJson, setCachedJson } from '../db/cache';

export type UserProfile = {
  id: number;
  pacienteId?: number;
  usuarioId: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono?: string;
  obraSocialId?: number;
  obraSocial?: string;
  obraSocialNombre?: string;
  numeroAfiliado?: string;
  numeroCarnet?: string;
  numeroHistoriaClinica?: string;
  institucionCabecera?: string;
  hospitalClinicaCabecera?: string;
  medicoCabecera?: string;
  doctorCabecera?: string;
};

const normalizeProfile = (p: any): UserProfile => ({
  id: Number(p.pacienteId ?? p.id),
  pacienteId: p.pacienteId ? Number(p.pacienteId) : p.id ? Number(p.id) : undefined,
  usuarioId: Number(p.usuarioId ?? p.usuario?.id),
  nombre: p.nombre ?? p.usuario?.nombre ?? '',
  apellido: p.apellido ?? p.usuario?.apellido ?? '',
  dni: p.dni ?? p.usuario?.dni ?? '',
  email: p.email ?? p.usuario?.email ?? '',
  telefono: p.telefono,
  obraSocialId: p.obraSocialId ? Number(p.obraSocialId) : p.obraSocial?.id ? Number(p.obraSocial.id) : undefined,
  obraSocial: p.obraSocialNombre ?? p.obraSocial ?? p.obraSocial?.nombre,
  obraSocialNombre: p.obraSocialNombre ?? p.obraSocial ?? p.obraSocial?.nombre,
  numeroAfiliado: p.numeroCarnet ?? p.numeroAfiliado ?? p.numCarnet,
  numeroCarnet: p.numeroCarnet ?? p.numeroAfiliado ?? p.numCarnet,
  numeroHistoriaClinica: p.numeroHistoriaClinica,
  institucionCabecera: p.hospitalClinicaCabecera ?? p.institucionCabecera,
  hospitalClinicaCabecera: p.hospitalClinicaCabecera ?? p.institucionCabecera,
  medicoCabecera: p.doctorCabecera ?? p.medicoCabecera,
  doctorCabecera: p.doctorCabecera ?? p.medicoCabecera,
});

function clean(value?: string | number | null) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function requireNumber(value: unknown, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`No tengo ${fieldName} real desde el backend. No voy a inventarlo.`);
  }
  return parsed;
}

function buildProfilePayload(current: UserProfile, data: Partial<UserProfile>) {
  return {
    email: clean(data.email) ?? current.email,
    telefono: clean(data.telefono) ?? current.telefono ?? '0000000000',
    obraSocialId: requireNumber(data.obraSocialId ?? current.obraSocialId, 'obraSocialId'),
    numeroCarnet: clean(data.numeroCarnet ?? data.numeroAfiliado) ?? current.numeroCarnet ?? current.numeroAfiliado,
    hospitalClinicaCabecera: clean(data.hospitalClinicaCabecera ?? data.institucionCabecera) ?? current.hospitalClinicaCabecera ?? current.institucionCabecera,
    doctorCabecera: clean(data.doctorCabecera ?? data.medicoCabecera) ?? current.doctorCabecera ?? current.medicoCabecera,
  };
}

export const userService = {
  getProfile: async (usuarioId?: string | null) => {
    const cacheKey = `profile:${usuarioId ?? 'me'}`;
    try {
      const endpoint = usuarioId ? `/api/pacientes/perfil/${usuarioId}` : '/api/pacientes/perfil/me';
      const response = await api.get<any>(endpoint);
      const data = normalizeProfile(response.data);
      await setCachedJson(cacheKey, data);
      await setCachedJson('profile:last', data);
      return data;
    } catch (error) {
      const cached = await getCachedJson<UserProfile>(cacheKey);
      if (cached) return cached;
      const last = await getCachedJson<UserProfile>('profile:last');
      if (last) return last;
      throw error;
    }
  },

  updateProfile: async (usuarioIdOrData: string | Partial<UserProfile>, maybeData?: Partial<UserProfile>) => {
    const usuarioId = typeof usuarioIdOrData === 'string' ? usuarioIdOrData : undefined;
    const data = (maybeData ?? usuarioIdOrData) as Partial<UserProfile>;
    const cacheKey = `profile:${usuarioId ?? 'me'}`;

    const current = await getCachedJson<UserProfile>(cacheKey)
      ?? await getCachedJson<UserProfile>('profile:last')
      ?? await userService.getProfile(usuarioId);

    const endpoint = usuarioId ? `/api/pacientes/perfil/${usuarioId}` : '/api/pacientes/perfil/me';
    const response = await api.put<any>(endpoint, buildProfilePayload(current, data));
    const profile = normalizeProfile(response.data);
    await setCachedJson(cacheKey, profile);
    await setCachedJson('profile:last', profile);
    return profile;
  },
};
