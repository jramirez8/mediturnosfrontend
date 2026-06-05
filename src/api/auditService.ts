import { api } from './client';

export type AuditLog = {
  id: number;
  accion: string;
  entidad?: string;
  entidadId?: number;
  actor?: string;
  detalle?: string;
  creadoEn?: string;
};

export const auditService = {
  latest: async () => {
    const response = await api.get<AuditLog[]>('/api/admin/auditoria');
    return response.data;
  },
};
