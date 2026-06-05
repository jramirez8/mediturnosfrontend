import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { TurnoResponse } from '../api/appointmentService';

function parseDate(turno: TurnoResponse) {
  const raw = turno.fechaHora || (turno.fecha && turno.hora ? `${turno.fecha}T${turno.hora}` : '');
  const start = raw ? new Date(raw) : null;
  if (!start || Number.isNaN(start.getTime())) throw new Error('El turno no tiene una fecha válida.');
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return { start, end };
}

export async function addAppointmentToDeviceCalendar(turno: TurnoResponse) {
  if (Platform.OS === 'web') {
    throw new Error('La integración con calendario está disponible desde el celular.');
  }

  const permission = await Calendar.requestCalendarPermissionsAsync();
  if (!permission.granted) throw new Error('Necesitamos permiso para agregar el turno al calendario.');

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((calendar) => calendar.allowsModifications) ?? calendars[0];
  if (!writable) throw new Error('No encontramos un calendario disponible en el dispositivo.');

  const { start, end } = parseDate(turno);
  await Calendar.createEventAsync(writable.id, {
    title: `Mediturnos · ${turno.especialidad || 'Turno médico'}`,
    startDate: start,
    endDate: end,
    location: [turno.institucionNombre, (turno as any).direccionAtencion].filter(Boolean).join(' - '),
    notes: `Profesional: ${turno.profesionalNombre || ''}
Estado: ${turno.estado || ''}`,
    alarms: [{ relativeOffset: -180 }],
  });
}
