export type ApiId = number | string;

export type LoginResponseDto = {
  token?: string;
  accessToken?: string;
  jwt?: string;
  usuarioId?: ApiId;
  userId?: ApiId;
  pacienteId?: ApiId;
  profesionalId?: ApiId;
  profesionalInstitucionId?: ApiId;
  role?: string;
  rol?: string;
  tipoUsuario?: string;
  nombreCompleto?: string;
  requiereSegundoFactor?: boolean;
  requiresTwoFactor?: boolean;
  segundoFactorDestino?: string;
  twoFactorDestination?: string;
  usuario?: { id?: ApiId; rol?: string; nombreCompleto?: string };
  paciente?: { id?: ApiId };
  profesional?: { id?: ApiId; profesionalInstitucionId?: ApiId };
  profesionalInstitucion?: { id?: ApiId };
};

export type ProfessionalDto = {
  id?: ApiId;
  profesionalId?: ApiId;
  profesionalInstitucionId?: ApiId;
  institucionId?: ApiId;
  especialidadId?: ApiId;
  nombre?: string;
  apellido?: string;
  profesionalNombre?: string;
  profesionalApellido?: string;
  especialidad?: string;
  especialidadNombre?: string;
  institucion?: string;
  institucionNombre?: string;
  matricula?: string;
  proximaDisponibilidad?: string;
  telefono?: string;
  email?: string;
};

export type AppointmentSlotDto = {
  fecha?: string;
  hora?: string;
  fechaHora?: string;
  fechaHoraIso?: string;
  fechaHoraInicio?: string;
  fecha_hora?: string;
  disponible?: boolean;
};
