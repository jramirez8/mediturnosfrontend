import { api } from './client';
import { mediaToFormData, absoluteApiUrl } from './uploadMedia';
import { PickedMedia } from '../utils/mediaPicker';
import { clearAppCache, getCachedJson, setCachedJson } from '../db/cache';

export type AppointmentSlot = {
  fecha: string;
  hora: string;
  fechaHora?: string;
  disponible: boolean;
};

export type TurnoResponse = {
  id: number;
  fecha: string;
  hora: string;
  fechaHora?: string;
  pacienteId?: number;
  pacienteNombre: string;
  pacienteDni?: string;
  profesionalId?: number;
  profesionalInstitucionId?: number;
  especialidadId?: number;
  profesionalNombre: string;
  especialidad: string;
  institucionId?: number;
  institucionNombre: string;
  estado: string;
  motivoConsulta?: string;
  diagnostico?: string;
  observaciones?: string;
  enfermedadActual?: string;
  antecedenteEnfermedadActual?: string;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  antecedentes?: string;
  medicacionActual?: string;
  medicacionHabitual?: string;
  alergias?: string;
  habitos?: string;
  hallazgosExamenFisico?: string;
  conducta?: string;
  documentacionId?: number;
  documentacionUrl?: string;
  documentacionNombreArchivo?: string;
  documentacionMimeType?: string;
  documentacionSizeBytes?: number;
  asistenciaConfirmada?: boolean;
  asistenciaConfirmadaEn?: string;
  recordatorioTresHorasEnviado?: boolean;
};

function splitFechaHora(raw?: string | null) {
  const value = raw ? String(raw) : '';
  if (!value) return { fecha: '', hora: '' };
  const [fecha, time = ''] = value.includes('T') ? value.split('T') : value.split(' ');
  return { fecha: fecha ?? '', hora: time.slice(0, 5) };
}

function buildFechaHora(fecha?: string, hora?: string, fechaHora?: string) {
  if (fechaHora) return String(fechaHora).slice(0, 16);
  const cleanFecha = String(fecha ?? '').trim();
  const cleanHora = String(hora ?? '').trim();
  if (!cleanFecha || !cleanHora) return '';
  return `${cleanFecha}T${cleanHora.slice(0, 5)}`;
}

