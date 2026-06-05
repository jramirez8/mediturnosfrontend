import { api } from './client';

export const securityService = {
  verifyTwoFactor: async (usuarioId: number | string, codigo: string) => {
    const response = await api.post('/api/auth/2fa/verify', { usuarioId: Number(usuarioId), codigo });
    return response.data;
  },
};
