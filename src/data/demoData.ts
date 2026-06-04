import type { Professional } from '../api/professionalService';
import type { TurnoResponse } from '../api/appointmentService';
import type { UserProfile } from '../api/userService';

export const demoProfile: UserProfile = {
  id: 1,
  usuarioId: 1,
  nombre: 'Juan',
  apellido: 'Ramírez',
  dni: '12345678',
  email: 'admin@mediturnos.local',
  telefono: '11 5555-5555',
  obraSocialId: 4,
  obraSocial: 'OSDE',
  numeroAfiliado: 'MT-0001',
  institucionCabecera: 'Clínica Central',
  medicoCabecera: 'Dra. Martina Suárez',
};

export const demoSpecialties = ['Clínica Médica', 'Cardiología', 'Dermatología', 'Pediatría', 'Traumatología', 'Neurología'];

export const demoProfessionals: Professional[] = [
  { id: 1, profesionalInstitucionId: 101, especialidadId: 1, institucionId: 1, nombre: 'Martina', apellido: 'Suárez', especialidad: 'Clínica Médica', institucion: 'Clínica Central', matricula: 'MN 125430', proximaDisponibilidad: 'Hoy 16:00' },
  { id: 2, profesionalInstitucionId: 102, especialidadId: 2, institucionId: 2, nombre: 'Federico', apellido: 'López', especialidad: 'Cardiología', institucion: 'Sanatorio Norte', matricula: 'MN 88214', proximaDisponibilidad: 'Mañana 10:30' },
  { id: 3, profesionalInstitucionId: 103, especialidadId: 3, institucionId: 3, nombre: 'Lucía', apellido: 'Pereyra', especialidad: 'Dermatología', institucion: 'Centro Médico Belgrano', matricula: 'MN 98211', proximaDisponibilidad: 'Viernes 09:00' },
  { id: 4, profesionalInstitucionId: 104, especialidadId: 5, institucionId: 1, nombre: 'Ramiro', apellido: 'Gómez', especialidad: 'Traumatología', institucion: 'Clínica Central', matricula: 'MN 114522', proximaDisponibilidad: 'Lunes 15:00' },
];

export const demoAppointments: TurnoResponse[] = [
  { id: 9001, profesionalId: 1, profesionalInstitucionId: 101, especialidadId: 1, pacienteId: 1, fecha: '2026-06-08', hora: '10:30', pacienteNombre: 'Juan Ramírez', profesionalNombre: 'Dra. Martina Suárez', especialidad: 'Clínica Médica', institucionNombre: 'Clínica Central', estado: 'CONFIRMADO', motivoConsulta: 'Control general' },
  { id: 9002, profesionalId: 2, profesionalInstitucionId: 102, especialidadId: 2, pacienteId: 1, fecha: '2026-06-15', hora: '16:00', pacienteNombre: 'Juan Ramírez', profesionalNombre: 'Dr. Federico López', especialidad: 'Cardiología', institucionNombre: 'Sanatorio Norte', estado: 'PENDIENTE', motivoConsulta: 'Chequeo cardiológico' },
  { id: 8001, profesionalId: 3, profesionalInstitucionId: 103, especialidadId: 3, pacienteId: 1, fecha: '2026-04-20', hora: '09:00', pacienteNombre: 'Juan Ramírez', profesionalNombre: 'Dra. Lucía Pereyra', especialidad: 'Dermatología', institucionNombre: 'Centro Médico Belgrano', estado: 'FINALIZADO', motivoConsulta: 'Consulta dermatológica', diagnostico: 'Dermatitis leve', observaciones: 'Continuar hidratación y control.' },
];

export const demoSlots = [
  { fecha: '2026-06-08', hora: '09:00', disponible: true },
  { fecha: '2026-06-08', hora: '10:30', disponible: true },
  { fecha: '2026-06-09', hora: '14:00', disponible: true },
  { fecha: '2026-06-10', hora: '16:00', disponible: true },
  { fecha: '2026-06-11', hora: '11:30', disponible: true },
];
