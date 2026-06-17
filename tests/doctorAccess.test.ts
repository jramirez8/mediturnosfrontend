import { describe, expect, it } from '@jest/globals';
import { doctorAccessMessage, filterTurnosForDoctor, turnoBelongsToDoctor } from '../src/utils/doctorAccess';

const baseTurno = {
  id: 1,
  profesionalId: 10,
  profesionalInstitucionId: 20,
  profesionalNombre: 'Dr. Javier López',
} as any;

describe('doctor access', () => {
  it('prioriza profesionalId cuando ambos existen', () => {
    expect(turnoBelongsToDoctor(baseTurno, { profesionalId: 10, profesionalInstitucionId: 999 })).toBe(true);
    expect(turnoBelongsToDoctor(baseTurno, { profesionalId: 11, profesionalInstitucionId: 20 })).toBe(false);
  });

  it('usa profesionalInstitucionId si no hay profesionalId', () => {
    const turno = { ...baseTurno, profesionalId: null };
    expect(turnoBelongsToDoctor(turno, { profesionalInstitucionId: '20' })).toBe(true);
    expect(turnoBelongsToDoctor(turno, { profesionalInstitucionId: '21' })).toBe(false);
  });

  it('usa nombre normalizado solo como fallback defensivo', () => {
    const turno = { profesionalNombre: 'Dra. María José Pérez' } as any;
    expect(turnoBelongsToDoctor(turno, { nombreCompleto: 'Maria Jose Perez' })).toBe(true);
    expect(turnoBelongsToDoctor(turno, { nombreCompleto: 'Carla Giménez' })).toBe(false);
  });

  it('rechaza turnos vacíos o identidad insuficiente', () => {
    expect(turnoBelongsToDoctor(null, { profesionalId: 10 })).toBe(false);
    expect(turnoBelongsToDoctor({} as any, {})).toBe(false);
  });



  it('ignora IDs inválidos y permite coincidencias parciales de nombre', () => {
    const turno = { profesionalId: 0, profesionalInstitucionId: -1, profesionalNombre: 'Dr. Juan Carlos Pérez' } as any;
    expect(turnoBelongsToDoctor(turno, { profesionalId: 'abc', nombreCompleto: 'Juan Carlos' })).toBe(true);
  });

  it('filtra turnos ajenos', () => {
    const propios = filterTurnosForDoctor([
      baseTurno,
      { ...baseTurno, id: 2, profesionalId: 11 },
    ] as any, { profesionalId: 10 });

    expect(propios.map((turno) => turno.id)).toEqual([1]);
    expect(doctorAccessMessage()).toContain('no pertenece');
  });
});
