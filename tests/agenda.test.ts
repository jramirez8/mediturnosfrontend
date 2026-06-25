import { describe, expect, it } from '@jest/globals';
import {
  hasActiveScheduleForDay,
  HorarioAtencion,
  uniqueSchedulesByDay,
} from '../src/api/agendaService';

const schedule = (id: number, diaSemana: string, activo = true): HorarioAtencion => ({
  id,
  profesionalInstitucionId: 1,
  especialidadId: 1,
  diaSemana,
  horaDesde: '09:00',
  horaHasta: '13:00',
  duracionTurnoMin: 30,
  activo,
});

describe('agenda semanal', () => {
  it('mantiene como máximo un horario por día', () => {
    expect(uniqueSchedulesByDay([
      schedule(1, 'LUNES'),
      schedule(2, 'lunes'),
      schedule(3, 'MARTES'),
    ]).map((item) => item.id)).toEqual([1, 3]);
  });

  it('detecta horarios activos existentes sin depender de mayúsculas o acentos', () => {
    expect(hasActiveScheduleForDay([schedule(1, 'MIÉRCOLES')], 'miercoles')).toBe(true);
    expect(hasActiveScheduleForDay([schedule(2, 'JUEVES', false)], 'jueves')).toBe(false);
  });
});
