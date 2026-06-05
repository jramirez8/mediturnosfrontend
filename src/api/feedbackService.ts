import { api } from './client';

export type TurnoFeedback = {
  id: number;
  turnoId: number;
  puntuacion: number;
  comentario?: string;
  creadoEn?: string;
};

export const feedbackService = {
  save: async (turnoId: number, puntuacion: number, comentario: string) => {
    const response = await api.post<TurnoFeedback>(`/api/turnos/${turnoId}/feedback`, { puntuacion, comentario });
    return response.data;
  },
  get: async (turnoId: number) => {
    const response = await api.get<TurnoFeedback | null>(`/api/turnos/${turnoId}/feedback`);
    return response.data;
  },
};
