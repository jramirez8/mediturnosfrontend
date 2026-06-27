import { api } from './client';
import { mediaToFormData, absoluteApiUrl } from './uploadMedia';
import { PickedMedia } from '../utils/mediaPicker';
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
  fotoPerfilUrl?: string;
  carnetObraSocialUrl?: string;
  fotoPerfilSizeBytes?: number;
  carnetObraSocialSizeBytes?: number;
};

type UnknownRecord = Record<string, unknown>;

const normalizeProfile = (p: unknown): UserProfile => {
  const profile = typeof p === 'object' && p !== null ? (p as UnknownRecord) : {};
  const usuario = typeof profile.usuario === 'object' && profile.usuario !== null ? (profile.usuario as UnknownRecord) : {};
  const obraSocial = typeof profile.obraSocial === 'object' && profile.obraSocial !== null ? (profile.obraSocial as UnknownRecord) : profile.obraSocial;
  const obraSocialRecord = typeof obraSocial === 'object' && obraSocial !== null ? (obraSocial as UnknownRecord) : {};

  const value = (input: unknown) => input === undefined || input === null ? '' : String(input);

  const pacienteId = profile.pacienteId ? Number(profile.pacienteId) : profile.id ? Number(profile.id) : undefined;
  const obraSocialId = profile.obraSocialId ? Number(profile.obraSocialId) : obraSocialRecord.id ? Number(obraSocialRecord.id) : undefined;

  return {
    id: Number(profile.pacienteId ?? profile.id),
    pacienteId,
    usuarioId: Number(profile.usuarioId ?? usuario.id),
    nombre: value(profile.nombre ?? usuario.nombre),
    apellido: value(profile.apellido ?? usuario.apellido),
    dni: value(profile.dni ?? usuario.dni),
    email: value(profile.email ?? usuario.email),
    telefono: value(profile.telefono) || undefined,
    obraSocialId,
    obraSocial: value(profile.obraSocialNombre ?? profile.obraSocial ?? obraSocialRecord.nombre) || undefined,
    obraSocialNombre: value(profile.obraSocialNombre ?? profile.obraSocial ?? obraSocialRecord.nombre) || undefined,
    numeroAfiliado: value(profile.numeroCarnet ?? profile.numeroAfiliado ?? profile.numCarnet) || undefined,
    numeroCarnet: value(profile.numeroCarnet ?? profile.numeroAfiliado ?? profile.numCarnet) || undefined,
    numeroHistoriaClinica: value(profile.numeroHistoriaClinica) || undefined,
    institucionCabecera: value(profile.hospitalClinicaCabecera ?? profile.institucionCabecera) || undefined,
    hospitalClinicaCabecera: value(profile.hospitalClinicaCabecera ?? profile.institucionCabecera) || undefined,
    medicoCabecera: value(profile.doctorCabecera ?? profile.medicoCabecera) || undefined,
    doctorCabecera: value(profile.doctorCabecera ?? profile.medicoCabecera) || undefined,
    fotoPerfilUrl: absoluteApiUrl(value(profile.fotoPerfilUrl) || ''),
    carnetObraSocialUrl: absoluteApiUrl(value(profile.carnetObraSocialUrl) || ''),
    fotoPerfilSizeBytes: profile.fotoPerfilSizeBytes ? Number(profile.fotoPerfilSizeBytes) : undefined,
    carnetObraSocialSizeBytes: profile.carnetObraSocialSizeBytes ? Number(profile.carnetObraSocialSizeBytes) : undefined,
  };
};

function clean(value?: string | number | null) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function requireNumber(value: unknown, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Falta seleccionar ${fieldName}.`);
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
      const response = await api.get<unknown>(endpoint);
      const data = normalizeProfile(response.data);
      await setCachedJson(cacheKey, data);
      await setCachedJson('profile:last', data);
      return data;
    } catch (error: unknown) {
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
    const response = await api.put<unknown>(endpoint, buildProfilePayload(current, data));
    const profile = normalizeProfile(response.data);
    await setCachedJson(cacheKey, profile);
    await setCachedJson('profile:last', profile);
    return profile;
  },

  uploadProfilePhoto: async (media: PickedMedia, usuarioId?: string | null) => {
    const form = await mediaToFormData(media);
    const response = await api.post<unknown>('/api/pacientes/perfil/me/foto-perfil', form, {
      timeout: 30000,
    });
    const profile = normalizeProfile(response.data);
    await setCachedJson(`profile:${usuarioId ?? 'me'}`, profile);
    await setCachedJson('profile:last', profile);
    return profile;
  },

  uploadOossCard: async (media: PickedMedia, usuarioId?: string | null) => {
    const form = await mediaToFormData(media);
    const response = await api.post<unknown>('/api/pacientes/perfil/me/carnet-obra-social', form, {
      timeout: 30000,
    });
    const profile = normalizeProfile(response.data);
    await setCachedJson(`profile:${usuarioId ?? 'me'}`, profile);
    await setCachedJson('profile:last', profile);
    return profile;
  },
};
