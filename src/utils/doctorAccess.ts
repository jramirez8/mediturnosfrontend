import type { TurnoResponse } from '../api/appointmentService';

export type DoctorAccessIdentity = {
  profesionalId?: string | number | null;
  profesionalInstitucionId?: string | number | null;
  nombreCompleto?: string | null;
};

function cleanId(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : null;
}

function normalizeName(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/dra?\.?|dr\.?|medica|medico/gi, '')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function sameName(a?: string | null, b?: string | null) {
  const left = normalizeName(a);
  const right = normalizeName(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

export function turnoBelongsToDoctor(turno: TurnoResponse | null | undefined, doctor: DoctorAccessIdentity) {
  if (!turno) return false;

  const turnoProfesionalId = cleanId(turno.profesionalId);
  const doctorProfesionalId = cleanId(doctor.profesionalId);
  if (turnoProfesionalId && doctorProfesionalId) return turnoProfesionalId === doctorProfesionalId;

  const turnoPiId = cleanId(turno.profesionalInstitucionId);
  const doctorPiId = cleanId(doctor.profesionalInstitucionId);
  if (turnoPiId && doctorPiId) return turnoPiId === doctorPiId;

  // Fallback defensivo para backends que todavía no devuelven IDs del médico en login.
  // No reemplaza la validación del backend, pero evita que el front habilite turnos claramente ajenos.
  if (doctor.nombreCompleto && turno.profesionalNombre) {
    return sameName(turno.profesionalNombre, doctor.nombreCompleto);
  }

  return false;
}

export function filterTurnosForDoctor(turnos: TurnoResponse[], doctor: DoctorAccessIdentity) {
  return turnos.filter((turno) => turnoBelongsToDoctor(turno, doctor));
}

export function doctorAccessMessage() {
  return 'Este turno no pertenece al médico logueado. Por seguridad no se puede atender ni modificar.';
}
