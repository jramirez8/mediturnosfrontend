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

const toRecord = (value: unknown): UnknownRecord => {
  if (typeof value === 'object' && value !== null) {
    return value as UnknownRecord;
  }
  return {};
};

const toStringValue = (input: unknown) => {
  if (input === undefined || input === null) return '';
  if (typeof input === 'string') return input;
  if (typeof input === 'number' || typeof input === 'boolean' || typeof input === 'bigint') return input.toString();
  return '';
};

const toPositiveNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
};

const normalizeProfile = (p: unknown): UserProfile => {
  const profile = toRecord(p);
  const usuario = toRecord(profile.usuario);
  const obraSocialRecord = toRecord(profile.obraSocial);

  const pacienteId = toPositiveNumber(profile.pacienteId ?? profile.id);
  const obraSocialId = toPositiveNumber(profile.obraSocialId ?? obraSocialRecord.id);
  const obraSocialNombre = profile.obraSocialNombre ?? profile.obraSocial ?? obraSocialRecord.nombre;
  const numeroCarnet = profile.numeroCarnet ?? profile.numeroAfiliado ?? profile.numCarnet;
  const companyName = profile.hospitalClinicaCabecera ?? profile.institucionCabecera;
  const doctorName = profile.doctorCabecera ?? profile.medicoCabecera;

  return {
    id: Number(profile.pacienteId ?? profile.id),
    pacienteId,
    usuarioId: Number(profile.usuarioId ?? usuario.id),
    nombre: toStringValue(profile.nombre ?? usuario.nombre),
    apellido: toStringValue(profile.apellido ?? usuario.apellido),
    dni: toStringValue(profile.dni ?? usuario.dni),
    email: toStringValue(profile.email ?? usuario.email),
    telefono: toStringValue(profile.telefono) || undefined,
    obraSocialId,
    obraSocial: toStringValue(obraSocialNombre) || undefined,
    obraSocialNombre: toStringValue(obraSocialNombre) || undefined,
    numeroAfiliado: toStringValue(numeroCarnet) || undefined,
    numeroCarnet: toStringValue(numeroCarnet) || undefined,
    numeroHistoriaClinica: toStringValue(profile.numeroHistoriaClinica) || undefined,
    institucionCabecera: toStringValue(companyName) || undefined,
    hospitalClinicaCabecera: toStringValue(companyName) || undefined,
    medicoCabecera: toStringValue(doctorName) || undefined,
    doctorCabecera: toStringValue(doctorName) || undefined,
    fotoPerfilUrl: absoluteApiUrl(toStringValue(profile.fotoPerfilUrl) || ''),
    carnetObraSocialUrl: absoluteApiUrl(toStringValue(profile.carnetObraSocialUrl) || ''),
    fotoPerfilSizeBytes: toPositiveNumber(profile.fotoPerfilSizeBytes),
    carnetObraSocialSizeBytes: toPositiveNumber(profile.carnetObraSocialSizeBytes),
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
      let endpoint = '/api/pacientes/perfil/me';
      if (usuarioId) {
        endpoint = `/api/pacientes/perfil/${usuarioId}`;
      }
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
    let usuarioId: string | undefined;
    if (typeof usuarioIdOrData === 'string') {
      usuarioId = usuarioIdOrData;
    }
    const data = (maybeData ?? usuarioIdOrData) as Partial<UserProfile>;
    const cacheKey = `profile:${usuarioId ?? 'me'}`;

    const current = await getCachedJson<UserProfile>(cacheKey)
      ?? await getCachedJson<UserProfile>('profile:last')
      ?? await userService.getProfile(usuarioId);

    let endpoint = '/api/pacientes/perfil/me';
    if (usuarioId) {
      endpoint = `/api/pacientes/perfil/${usuarioId}`;
    }
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
