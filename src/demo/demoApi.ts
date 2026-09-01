import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';
export const DEMO_PASSWORD = 'Demo1234';

export const DEMO_USERS = [
  { email: 'admin@demo.mediturnos.net.ar', role: 'ADMIN', nombre: 'Juan Administrador', usuarioId: '9001' },
  { email: 'secretaria@demo.mediturnos.net.ar', role: 'SECRETARY', nombre: 'Sofía Recepción', usuarioId: '9002' },
  { email: 'profesional@demo.mediturnos.net.ar', role: 'PROFESSIONAL', nombre: 'Dra. Martina López', usuarioId: '9003', profesionalId: '201', profesionalInstitucionId: '301' },
  { email: 'paciente@demo.mediturnos.net.ar', role: 'PATIENT', nombre: 'Juan Pérez', usuarioId: '9004', pacienteId: '101' },
] as const;

const iso = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const professionals = [
  { id: 201, profesionalId: 201, profesionalInstitucionId: 301, institucionId: 1, especialidadId: 1, nombre: 'Martina', apellido: 'López', profesionalNombre: 'Martina', profesionalApellido: 'López', especialidad: 'Clínica médica', institucion: 'Centro Médico del Mar', institucionNombre: 'Centro Médico del Mar', matricula: 'MP 45821', telefono: '223 555-0142', email: 'profesional@demo.mediturnos.net.ar', proximaDisponibilidad: `${iso(1)}T09:00` },
  { id: 202, profesionalId: 202, profesionalInstitucionId: 302, institucionId: 1, especialidadId: 2, nombre: 'Tomás', apellido: 'Silva', especialidad: 'Cardiología', institucion: 'Centro Médico del Mar', institucionNombre: 'Centro Médico del Mar', matricula: 'MP 39210', proximaDisponibilidad: `${iso(2)}T11:30` },
  { id: 203, profesionalId: 203, profesionalInstitucionId: 303, institucionId: 2, especialidadId: 3, nombre: 'Lucía', apellido: 'Fernández', especialidad: 'Pediatría', institucion: 'Clínica Atlántica', institucionNombre: 'Clínica Atlántica', matricula: 'MP 51208', proximaDisponibilidad: `${iso(1)}T15:00` },
  { id: 204, profesionalId: 204, profesionalInstitucionId: 304, institucionId: 2, especialidadId: 4, nombre: 'Nicolás', apellido: 'Rossi', especialidad: 'Dermatología', institucion: 'Clínica Atlántica', institucionNombre: 'Clínica Atlántica', matricula: 'MP 48772', proximaDisponibilidad: `${iso(3)}T10:00` },
];

const profile = { id: 101, pacienteId: 101, usuarioId: 9004, nombre: 'Juan', apellido: 'Pérez', dni: '32123456', email: 'paciente@demo.mediturnos.net.ar', telefono: '223 555-0199', obraSocialId: 1, obraSocialNombre: 'OSDE', numeroCarnet: '40-32123456-7', numeroHistoriaClinica: 'HC-2026-0101', hospitalClinicaCabecera: 'Centro Médico del Mar', doctorCabecera: 'Dra. Martina López' };

let appointments: any[] = [
  { id: 501, pacienteId: 101, pacienteNombre: 'Juan', pacienteApellido: 'Pérez', pacienteDni: '32123456', profesionalId: 201, profesionalInstitucionId: 301, especialidadId: 1, profesionalNombre: 'Martina', profesionalApellido: 'López', especialidad: 'Clínica médica', institucionId: 1, institucionNombre: 'Centro Médico del Mar', direccionAtencion: 'Av. Colón 2450 · Mar del Plata', fechaHora: `${iso(1)}T09:30`, estado: 'CONFIRMADO', motivoConsulta: 'Control clínico anual', asistenciaConfirmada: true },
  { id: 502, pacienteId: 102, pacienteNombre: 'Carolina', pacienteApellido: 'Méndez', pacienteDni: '35444111', profesionalId: 201, profesionalInstitucionId: 301, especialidadId: 1, profesionalNombre: 'Martina', profesionalApellido: 'López', especialidad: 'Clínica médica', institucionId: 1, institucionNombre: 'Centro Médico del Mar', fechaHora: `${iso(0)}T10:00`, estado: 'PENDIENTE', motivoConsulta: 'Dolor de garganta' },
  { id: 503, pacienteId: 103, pacienteNombre: 'Miguel', pacienteApellido: 'Torres', pacienteDni: '27889900', profesionalId: 201, profesionalInstitucionId: 301, especialidadId: 1, profesionalNombre: 'Martina', profesionalApellido: 'López', especialidad: 'Clínica médica', institucionId: 1, institucionNombre: 'Centro Médico del Mar', fechaHora: `${iso(0)}T11:00`, estado: 'CONFIRMADO', motivoConsulta: 'Seguimiento de laboratorio' },
  { id: 504, pacienteId: 101, pacienteNombre: 'Juan', pacienteApellido: 'Pérez', pacienteDni: '32123456', profesionalId: 202, profesionalInstitucionId: 302, especialidadId: 2, profesionalNombre: 'Tomás', profesionalApellido: 'Silva', especialidad: 'Cardiología', institucionId: 1, institucionNombre: 'Centro Médico del Mar', fechaHora: `${iso(-25)}T16:00`, estado: 'ATENDIDO', motivoConsulta: 'Control de presión', diagnostico: 'Presión arterial dentro de parámetros normales.', conducta: 'Continuar controles semestrales.', medicacionActual: 'Sin medicación', alergias: 'No refiere' },
  { id: 505, pacienteId: 104, pacienteNombre: 'Elena', pacienteApellido: 'Gómez', pacienteDni: '24110987', profesionalId: 203, profesionalInstitucionId: 303, especialidadId: 3, profesionalNombre: 'Lucía', profesionalApellido: 'Fernández', especialidad: 'Pediatría', institucionId: 2, institucionNombre: 'Clínica Atlántica', fechaHora: `${iso(0)}T15:30`, estado: 'REPROGRAMADO', motivoConsulta: 'Control pediátrico' },
];

