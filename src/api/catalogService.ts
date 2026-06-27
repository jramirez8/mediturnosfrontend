import { api } from './client';
import { Professional } from './professionalService';

type UnknownRecord = Record<string, unknown>;

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function maybeString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export type CatalogItem = {
  id: number;
  nombre: string;
  [key: string]: unknown;
};

const normalizeCatalogItem = (item: unknown): CatalogItem => {
  const source = typeof item === 'object' && item !== null ? item as UnknownRecord : {};
  return {
    ...source,
    id: Number(source.id ?? source.value),
    nombre: asString(source.nombre ?? source.name ?? source.label ?? ''),
  };
};

export const catalogService = {
  obrasSociales: async (): Promise<CatalogItem[]> => {
    const response = await api.get<unknown[]>('/api/obras-sociales');
    return response.data.map(normalizeCatalogItem).filter((item) => Number.isFinite(item.id) && item.nombre);
  },

  instituciones: async (): Promise<CatalogItem[]> => {
    const response = await api.get<unknown[]>('/api/instituciones');
    return response.data.map(normalizeCatalogItem).filter((item) => Number.isFinite(item.id) && item.nombre);
  },

  profesionales: async (): Promise<Professional[]> => {
    const response = await api.get<unknown[]>('/api/profesionales');
    return response.data.map((p: unknown) => {
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
    }).filter((p: Professional) => Number.isFinite(p.id));
  },
};
