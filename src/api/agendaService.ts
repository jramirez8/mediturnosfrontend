import { api } from './client';

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

export const agendaService = {
  getHorarios: async (profesionalInstitucionId: number) => {
    const response = await api.get<HorarioAtencion[]>('/api/agenda/horarios', { params: { profesionalInstitucionId } });
    return response.data;
  },
  createHorario: async (data: Partial<HorarioAtencion>) => {
    const response = await api.post<HorarioAtencion>('/api/agenda/horarios', data);
    return response.data;
  },
  deleteHorario: async (id: number) => api.delete(`/api/agenda/horarios/${id}`),
  getBloqueos: async (profesionalInstitucionId: number) => {
    const response = await api.get<AgendaBloqueo[]>('/api/agenda/bloqueos', { params: { profesionalInstitucionId } });
    return response.data;
  },
  createBloqueo: async (data: Partial<AgendaBloqueo>) => {
    const response = await api.post<AgendaBloqueo>('/api/agenda/bloqueos', data);
    return response.data;
  },
  deleteBloqueo: async (id: number) => api.delete(`/api/agenda/bloqueos/${id}`),
};
