import { api } from './client';
import { TurnoResponse } from './appointmentService';
import { getCachedJson, setCachedJson } from '../db/cache';
import { demoAppointments } from '../data/demoData';

export const medicalHistoryService = {
  getHistory: async (usuarioId?: string | null) => {
    const cacheKey = `history:${usuarioId ?? 'me'}`;
    try {
      const endpoint = usuarioId ? `/api/turnos/historia-clinica/${usuarioId}` : '/api/turnos/historia-clinica/me';
      const response = await api.get<TurnoResponse[]>(endpoint);
      await setCachedJson(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const cached = await getCachedJson<TurnoResponse[]>(cacheKey);
      return cached ?? demoAppointments.filter((turno) => turno.estado === 'FINALIZADO');
    }
  },

  getRecordDetail: async (id: number) => {
    try {
      const response = await api.get<TurnoResponse>(`/api/turnos/${id}`);
      await setCachedJson(`history-detail:${id}`, response.data);
      return response.data;
    } catch (error) {
      const cached = await getCachedJson<TurnoResponse>(`history-detail:${id}`);
      if (cached) return cached;
      return demoAppointments.find((turno) => turno.id === id) ?? demoAppointments[0];
    }
  },

  saveConsultationDetail: async (turnoId: number, data: {
    motivoConsulta?: string;
    enfermedadActual?: string;
    antecedenteEnfermedadActual?: string;
    antecedentesPersonales?: string;
    antecedentesFamiliares?: string;
    medicacionActual?: string;
    alergias?: string;
    habitos?: string;
    hallazgosExamenFisico?: string;
    conducta?: string;
  }) => {
    const response = await api.put(`/api/turnos/${turnoId}/detalle-consulta`, data);
    return response.data;
  },

  // Alias viejo: este endpoint NO recibe multipart en el backend; guardamos detalle clínico JSON.
  uploadDocument: async (turnoId: number, data: FormData | Record<string, unknown>) => {
    const response = await api.put(`/api/turnos/${turnoId}/detalle-consulta`, data instanceof FormData ? {} : data);
    return response.data;
  },
};