let horarios = [
  { id: 1, profesionalInstitucionId: 301, especialidadId: 1, especialidad: 'Clínica médica', diaSemana: 'LUNES', horaDesde: '09:00', horaHasta: '13:00', duracionTurnoMin: 30, activo: true },
  { id: 2, profesionalInstitucionId: 301, especialidadId: 1, especialidad: 'Clínica médica', diaSemana: 'MIERCOLES', horaDesde: '14:00', horaHasta: '18:00', duracionTurnoMin: 30, activo: true },
  { id: 3, profesionalInstitucionId: 301, especialidadId: 1, especialidad: 'Clínica médica', diaSemana: 'VIERNES', horaDesde: '09:00', horaHasta: '12:00', duracionTurnoMin: 30, activo: true },
];
let bloqueos = [{ id: 1, profesionalInstitucionId: 301, fechaDesde: iso(12), fechaHasta: iso(14), motivo: 'Congreso médico' }];

const catalogs: Record<string, any[]> = {
  especialidades: [{ id: 1, nombre: 'Clínica médica', activa: true }, { id: 2, nombre: 'Cardiología', activa: true }, { id: 3, nombre: 'Pediatría', activa: true }, { id: 4, nombre: 'Dermatología', activa: true }],
  'obras-sociales': [{ id: 1, nombre: 'OSDE', codigo: 'OSDE', activa: true }, { id: 2, nombre: 'Swiss Medical', codigo: 'SWISS', activa: true }, { id: 3, nombre: 'IOMA', codigo: 'IOMA', activa: true }],
  instituciones: [{ id: 1, nombre: 'Centro Médico del Mar', tipo: 'Centro médico', direccion: 'Av. Colón 2450', telefono: '223 555-0100', activa: true }, { id: 2, nombre: 'Clínica Atlántica', tipo: 'Clínica', direccion: 'Independencia 1830', telefono: '223 555-0200', activa: true }],
};

const patients = [profile, { id: 102, usuarioId: 9102, nombre: 'Carolina', apellido: 'Méndez', dni: '35444111', email: 'carolina@example.com', telefono: '2235550102', obraSocial: 'IOMA', numeroHistoriaClinica: 'HC-2026-0102', activo: true }, { id: 103, usuarioId: 9103, nombre: 'Miguel', apellido: 'Torres', dni: '27889900', email: 'miguel@example.com', telefono: '2235550103', obraSocial: 'OSDE', numeroHistoriaClinica: 'HC-2026-0103', activo: true }, { id: 104, usuarioId: 9104, nombre: 'Elena', apellido: 'Gómez', dni: '24110987', email: 'elena@example.com', telefono: '2235550104', obraSocial: 'Swiss Medical', numeroHistoriaClinica: 'HC-2026-0104', activo: true }];
const users = DEMO_USERS.map((user, index) => ({ id: Number(user.usuarioId), email: user.email, rol: user.role, activo: true, emailVerificado: true, nombreCompleto: user.nombre, dni: index === 3 ? profile.dni : null }));
const feedback = [{ id: 1, turnoId: 504, profesionalId: 201, profesionalNombre: 'Dra. Martina López', puntuacion: 5, comentario: 'Excelente atención y mucha claridad.', creadoEn: `${iso(-5)}T12:00` }, { id: 2, turnoId: 500, profesionalId: 201, puntuacion: 4, comentario: 'Muy buena profesional.', creadoEn: `${iso(-12)}T10:00` }];
const documents = [{ id: 1, pacienteId: 101, nombreArchivo: 'laboratorio_control.pdf', mimeType: 'application/pdf', tipoDocumento: 'ESTUDIO', storedSizeBytes: 184000, archivado: false, creadoEn: `${iso(-20)}T10:00` }];

