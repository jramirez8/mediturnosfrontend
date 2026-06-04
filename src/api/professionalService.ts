import { api } from './client';
import { getCachedJson, setCachedJson } from '../db/cache';

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

export const professionalService = {
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
