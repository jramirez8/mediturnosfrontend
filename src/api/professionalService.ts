import { api } from './client';
import { getCachedJson, setCachedJson } from '../db/cache';
import { storage } from './storage';

export type Professional = {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  institucion: string;
  matricula?: string;
  proximaDisponibilidad?: string;
  profesionalInstitucionId?: number;
  institucionId?: number;
  especialidadId?: number;
  telefono?: string;
  email?: string;
};

type UnknownRecord = Record<string, unknown>;

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function maybeString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

const normalizeProfessional = (p: unknown): Professional => {
  const source = typeof p === 'object' && p !== null ? p as UnknownRecord : {};
  return {
    id: Number(source.id ?? source.profesionalId ?? source.profesionalInstitucionId),
    profesionalInstitucionId: source.profesionalInstitucionId ? Number(source.profesionalInstitucionId) : undefined,
    institucionId: source.institucionId ? Number(source.institucionId) : undefined,
    especialidadId: source.especialidadId ? Number(source.especialidadId) : undefined,
    nombre: asString(source.nombre ?? source.profesionalNombre),
    apellido: asString(source.apellido ?? source.profesionalApellido),
    especialidad: asString(source.especialidad ?? source.especialidadNombre, 'Sin especialidad'),
    institucion: asString(source.institucion ?? source.institucionNombre, 'Institución no informada'),
    matricula: maybeString(source.matricula),
    proximaDisponibilidad: maybeString(source.proximaDisponibilidad),
    telefono: maybeString(source.telefono),
    email: maybeString(source.email),
  };
};

const filterLocal = (items: Professional[], especialidad?: string, query?: string) => {
  const normalizedQuery = (query ?? '').trim().toLowerCase();
  return items.filter((p) => {
    const matchSpecialty = !especialidad || especialidad === 'Todos' || p.especialidad === especialidad;
    const haystack = `${p.nombre} ${p.apellido} ${p.especialidad} ${p.institucion}`.toLowerCase();
    const matchQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchSpecialty && matchQuery;
  });
};


async function findMeFromList() {
  const [professionalId, professionalInstitutionId, fullName] = await Promise.all([
    storage.getItem('profesional_id'),
    storage.getItem('profesional_institucion_id'),
    storage.getItem('nombre_completo'),
  ]);
  const list = await professionalService.getAll();
  const profId = professionalId ? Number(professionalId) : null;
  const profInstId = professionalInstitutionId ? Number(professionalInstitutionId) : null;
  if (profInstId) {
    const found = list.find((p) => Number(p.profesionalInstitucionId ?? p.id) === profInstId);
    if (found) return found;
  }
  if (profId) {
    const found = list.find((p) => Number(p.id) === profId);
    if (found) return found;
  }
  const normalizedName = String(fullName ?? '').toLowerCase();
  if (normalizedName) {
    const found = list.find((p) => normalizedName.includes(String(p.nombre).toLowerCase()) && normalizedName.includes(String(p.apellido).toLowerCase()));
    if (found) return found;
  }
  return null;
}

export const professionalService = {

  getMe: async () => {
    try {
      const response = await api.get<unknown>('/api/profesionales/me');
      const data = normalizeProfessional(response.data);
      if (Number.isFinite(data.id)) {
        await setCachedJson('professionals:me', data);
        return data;
      }
      throw new Error('Respuesta de profesional inválida.');
    } catch (error: unknown) {
      const fromList = await findMeFromList();
      if (fromList) return fromList;
      const cached = await getCachedJson<Professional>('professionals:me');
      if (cached) return cached;
      throw error;
    }
  },

  getAll: async (especialidad?: string, query?: string) => {
    const cacheKey = `professionals:all:${especialidad ?? 'Todos'}:${query ?? ''}`;

    try {
      const response = await api.get<unknown[]>('/api/profesionales', {
        params: {
          especialidad: especialidad === 'Todos' ? undefined : especialidad,
          q: query || undefined,
        },
      });

      const data = response.data.map(normalizeProfessional).filter((p) => Number.isFinite(p.id));
      await setCachedJson(cacheKey, data);
      await setCachedJson('professionals:last', data);
      return data;
    } catch (error: unknown) {
      const cached = await getCachedJson<Professional[]>(cacheKey);
      if (cached) return cached;
      const last = await getCachedJson<Professional[]>('professionals:last');
      if (last) return filterLocal(last, especialidad, query);
      throw error;
    }
  },

  getEspecialidades: async () => {
    try {
      const response = await api.get<unknown[]>('/api/profesionales/especialidades');
      const data = response.data.map((item) => {
        if (typeof item === 'string') return item;
        const source = typeof item === 'object' && item !== null ? item as UnknownRecord : {};
        return asString(source.nombre ?? source.especialidad ?? String(item));
      });
      await setCachedJson('specialties', data);
      return data;
    } catch (error: unknown) {
      const cached = await getCachedJson<string[]>('specialties');
      if (cached) return cached;
      throw error;
    }
  },

  getBySpecialty: async (especialidad: string) => {
    return professionalService.getAll(especialidad);
  },
};
