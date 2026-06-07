import { api } from './client';

export type AdminSummary = Record<string, number>;

export type AdminUsuario = {
  id: number;
  email: string;
  rol: string;
  activo: boolean;
  emailVerificado: boolean;
  pacienteId?: number | null;
  profesionalId?: number | null;
  secretariaId?: number | null;
  nombreMostrar?: string;
  nombreCompleto?: string;
  dni?: string | null;
};

export type AdminCatalogItem = {
  id: number;
  nombre: string;
  codigo?: string | null;
  tipo?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  activa?: boolean;
  activo?: boolean;
  [key: string]: any;
};

export type AdminProfesional = {
  id: number;
  usuarioId?: number | null;
  email?: string | null;
  nombre: string;
  apellido: string;
  dni?: string | null;
  matricula?: string | null;
  telefono?: string | null;
  activo: boolean;
  especialidades: string[];
  instituciones: string[];
  [key: string]: any;
};

export type AdminSecretaria = {
  id: number;
  usuarioId?: number | null;
  email?: string | null;
  nombre: string;
  apellido: string;
  dni?: string | null;
  telefono?: string | null;
  activa: boolean;
  institucion?: string | null;
  [key: string]: any;
};

export type AdminPaciente = {
  id: number;
  usuarioId?: number | null;
  email?: string | null;
  nombre: string;
  apellido: string;
  dni?: string | null;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  tipoSangre?: string | null;
  obraSocial?: string | null;
  numeroCarnet?: string | null;
  numeroHistoriaClinica?: string | null;
  institucionCabecera?: string | null;
  medicoCabecera?: string | null;
  activo: boolean;
  [key: string]: any;
};

function bool(value: any, defaultValue = true) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
}

