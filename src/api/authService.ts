import { api } from './client';

export type RegistrationRequest = {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  repeatPassword?: string;
  obraSocialId?: number | string;
  obraSocial?: string;
  tipoSangre?: string;
  fechaNacimiento?: string;
  numeroHistoriaClinica?: string;
  numeroCarnet?: string;
  numeroAfiliado?: string;
  institucionCabecera?: string;
  hospitalClinicaCabecera?: string;
  medicoCabecera?: string;
  doctorCabecera?: string;
  telefono?: string;
};

export type ForgotPasswordResponse = {
  mensaje?: string;
  message?: string;
  resetToken?: string | null;
  token?: string | null;
  resetUrl?: string | null;
  emailEnviado?: boolean;
};

function clean(value?: string | number | null) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function requirePositiveNumber(value: unknown, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Falta ${fieldName} real. No se completa registro con datos inventados.`);
  }
  return parsed;
}

function requireText(value: string | number | null | undefined, fieldName: string) {
  const text = clean(value);
  if (!text) throw new Error(`Falta ${fieldName}. No se completa registro con datos inventados.`);
  return text;
}

function buildRegistrationPayload(data: RegistrationRequest) {
  const password = clean(data.password) ?? '';
  const dni = clean(data.dni) ?? '';

  return {
    nombre: clean(data.nombre) ?? '',
    apellido: clean(data.apellido) ?? '',
    dni,
    email: clean(data.email) ?? '',
    password,
    confirmPassword: clean(data.confirmPassword ?? data.repeatPassword) ?? password,
    obraSocialId: requirePositiveNumber(data.obraSocialId, 'obraSocialId'),
    tipoSangre: requireText(data.tipoSangre, 'tipoSangre'),
    numeroCarnet: requireText(data.numeroCarnet ?? data.numeroAfiliado, 'numeroCarnet'),
    numeroHistoriaClinica: requireText(data.numeroHistoriaClinica, 'numeroHistoriaClinica'),
    hospitalClinicaCabecera: clean(data.hospitalClinicaCabecera ?? data.institucionCabecera),
    doctorCabecera: clean(data.doctorCabecera ?? data.medicoCabecera),
    fechaNacimiento: requireText(data.fechaNacimiento, 'fechaNacimiento'),
    telefono: requireText(data.telefono, 'telefono'),
  };
}

export const authService = {
  register: async (data: RegistrationRequest) => {
    const response = await api.post('/api/auth/register', buildRegistrationPayload(data));
    return response.data;
  },

  forgotPassword: async (identifier: string): Promise<ForgotPasswordResponse> => {
    const response = await api.post('/api/auth/forgot-password', { identificador: identifier });
    return response.data;
  },

  resetPassword: async (token: string, password: string, confirmPassword: string) => {
    const response = await api.post('/api/auth/reset-password', {
      token,
      password,
      confirmPassword,
    });
    return response.data;
  },
};
