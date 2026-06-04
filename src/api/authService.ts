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

function numberOrDefault(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
    // El backend trabaja por ID. Si la pantalla vieja manda texto, usamos Particular=1 como fallback de demo.
    obraSocialId: numberOrDefault(data.obraSocialId, 1),
    tipoSangre: clean(data.tipoSangre) ?? 'O_POSITIVO',
    numeroCarnet: clean(data.numeroCarnet ?? data.numeroAfiliado) ?? `AF-${dni || Date.now()}`,
    numeroHistoriaClinica: clean(data.numeroHistoriaClinica) ?? `HC-${dni || Date.now()}`,
    hospitalClinicaCabecera: clean(data.hospitalClinicaCabecera ?? data.institucionCabecera),
    doctorCabecera: clean(data.doctorCabecera ?? data.medicoCabecera),
    fechaNacimiento: clean(data.fechaNacimiento) ?? '1990-01-01',
    telefono: clean(data.telefono) ?? '0000000000',
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
