import { describe, expect, it } from '@jest/globals';
import { uniqueAppointmentSlots } from '../src/api/appointmentService';

describe('disponibilidad de turnos', () => {
  it('elimina horas repetidas del mismo día', () => {
    expect(uniqueAppointmentSlots([
      { fecha: '2026-06-25', hora: '09:00', disponible: true },
      { fecha: '2026-06-25', hora: '09:00:00', disponible: true },
      { fecha: '2026-06-25', hora: '09:30', disponible: true },
    ])).toHaveLength(2);
  });
});
