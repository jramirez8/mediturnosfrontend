import { describe, expect, it } from '@jest/globals';
import { formatTurnoDate, fullName, statusTone } from '../src/utils/turnos';

describe('turnos utils', () => {
  it('formatea fechaHora con prioridad', () => {
    expect(formatTurnoDate('2026-06-17', '10:00', '2026-07-01T09:30:00')).toBe('2026-07-01 09:30');
    expect(formatTurnoDate('2026-06-17', '10:00')).toBe('2026-06-17 10:00');
  });

  it('mapea estados a tonos consistentes', () => {
    expect(statusTone('CONFIRMADO')).toBe('success');
    expect(statusTone('atendido')).toBe('success');
    expect(statusTone('PENDIENTE')).toBe('warning');
    expect(statusTone('REPROGRAMADO')).toBe('warning');
    expect(statusTone('CANCELADO')).toBe('danger');
    expect(statusTone('AUSENTE')).toBe('danger');
    expect(statusTone('desconocido')).toBe('muted');
  });

  it('arma nombres sin espacios ni valores vacíos', () => {
    expect(fullName(' Javier ', null, ' López ')).toBe('Javier López');
    expect(fullName(undefined, '')).toBe('');
  });
});