function body(config: AxiosRequestConfig) {
  if (!config.data) return {};
  if (typeof config.data === 'string') try { return JSON.parse(config.data); } catch { return {}; }
  return config.data as Record<string, any>;
}

function response(config: AxiosRequestConfig, data: any, status = 200): AxiosResponse {
  return { data, status, statusText: status === 200 ? 'OK' : 'Created', headers: {}, config: config as any };
}

function appointmentById(url: string) { return appointments.find((item) => item.id === Number(url.match(/\/api\/turnos\/(\d+)/)?.[1])); }

export async function demoAdapter(config: AxiosRequestConfig): Promise<AxiosResponse> {
  await new Promise((resolve) => setTimeout(resolve, 180));
  const method = String(config.method || 'get').toLowerCase();
  const url = String(config.url || '').split('?')[0];
  const data = body(config);

  if (url === '/api/auth/login') return response(config, { token: 'demo-session-token', usuarioId: 9004, pacienteId: 101, role: 'PATIENT', nombreCompleto: 'Juan Pérez' });
  if (/\/api\/pacientes\/usuario\//.test(url)) return response(config, { id: 101, pacienteId: 101 });
  if (/\/api\/pacientes\/perfil/.test(url)) return response(config, method === 'put' ? Object.assign(profile, data) : profile);
  if (url === '/api/profesionales' || url === '/api/profesionales/me') return response(config, url.endsWith('/me') ? professionals[0] : professionals);
  if (url === '/api/profesionales/especialidades') return response(config, catalogs.especialidades);
  if (/\/api\/profesionales\/agenda\/.+\/rango/.test(url) || /\/api\/profesionales\/agenda\//.test(url)) return response(config, appointments.filter((item) => item.profesionalId === 201));
  if (/\/api\/profesionales\/proximo-turno\//.test(url)) return response(config, appointments.find((item) => item.profesionalId === 201 && ['PENDIENTE', 'CONFIRMADO'].includes(item.estado)) ?? null);
  if (url === '/api/profesionales/historial-paciente') return response(config, appointments.filter((item) => item.estado === 'ATENDIDO'));
  if (url === '/api/turnos' || /\/api\/turnos\/paciente\//.test(url)) return response(config, url === '/api/turnos' ? appointments : appointments.filter((item) => item.pacienteId === 101));
  if (/\/api\/turnos\/historia-clinica/.test(url)) return response(config, appointments.filter((item) => item.pacienteId === 101 && item.estado === 'ATENDIDO'));
  if (url === '/api/turnos/disponibilidad') return response(config, Array.from({ length: 10 }, (_, index) => ({ fecha: iso(1 + Math.floor(index / 4)), hora: `${9 + (index % 4)}:00`, fechaHora: `${iso(1 + Math.floor(index / 4))}T${String(9 + (index % 4)).padStart(2, '0')}:00`, disponible: true })));
  if (url === '/api/turnos/solicitar' && method === 'post') { const professional = professionals.find((item) => item.id === Number(data.profesionalId)) ?? professionals[0]; const created = { id: Math.max(...appointments.map((item) => item.id)) + 1, pacienteId: 101, pacienteNombre: 'Juan', pacienteApellido: 'Pérez', pacienteDni: profile.dni, profesionalId: professional.id, profesionalInstitucionId: professional.profesionalInstitucionId, profesionalNombre: professional.nombre, profesionalApellido: professional.apellido, especialidad: professional.especialidad, institucionNombre: professional.institucion, fechaHora: data.fechaHora, estado: 'PENDIENTE', observaciones: data.observaciones }; appointments = [created, ...appointments]; return response(config, created, 201); }
  if (/\/api\/turnos\/\d+\/reprogramar/.test(url) && method === 'put') { const item = appointmentById(url); if (item) Object.assign(item, { fechaHora: data.fechaHora, estado: 'REPROGRAMADO', reprogramadoPorRol: 'PATIENT' }); return response(config, item); }
  if (/\/api\/turnos\/\d+\/estado/.test(url) && method === 'put') { const item = appointmentById(url); if (item) item.estado = data.estado; return response(config, item); }
  if (/\/api\/turnos\/\d+\/detalle-consulta/.test(url) && method === 'put') { const item = appointmentById(url); if (item) Object.assign(item, data); return response(config, item); }
  if (/\/api\/turnos\/\d+\/confirmar-asistencia/.test(url)) { const item = appointmentById(url); if (item) item.asistenciaConfirmada = true; return response(config, item); }
  if (/\/api\/turnos\/\d+\/feedback/.test(url)) return response(config, method === 'post' ? { id: feedback.length + 1, turnoId: appointmentById(url)?.id, ...data } : null);
  if (url === '/api/turnos/feedback') return response(config, feedback);
  if (/\/api\/turnos\/\d+$/.test(url)) return response(config, appointmentById(url));
  if (url === '/api/admin/resumen') return response(config, { usuarios: 18, pacientes: patients.length, profesionales: professionals.length, secretarias: 2, instituciones: catalogs.instituciones.length, especialidades: catalogs.especialidades.length, obrasSociales: catalogs['obras-sociales'].length, horariosAtencion: horarios.length });
  if (url === '/api/admin/roles') return response(config, ['ADMIN', 'SECRETARY', 'PROFESSIONAL', 'PATIENT']);
  if (url === '/api/admin/usuarios') return response(config, users);
  if (url === '/api/admin/profesionales') return response(config, professionals.map((item) => ({ ...item, activo: true, especialidades: [item.especialidad], instituciones: [item.institucion] })));
  if (url === '/api/admin/secretarias') return response(config, [{ id: 1, usuarioId: 9002, email: 'secretaria@demo.mediturnos.net.ar', nombre: 'Sofía', apellido: 'Recepción', dni: '30111222', telefono: '2235550110', activa: true, institucion: 'Centro Médico del Mar' }]);
  if (url === '/api/admin/pacientes') return response(config, patients);
  if (/\/api\/admin\/(especialidades|obras-sociales|instituciones)/.test(url)) return response(config, catalogs[url.split('/').pop()!] ?? []);
  if (url === '/api/admin/auditoria') return response(config, [{ id: 1, accion: 'LOGIN_DEMO', entidad: 'Usuario', actor: 'Juan Administrador', detalle: 'Ingreso al entorno demostrativo', creadoEn: `${iso(0)}T09:12` }, { id: 2, accion: 'TURNO_CONFIRMADO', entidad: 'Turno', entidadId: 501, actor: 'Sofía Recepción', detalle: 'Confirmación de turno', creadoEn: `${iso(0)}T09:20` }]);
  if (url === '/api/obras-sociales') return response(config, catalogs['obras-sociales']);
  if (url === '/api/instituciones') return response(config, catalogs.instituciones);
  if (url === '/api/agenda/horarios') { if (method === 'post') { const created = { id: Date.now(), ...data }; horarios.push(created as any); return response(config, created, 201); } return response(config, horarios); }
  if (/\/api\/agenda\/horarios\/\d+/.test(url)) { const id = Number(url.split('/').pop()); if (method === 'delete') horarios = horarios.filter((item) => item.id !== id); else Object.assign(horarios.find((item) => item.id === id) ?? {}, data); return response(config, {}); }
  if (url === '/api/agenda/bloqueos') { if (method === 'post') { const created = { id: Date.now(), ...data }; bloqueos.push(created as any); return response(config, created, 201); } return response(config, bloqueos); }
  if (/\/api\/agenda\/bloqueos\/\d+/.test(url)) { const id = Number(url.split('/').pop()); if (method === 'delete') bloqueos = bloqueos.filter((item) => item.id !== id); else Object.assign(bloqueos.find((item) => item.id === id) ?? {}, data); return response(config, {}); }
  if (url === '/api/secretaria/pacientes/buscar') return response(config, patients[0]);
  if (url === '/api/documentos/me' || /\/api\/documentos\/paciente\//.test(url)) return response(config, documents);
  if (/\/api\/documentos\/\d+\/archivar/.test(url)) return response(config, { ...documents[0], archivado: true });
  if (url === '/api/lista-espera/me') return response(config, [{ id: 1, especialidad: 'Dermatología', estado: 'ACTIVA', creadoEn: iso(-2) }]);
  if (url === '/api/system/diagnostico') return response(config, { frontend: 'OK · Modo demo', api: 'OK · Simulada localmente', datos: 'OK · Dataset demostrativo', privacidad: 'OK · Sin datos reales' });
  if (method === 'post' || method === 'put' || method === 'patch') return response(config, { id: Date.now(), ...data }, 201);
  if (method === 'delete') return response(config, { ok: true });
  return response(config, []);
}
