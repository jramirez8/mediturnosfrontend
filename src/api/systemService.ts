import { api } from './client';

export const systemService = {
  diagnostico: async () => {
    const response = await api.get('/api/system/diagnostico');
    return response.data as Record<string, string>;
  },
};