function num(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export function normalizeCatalogItem(item: any): AdminCatalogItem {
  return {
    ...item,
    id: num(item?.id ?? item?.value),
    nombre: String(item?.nombre ?? item?.name ?? item?.label ?? item?.razonSocial ?? ''),
    activa: bool(item?.activa ?? item?.activo, true),
    activo: bool(item?.activo ?? item?.activa, true),
  };
}

function normalizeUser(u: any): AdminUsuario {
  const rol = String(u?.rol ?? u?.role ?? 'SIN_ROL');
  const nombreMostrar = u?.nombreMostrar ?? u?.nombreCompleto ?? `${u?.nombre ?? ''} ${u?.apellido ?? ''}`.trim();
  return {
    id: num(u?.id ?? u?.usuarioId),
    email: String(u?.email ?? ''),
    rol,
    activo: bool(u?.activo, true),
    emailVerificado: bool(u?.emailVerificado, false),
    pacienteId: u?.pacienteId ?? null,
    profesionalId: u?.profesionalId ?? null,
    secretariaId: u?.secretariaId ?? null,
    nombreMostrar,
    nombreCompleto: nombreMostrar,
    dni: u?.dni ?? null,
  };
}

function normalizeProfesional(p: any): AdminProfesional {
  return {
    ...p,
    id: num(p?.id ?? p?.profesionalId),
    usuarioId: p?.usuarioId ?? null,
    email: p?.email ?? p?.usuarioEmail ?? null,
    nombre: String(p?.nombre ?? ''),
    apellido: String(p?.apellido ?? ''),
    dni: p?.dni ?? null,
    matricula: p?.matricula ?? null,
    telefono: p?.telefono ?? null,
    activo: bool(p?.activo, true),
    especialidades: Array.isArray(p?.especialidades) ? p.especialidades : [],
    instituciones: Array.isArray(p?.instituciones) ? p.instituciones : [],
  };
}

function normalizeSecretaria(s: any): AdminSecretaria {
  return {
    ...s,
    id: num(s?.id ?? s?.secretariaId),
    usuarioId: s?.usuarioId ?? null,
    email: s?.email ?? s?.usuarioEmail ?? null,
    nombre: String(s?.nombre ?? ''),
    apellido: String(s?.apellido ?? ''),
    dni: s?.dni ?? null,
    telefono: s?.telefono ?? null,
    activa: bool(s?.activa ?? s?.activo, true),
    institucion: s?.institucion ?? s?.institucionNombre ?? null,
  };
}

function normalizePaciente(p: any): AdminPaciente {
  return {
    ...p,
    id: num(p?.id ?? p?.pacienteId),
    usuarioId: p?.usuarioId ?? null,
    email: p?.email ?? p?.usuarioEmail ?? null,
    nombre: String(p?.nombre ?? ''),
    apellido: String(p?.apellido ?? ''),
    dni: p?.dni ?? null,
    fechaNacimiento: p?.fechaNacimiento ?? null,
    telefono: p?.telefono ?? null,
    tipoSangre: p?.tipoSangre ?? null,
    obraSocial: p?.obraSocial ?? p?.obraSocialNombre ?? null,
    numeroCarnet: p?.numeroCarnet ?? null,
    numeroHistoriaClinica: p?.numeroHistoriaClinica ?? null,
    institucionCabecera: p?.institucionCabecera ?? null,
    medicoCabecera: p?.medicoCabecera ?? null,
    activo: bool(p?.activo, true),
  };
}

export const adminService = {
  resumen: async () => {
    const response = await api.get<AdminSummary>('/api/admin/resumen');
    return response.data;
  },

  roles: async () => {
    const response = await api.get<string[]>('/api/admin/roles');
    return asArray<string>(response.data);
  },

  usuarios: async () => {
    const response = await api.get<any[]>('/api/admin/usuarios');
    return asArray(response.data).map(normalizeUser).filter((u) => Number.isFinite(u.id) && u.id > 0);
  },
  crearUsuario: async (data: { email: string; password: string; rol: string; activo?: boolean; emailVerificado?: boolean }) => {
    const response = await api.post('/api/admin/usuarios', data);
    return normalizeUser(response.data);
  },
  actualizarUsuario: async (id: number, data: Partial<{ email: string; password: string; rol: string; activo: boolean; emailVerificado: boolean }>) => {
    const response = await api.put(`/api/admin/usuarios/${id}`, data);
    return normalizeUser(response.data);
  },
  desactivarUsuario: async (id: number) => api.delete(`/api/admin/usuarios/${id}`),
  activarUsuario: async (id: number) => adminService.actualizarUsuario(id, { activo: true }),
  reenviarVerificacionUsuario: async (id: number) => {
    const response = await api.post(`/api/admin/usuarios/${id}/reenviar-verificacion`);
    return response.data as { ok?: boolean; message?: string };
  },

  profesionales: async () => {
    const response = await api.get<any[]>('/api/admin/profesionales');
    return asArray(response.data).map(normalizeProfesional).filter((p) => p.id > 0);
  },
  crearProfesional: async (data: Record<string, any>) => {
    const response = await api.post('/api/admin/profesionales', data);
    return normalizeProfesional(response.data);
  },
  actualizarProfesional: async (id: number, data: Record<string, any>) => {
    const response = await api.put(`/api/admin/profesionales/${id}`, data);
    return normalizeProfesional(response.data);
  },
  desactivarProfesional: async (id: number) => api.delete(`/api/admin/profesionales/${id}`),
  activarProfesional: async (id: number) => adminService.actualizarProfesional(id, { activo: true }),

  secretarias: async () => {
    const response = await api.get<any[]>('/api/admin/secretarias');
    return asArray(response.data).map(normalizeSecretaria).filter((s) => s.id > 0);
  },
  crearSecretaria: async (data: Record<string, any>) => {
    const response = await api.post('/api/admin/secretarias', data);
    return normalizeSecretaria(response.data);
  },
  actualizarSecretaria: async (id: number, data: Record<string, any>) => {
    const response = await api.put(`/api/admin/secretarias/${id}`, data);
    return normalizeSecretaria(response.data);
  },
  desactivarSecretaria: async (id: number) => api.delete(`/api/admin/secretarias/${id}`),
  activarSecretaria: async (id: number) => adminService.actualizarSecretaria(id, { activa: true }),

  pacientes: async () => {
    const response = await api.get<any[]>('/api/admin/pacientes');
    return asArray(response.data).map(normalizePaciente).filter((p) => p.id > 0);
  },
  crearPaciente: async (data: Record<string, any>) => {
    const response = await api.post('/api/admin/pacientes', data);
    return normalizePaciente(response.data);
  },
  actualizarPaciente: async (id: number, data: Record<string, any>) => {
    const response = await api.put(`/api/admin/pacientes/${id}`, data);
    return normalizePaciente(response.data);
  },
  desactivarPaciente: async (id: number) => api.delete(`/api/admin/pacientes/${id}`),
  activarPaciente: async (id: number) => adminService.actualizarPaciente(id, { activo: true }),

  especialidades: async () => {
    const response = await api.get<any[]>('/api/admin/especialidades');
    return asArray(response.data).map(normalizeCatalogItem).filter((item) => item.id > 0 && item.nombre);
  },
  crearEspecialidad: async (data: { nombre: string; activa?: boolean }) => {
    const response = await api.post('/api/admin/especialidades', data);
    return normalizeCatalogItem(response.data);
  },
  actualizarEspecialidad: async (id: number, data: { nombre: string; activa?: boolean }) => {
    const response = await api.put(`/api/admin/especialidades/${id}`, data);
    return normalizeCatalogItem(response.data);
  },
  desactivarEspecialidad: async (id: number) => api.delete(`/api/admin/especialidades/${id}`),

  obrasSociales: async () => {
    const response = await api.get<any[]>('/api/admin/obras-sociales');
    return asArray(response.data).map(normalizeCatalogItem).filter((item) => item.id > 0 && item.nombre);
  },
  crearObraSocial: async (data: { nombre: string; codigo?: string; activa?: boolean }) => {
    const response = await api.post('/api/admin/obras-sociales', data);
    return normalizeCatalogItem(response.data);
  },
  actualizarObraSocial: async (id: number, data: { nombre: string; codigo?: string; activa?: boolean }) => {
    const response = await api.put(`/api/admin/obras-sociales/${id}`, data);
    return normalizeCatalogItem(response.data);
  },
  desactivarObraSocial: async (id: number) => api.delete(`/api/admin/obras-sociales/${id}`),

  instituciones: async () => {
    const response = await api.get<any[]>('/api/admin/instituciones');
    return asArray(response.data).map(normalizeCatalogItem).filter((item) => item.id > 0 && item.nombre);
  },
  crearInstitucion: async (data: { nombre: string; tipo?: string; direccion: string; telefono?: string; whatsapp?: string; activa?: boolean }) => {
    const response = await api.post('/api/admin/instituciones', data);
    return normalizeCatalogItem(response.data);
  },
  actualizarInstitucion: async (id: number, data: { nombre: string; tipo?: string; direccion: string; telefono?: string; whatsapp?: string; activa?: boolean }) => {
    const response = await api.put(`/api/admin/instituciones/${id}`, data);
    return normalizeCatalogItem(response.data);
  },
  desactivarInstitucion: async (id: number) => api.delete(`/api/admin/instituciones/${id}`),
};
