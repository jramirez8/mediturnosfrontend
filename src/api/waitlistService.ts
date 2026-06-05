import { api } from './client';

export type WaitlistEntry = {
  id: number;
  pacienteId: number;
  pacienteNombre?: string;
  profesionalInstitucionId: number;
  especialidadId: number;
  especialidad?: string;
  fechaPreferidaDesde?: string;
  fechaPreferidaHasta?: string;
  observaciones?: string;
  estado: string;
  creadoEn?: string;
  notificadoEn?: string;
};

export const waitlistService = {
  join: async (data: {
    pacienteId: number | string;
    profesionalInstitucionId: number | string;
    especialidadId: number | string;
    fechaPreferidaDesde?: string;
    fechaPreferidaHasta?: string;
    observaciones?: string;
  }) => {
    const response = await api.post<WaitlistEntry>('/api/lista-espera', {
      pacienteId: Number(data.pacienteId),
      profesionalInstitucionId: Number(data.profesionalInstitucionId),
      especialidadId: Number(data.especialidadId),
      fechaPreferidaDesde: data.fechaPreferidaDesde || undefined,
      fechaPreferidaHasta: data.fechaPreferidaHasta || undefined,
      observaciones: data.observaciones || undefined,
    });
    return response.data;
  },
  mine: async () => {
    const response = await api.get<WaitlistEntry[]>('/api/lista-espera/me');
    return response.data;
  },
};
