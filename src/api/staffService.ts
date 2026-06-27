import { api } from './client';
import { appointmentService, TurnoResponse } from './appointmentService';
import { todayLocalIso } from '../utils/date';

export const medicoService = {
  agenda: async (usuarioId: string | number, fecha = todayLocalIso()): Promise<TurnoResponse[]> => {
    const response = await api.get<unknown[]>(`/api/profesionales/agenda/${usuarioId}`, { params: { fecha } });
    return response.data.map((item) => appointmentService.normalizeForStaff(item));
  },
  agendaRango: async (usuarioId: string | number, desde: string, hasta: string): Promise<TurnoResponse[]> => {
    const response = await api.get<unknown[]>(`/api/profesionales/agenda/${usuarioId}/rango`, { params: { desde, hasta } });
    return response.data.map((item) => appointmentService.normalizeForStaff(item));
  },
  proximoTurno: async (usuarioId: string | number): Promise<TurnoResponse | null> => {
    const response = await api.get<unknown>(`/api/profesionales/proximo-turno/${usuarioId}`);
    return response.data ? appointmentService.normalizeForStaff(response.data) : null;
  },
  historialPaciente: async (dni: string): Promise<TurnoResponse[]> => {
    const response = await api.get<unknown[]>('/api/profesionales/historial-paciente', { params: { dni } });
    return response.data.map((item) => appointmentService.normalizeForStaff(item));
  },
  guardarConsulta: async (turnoId: number, data: Record<string, string>) => appointmentService.guardarDetalleConsulta(turnoId, data),
  marcarAtendido: async (turnoId: number) => appointmentService.actualizarEstado(turnoId, 'ATENDIDO'),
};

export const secretariaService = {
  turnos: async (): Promise<TurnoResponse[]> => {
    const response = await api.get<unknown[]>('/api/turnos');
    return response.data.map((item) => appointmentService.normalizeForStaff(item));
  },
  buscarPaciente: async (dni: string): Promise<Record<string, unknown> | null> => {
    const response = await api.get<unknown>('/api/secretaria/pacientes/buscar', { params: { dni } });
    return typeof response.data === 'object' && response.data !== null ? response.data as Record<string, unknown> : null;
  },
  confirmar: async (turnoId: number) => appointmentService.actualizarEstado(turnoId, 'CONFIRMADO'),
  cancelar: async (turnoId: number) => appointmentService.actualizarEstado(turnoId, 'CANCELADO'),
  ausente: async (turnoId: number) => appointmentService.actualizarEstado(turnoId, 'AUSENTE'),
  atendido: async (turnoId: number) => appointmentService.actualizarEstado(turnoId, 'ATENDIDO'),
  crearTurno: async (data: Parameters<typeof appointmentService.solicitar>[0]) => appointmentService.solicitar(data),
};
