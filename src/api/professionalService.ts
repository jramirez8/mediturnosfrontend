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

const normalizeProfessional = (p: any): Professional => ({
  id: Number(p.id ?? p.profesionalId ?? p.profesionalInstitucionId),
  profesionalInstitucionId: p.profesionalInstitucionId ? Number(p.profesionalInstitucionId) : undefined,
  institucionId: p.institucionId ? Number(p.institucionId) : undefined,
  especialidadId: p.especialidadId ? Number(p.especialidadId) : undefined,
  nombre: p.nombre ?? p.profesionalNombre ?? '',
  apellido: p.apellido ?? p.profesionalApellido ?? '',
  especialidad: p.especialidad ?? p.especialidadNombre ?? 'Sin especialidad',
  institucion: p.institucion ?? p.institucionNombre ?? 'Institución no informada',
  matricula: p.matricula,
  proximaDisponibilidad: p.proximaDisponibilidad,
  telefono: p.telefono,
  email: p.email,
});

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
      const response = await api.get<any>('/api/profesionales/me');
      const data = normalizeProfessional(response.data);
      if (Number.isFinite(data.id)) {
        await setCachedJson('professionals:me', data);
        return data;
      }
      throw new Error('Respuesta de profesional inválida.');
    } catch (error) {
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
      const response = await api.get<any[]>('/api/profesionales', {
        params: {
          especialidad: especialidad === 'Todos' ? undefined : especialidad,
          q: query || undefined,
        },
      });

      const data = response.data.map(normalizeProfessional).filter((p) => Number.isFinite(p.id));
      await setCachedJson(cacheKey, data);
      await setCachedJson('professionals:last', data);
      return data;
    } catch (error) {
      const cached = await getCachedJson<Professional[]>(cacheKey);
      if (cached) return cached;
      const last = await getCachedJson<Professional[]>('professionals:last');
      if (last) return filterLocal(last, especialidad, query);
      throw error;
    }
  },

  getEspecialidades: async () => {
    try {
      const response = await api.get<any[]>('/api/profesionales/especialidades');
      const data = response.data.map((item) => typeof item === 'string' ? item : item.nombre ?? item.especialidad ?? String(item));
      await setCachedJson('specialties', data);
      return data;
    } catch (error) {
      const cached = await getCachedJson<string[]>('specialties');
      if (cached) return cached;
      throw error;
    }
  },

  getBySpecialty: async (especialidad: string) => {
    return professionalService.getAll(especialidad);
  },
};