function ensureNumber(value: unknown, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Falta completar ${fieldName}.`);
  }
  return parsed;
}

function ensureFechaHora(value: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    throw new Error('Falta fechaHora válida para solicitar/reprogramar el turno.');
  }
  return value;
}

function normalizeEstado(value: unknown) {
  return String(value ?? '').trim().toUpperCase();
}

const normalizeTurno = (t: any): TurnoResponse => {
  const derived = splitFechaHora(t?.fechaHora ?? t?.fechaHoraInicio ?? t?.fecha_hora);
  const fecha = t?.fecha ?? derived.fecha;
  const hora = t?.hora ? String(t.hora).slice(0, 5) : derived.hora;
  const profesionalNombre = t?.profesionalNombreCompleto
    ?? t?.profesionalNombreApellido
    ?? `${t?.profesionalNombre ?? t?.profesional?.nombre ?? ''} ${t?.profesionalApellido ?? t?.profesional?.apellido ?? ''}`.trim();
  const pacienteNombre = t?.pacienteNombreCompleto
    ?? `${t?.pacienteNombre ?? t?.paciente?.nombre ?? ''} ${t?.pacienteApellido ?? t?.paciente?.apellido ?? ''}`.trim();

  const pacienteId = t?.pacienteId ? Number(t.pacienteId) : t?.paciente?.id ? Number(t.paciente.id) : undefined;
  const profesionalId = t?.profesionalId ? Number(t.profesionalId) : t?.profesional?.id ? Number(t.profesional.id) : undefined;

  return {
    id: Number(t?.id),
    fecha,
    hora,
    fechaHora: buildFechaHora(fecha, hora, t?.fechaHora ?? t?.fechaHoraInicio),
    pacienteId,
    pacienteNombre,
    pacienteDni: t?.pacienteDni ?? t?.dni ?? t?.paciente?.dni,
    profesionalId,
    profesionalInstitucionId: t?.profesionalInstitucionId ? Number(t.profesionalInstitucionId) : undefined,
    especialidadId: t?.especialidadId ? Number(t.especialidadId) : undefined,
    profesionalNombre,
    especialidad: t?.especialidad ?? t?.especialidadNombre ?? 'Consulta médica',
    institucionId: t?.institucionId ? Number(t.institucionId) : undefined,
    institucionNombre: t?.institucionNombre ?? t?.institucion ?? t?.profesionalInstitucion?.institucion?.nombre ?? 'Institución',
    estado: t?.estado ?? 'SIN_ESTADO',
    motivoConsulta: t?.motivoConsulta,
    diagnostico: t?.diagnostico,
    observaciones: t?.observaciones,
    enfermedadActual: t?.enfermedadActual,
    antecedenteEnfermedadActual: t?.antecedenteEnfermedadActual,
    antecedentesPersonales: t?.antecedentesPersonales,
    antecedentesFamiliares: t?.antecedentesFamiliares,
    antecedentes: t?.antecedentes ?? t?.antecedentesPersonales,
    medicacionActual: t?.medicacionActual,
    medicacionHabitual: t?.medicacionHabitual ?? t?.medicacionActual,
    alergias: t?.alergias,
    habitos: t?.habitos,
    hallazgosExamenFisico: t?.hallazgosExamenFisico,
    conducta: t?.conducta,
    documentacionId: t?.documentacionId ? Number(t.documentacionId) : undefined,
    documentacionUrl: absoluteApiUrl(t?.documentacionUrl),
    documentacionNombreArchivo: t?.documentacionNombreArchivo,
    documentacionMimeType: t?.documentacionMimeType,
    documentacionSizeBytes: t?.documentacionSizeBytes ? Number(t.documentacionSizeBytes) : undefined,
    asistenciaConfirmada: Boolean(t?.asistenciaConfirmada),
    asistenciaConfirmadaEn: t?.asistenciaConfirmadaEn,
    recordatorioTresHorasEnviado: Boolean(t?.recordatorioTresHorasEnviado),
  };
};

export function uniqueAppointmentSlots(slots: AppointmentSlot[]) {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    const key = `${slot.fecha}|${String(slot.hora).slice(0, 5)}`;
    if (!slot.fecha || !slot.hora || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const normalizeSlot = (slot: any): AppointmentSlot => {
  const fechaHora = slot?.fechaHora ?? slot?.fechaHoraIso ?? slot?.fechaHoraInicio ?? slot?.fecha_hora;
  const derived = splitFechaHora(fechaHora);
  return {
    fecha: slot?.fecha ?? derived.fecha,
    hora: slot?.hora ? String(slot.hora).slice(0, 5) : derived.hora,
    fechaHora: buildFechaHora(slot?.fecha ?? derived.fecha, slot?.hora ?? derived.hora, fechaHora),
    disponible: slot?.disponible ?? true,
  };
};

async function fetchVerifiedTurno(id: number) {
  const detail = await api.get<any>(`/api/turnos/${id}`);
  const verified = normalizeTurno(detail.data);

  if (!verified?.id || Number(verified.id) !== Number(id)) {
    throw new Error('No pudimos verificar el turno guardado.');
  }

  return verified;
}

async function verifyCreatedTurno(created: TurnoResponse) {
  if (!created?.id || Number.isNaN(Number(created.id))) {
    throw new Error('No pudimos confirmar la creación del turno.');
  }

  return fetchVerifiedTurno(Number(created.id));
}

async function verifyEstado(id: number, estadoEsperado: string) {
  const verified = await fetchVerifiedTurno(id);
  if (normalizeEstado(verified.estado) !== normalizeEstado(estadoEsperado)) {
    throw new Error(`No pudimos confirmar el cambio de estado del turno.`);
  }
  return verified;
}


async function uploadTurnoDocument(turnoId: number, media: PickedMedia) {
  const form = await mediaToFormData(media);
  const response = await api.post(`/api/turnos/${turnoId}/adjuntos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return response.data;
}

