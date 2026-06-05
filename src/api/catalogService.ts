import { api } from './client';
import { Professional } from './professionalService';

export type CatalogItem = {
  id: number;
  nombre: string;
  [key: string]: any;
};

const normalizeCatalogItem = (item: any): CatalogItem => ({
  ...item,
  id: Number(item.id ?? item.value),
  nombre: String(item.nombre ?? item.name ?? item.label ?? ''),
});

export const catalogService = {
  obrasSociales: async (): Promise<CatalogItem[]> => {
    const response = await api.get<any[]>('/api/obras-sociales');
    return response.data.map(normalizeCatalogItem).filter((item) => Number.isFinite(item.id) && item.nombre);
  },

  instituciones: async (): Promise<CatalogItem[]> => {
    const response = await api.get<any[]>('/api/instituciones');
    return response.data.map(normalizeCatalogItem).filter((item) => Number.isFinite(item.id) && item.nombre);
  },

  profesionales: async (): Promise<Professional[]> => {
    const response = await api.get<any[]>('/api/profesionales');
    return response.data.map((p: any) => ({
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
    })).filter((p: Professional) => Number.isFinite(p.id));
  },
};
