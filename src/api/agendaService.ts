import { api } from './client';
import { clearAppCache } from '../db/cache';

export type HorarioAtencion = {
  id: number;
  profesionalInstitucionId: number;
  especialidadId: number;
  especialidad?: string;
  diaSemana: string;
  horaDesde: string;
  horaHasta: string;
  duracionTurnoMin: number;
  activo: boolean;
};

export type AgendaBloqueo = {
  id: number;
  profesionalInstitucionId: number;
  fechaDesde: string;
  fechaHasta: string;
  motivo?: string;
};

export function normalizeScheduleDay(value?: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export function uniqueSchedulesByDay(horarios: HorarioAtencion[]) {
  const seen = new Set<string>();
  return horarios.filter((horario) => {
    const day = normalizeScheduleDay(horario.diaSemana);
    if (!day || seen.has(day)) return false;
    seen.add(day);
    return true;
  });
}

export function hasActiveScheduleForDay(horarios: HorarioAtencion[], day: string) {
  const normalizedDay = normalizeScheduleDay(day);
  return horarios.some((horario) => horario.activo !== false && normalizeScheduleDay(horario.diaSemana) === normalizedDay);
}

export const agendaService = {
  getHorarios: async (profesionalInstitucionId: number) => {
    const response = await api.get<HorarioAtencion[]>('/api/agenda/horarios', { params: { profesionalInstitucionId } });
    return uniqueSchedulesByDay(response.data);
  },
  createHorario: async (data: Partial<HorarioAtencion>) => {
    const response = await api.post<HorarioAtencion>('/api/agenda/horarios', data);
    await clearAppCache();
    return response.data;
  },
  updateHorario: async (id: number, data: Partial<HorarioAtencion>) => {
    const response = await api.put<HorarioAtencion>(`/api/agenda/horarios/${id}`, data);
    await clearAppCache();
    return response.data;
  },
  deleteHorario: async (id: number) => {
    await api.delete(`/api/agenda/horarios/${id}`);
    await clearAppCache();
  },
  getBloqueos: async (profesionalInstitucionId: number) => {
    const response = await api.get<AgendaBloqueo[]>('/api/agenda/bloqueos', { params: { profesionalInstitucionId } });
    return response.data;
  },
  createBloqueo: async (data: Partial<AgendaBloqueo>) => {
    const response = await api.post<AgendaBloqueo>('/api/agenda/bloqueos', data);
    await clearAppCache();
    return response.data;
  },
  updateBloqueo: async (id: number, data: Partial<AgendaBloqueo>) => {
    const response = await api.put<AgendaBloqueo>(`/api/agenda/bloqueos/${id}`, data);
    await clearAppCache();
    return response.data;
  },
  deleteBloqueo: async (id: number) => {
    await api.delete(`/api/agenda/bloqueos/${id}`);
    await clearAppCache();
  },
};