export const appointmentService = {
  normalizeForStaff: normalizeTurno,
  getMyAppointments: async (pacienteId?: string | null) => {
    const cacheKey = `appointments:${pacienteId ?? 'me'}`;
    try {
      const endpoint = pacienteId ? `/api/turnos/paciente/${pacienteId}` : '/api/turnos/paciente/me';
      const response = await api.get<any[]>(endpoint);
      const data = response.data.map(normalizeTurno);
      await setCachedJson(cacheKey, data);
      await setCachedJson('appointments:last', data);
      return data;
    } catch (error) {
      const cached = await getCachedJson<TurnoResponse[]>(cacheKey);
      if (cached) return cached;
      const last = await getCachedJson<TurnoResponse[]>('appointments:last');
      if (last) return last;
      throw error;
    }
  },

  getAppointmentDetail: async (id: number) => {
    const cacheKey = `appointment:${id}`;
    try {
      const response = await api.get<any>(`/api/turnos/${id}`);
      const data = normalizeTurno(response.data);
      await setCachedJson(cacheKey, data);
      return data;
    } catch (error) {
      const cached = await getCachedJson<TurnoResponse>(cacheKey);
      if (cached) return cached;
      throw error;
    }
  },

  getDisponibilidad: async (profesionalInstitucionId: number) => {
    const cacheKey = `slots:${profesionalInstitucionId}`;
    try {
      const response = await api.get<any[]>('/api/turnos/disponibilidad', {
        params: { profesionalInstitucionId },
      });
      const data = uniqueAppointmentSlots(response.data.map(normalizeSlot));
      await setCachedJson(cacheKey, data);
      return data;
    } catch (error) {
      const cached = await getCachedJson<AppointmentSlot[]>(cacheKey);
      if (cached) return cached;
      throw error;
    }
  },

  solicitar: async (data: {
    pacienteId?: number | string | null;
    profesionalId: number;
    profesionalInstitucionId?: number;
    especialidadId?: number;
    fecha?: string;
    hora?: string;
    fechaHora?: string;
    motivoConsulta?: string;
    observaciones?: string;
    documentacion?: PickedMedia | null;
  }) => {
    const payload = {
      pacienteId: ensureNumber(data.pacienteId, 'pacienteId'),
      profesionalId: ensureNumber(data.profesionalId, 'profesionalId'),
      profesionalInstitucionId: data.profesionalInstitucionId ? Number(data.profesionalInstitucionId) : undefined,
      especialidadId: data.especialidadId ? Number(data.especialidadId) : undefined,
      fechaHora: ensureFechaHora(buildFechaHora(data.fecha, data.hora, data.fechaHora)),
      observaciones: data.observaciones || data.motivoConsulta || undefined,
    };

    const response = await api.post<any>('/api/turnos/solicitar', payload);
    const created = normalizeTurno(response.data);
    let verified = await verifyCreatedTurno(created);

    if (data.documentacion) {
      await uploadTurnoDocument(Number(verified.id), data.documentacion);
      verified = await fetchVerifiedTurno(Number(verified.id));
    }

    await clearAppCache();
    return verified;
  },

  requestAppointment: async (data: {
    pacienteId?: number | string | null;
    professionalId?: number;
    profesionalId?: number;
    profesionalInstitucionId?: number;
    especialidadId?: number;
    fecha?: string;
    hora?: string;
    fechaHora?: string;
    motivoConsulta?: string;
    observaciones?: string;
    documentacion?: PickedMedia | null;
  }) => {
    return appointmentService.solicitar({
      pacienteId: data.pacienteId,
      profesionalId: ensureNumber(data.profesionalId ?? data.professionalId, 'profesionalId'),
      profesionalInstitucionId: data.profesionalInstitucionId,
      especialidadId: data.especialidadId,
      fecha: data.fecha,
      hora: data.hora,
      fechaHora: data.fechaHora,
      motivoConsulta: data.motivoConsulta,
      observaciones: data.observaciones,
      documentacion: data.documentacion,
    });
  },

  reprogramar: async (id: number, data: {
    profesionalId?: number;
    profesionalInstitucionId?: number;
    especialidadId?: number;
    fecha?: string;
    hora?: string;
    fechaHora?: string;
  }) => {
    const payload = {
      profesionalId: ensureNumber(data.profesionalId, 'profesionalId'),
      profesionalInstitucionId: data.profesionalInstitucionId ? Number(data.profesionalInstitucionId) : undefined,
      especialidadId: data.especialidadId ? Number(data.especialidadId) : undefined,
      fechaHora: ensureFechaHora(buildFechaHora(data.fecha, data.hora, data.fechaHora)),
    };

    await api.put<any>(`/api/turnos/${id}/reprogramar`, payload);
    const verified = await fetchVerifiedTurno(id);
    const expectedFechaHora = payload.fechaHora.slice(0, 16);

    if (String(verified.fechaHora ?? '').slice(0, 16) !== expectedFechaHora) {
      throw new Error('No pudimos verificar la nueva fecha del turno.');
    }

    await clearAppCache();
    return verified;
  },

  actualizarEstado: async (id: number, estado: string) => {
    await api.put<any>(`/api/turnos/${id}/estado`, { estado });
    const verified = await verifyEstado(id, estado);
    await clearAppCache();
    return verified;
  },

  guardarDetalleConsulta: async (id: number, data: Record<string, string>) => {
    const response = await api.put<any>(`/api/turnos/${id}/detalle-consulta`, data);
    const updated = normalizeTurno(response.data);
    await clearAppCache();
    return updated;
  },

  cancelar: async (id: number) => {
    // Cancelar NO debe borrar el turno: debe pasar a estado CANCELADO para que quede en historial.
    return appointmentService.actualizarEstado(id, 'CANCELADO');
  },

  confirmarAsistencia: async (id: number) => {
    await api.put<any>(`/api/turnos/${id}/confirmar-asistencia`);
    const verified = await fetchVerifiedTurno(id);
    if (!verified.asistenciaConfirmada && normalizeEstado(verified.estado) !== 'CONFIRMADO') {
      throw new Error('No pudimos confirmar la asistencia del turno.');
    }
    await clearAppCache();
    return verified;
  },
};
