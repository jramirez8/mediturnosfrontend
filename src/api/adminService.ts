import { api } from './client';

export type AdminSummary = Record<string, number>;
export type AdminUsuario = {
  id: number;
  email: string;
  rol: string;
  activo?: boolean;
  emailVerificado?: boolean;
  nombreCompleto?: string;
};
export type AdminPersona = Record<string, any> & { id: number; nombre?: string; apellido?: string; email?: string; activo?: boolean; activa?: boolean };

function normalizeUser(u: any): AdminUsuario {
  return {
    id: Number(u.id ?? u.usuarioId),
    email: u.email ?? '',
    rol: String(u.rol ?? u.role ?? 'SIN_ROL'),
    activo: u.activo,
    emailVerificado: u.emailVerificado,
    nombreCompleto: u.nombreCompleto ?? `${u.nombre ?? ''} ${u.apellido ?? ''}`.trim(),
  };
}

export const adminService = {
  resumen: async () => {
    const response = await api.get<AdminSummary>('/api/admin/resumen');
    return response.data;
  },
  usuarios: async () => {
    const response = await api.get<any[]>('/api/admin/usuarios');
    return response.data.map(normalizeUser).filter((u) => Number.isFinite(u.id));
  },
  desactivarUsuario: async (id: number) => api.delete(`/api/admin/usuarios/${id}`),
  profesionales: async () => {
    const response = await api.get<AdminPersona[]>('/api/admin/profesionales');
    return response.data;
  },
  pacientes: async () => {
    const response = await api.get<AdminPersona[]>('/api/admin/pacientes');
    return response.data;
  },
  secretarias: async () => {
    const response = await api.get<AdminPersona[]>('/api/admin/secretarias');
    return response.data;
  },
  especialidades: async () => {
    const response = await api.get<any[]>('/api/admin/especialidades');
    return response.data;
  },
  obrasSociales: async () => {
    const response = await api.get<any[]>('/api/admin/obras-sociales');
    return response.data;
  },
  instituciones: async () => {
    const response = await api.get<any[]>('/api/admin/instituciones');
    return response.data;
  },
};
