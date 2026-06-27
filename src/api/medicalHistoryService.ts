import { api } from './client';
import { appointmentService, TurnoResponse } from './appointmentService';
import { getCachedJson, setCachedJson } from '../db/cache';

function normalizeList(data: unknown[]): TurnoResponse[] {
  return (Array.isArray(data) ? data : []).map((item) => appointmentService.normalizeForStaff(item));
}

export const medicalHistoryService = {
  getHistory: async (usuarioId?: string | null) => {
    const cacheKey = `history:${usuarioId ?? 'me'}`;
    try {
      const endpoint = usuarioId ? `/api/turnos/historia-clinica/${usuarioId}` : '/api/turnos/historia-clinica/me';
      const response = await api.get<unknown[]>(endpoint);
      const data = normalizeList(response.data);
      await setCachedJson(cacheKey, data);
      return data;
    } catch (error: unknown) {
      const cached = await getCachedJson<TurnoResponse[]>(cacheKey);
      if (cached) return cached;
      throw error;
    }
  },

  getRecordDetail: async (id: number) => {
    try {
      const response = await api.get<unknown>(`/api/turnos/${id}`);
      const data = appointmentService.normalizeForStaff(response.data);
      await setCachedJson(`history-detail:${id}`, data);
      return data;
    } catch (error: unknown) {
      const cached = await getCachedJson<TurnoResponse>(`history-detail:${id}`);
      if (cached) return cached;
      throw error;
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
    diagnostico?: string;
    conducta?: string;
  }) => {
    const response = await api.put(`/api/turnos/${turnoId}/detalle-consulta`, data);
    return appointmentService.normalizeForStaff(response.data);
  },
};
