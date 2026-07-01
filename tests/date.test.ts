import { describe, expect, it } from '@jest/globals';
import {
  countSlotsInRange,
  dateTimeIsoLocal,
  formatLocalDate,
  formatLocalDateTime,
  formatTime,
  isValidTimeRange,
  minutesFromTime,
  normalizeApiDay,
  normalizeTimeInput,
  pad2,
  parseIsoDateLocal,
  todayLocalIso,
  toLocalIsoDate,
  weekdayApiFromIso,
} from '../src/utils/date';

describe('date utils', () => {
  it('formatea números y fechas locales', () => {
    expect(pad2(4)).toBe('04');
    expect(toLocalIsoDate(new Date(2026, 5, 7))).toBe('2026-06-07');
    expect(todayLocalIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatLocalDate('2026-06-17T09:30:00')).toBe('17/06/2026');
    expect(formatLocalDateTime('2026-06-17T09:30:00')).toBe('17/06/2026 09:30');
  });

  it('interpreta fechas ISO sin desplazamiento UTC', () => {
    const date = parseIsoDateLocal('2026-06-17');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(17);
    expect(weekdayApiFromIso('2026-06-17')).toBe('MIERCOLES');
  });

  it('normaliza días con tildes y espacios', () => {
    expect(normalizeApiDay('  miércoles ')).toBe('MIERCOLES');
    expect(normalizeApiDay(null)).toBe('');
  });

  it('normaliza horarios válidos', () => {
    expect(normalizeTimeInput('9')).toBe('09:00');
    expect(normalizeTimeInput('9.5')).toBe('09:05');
    expect(normalizeTimeInput('0930')).toBe('09:30');
    expect(normalizeTimeInput('23:59')).toBe('23:59');
  });

  it('rechaza horarios inválidos', () => {
    expect(normalizeTimeInput('24:00')).toBe('');
    expect(normalizeTimeInput('12:77')).toBe('');
    expect(normalizeTimeInput('abc')).toBe('');
    expect(Number.isNaN(minutesFromTime('abc'))).toBe(true);
  });

  it('valida rangos y cuenta slots', () => {
    expect(isValidTimeRange('09:00', '13:00')).toBe(true);
    expect(isValidTimeRange('13:00', '09:00')).toBe(false);
    expect(countSlotsInRange('09:00', '13:00', 30)).toBe(8);
    expect(countSlotsInRange('09:00', '09:20', 30)).toBe(0);
    expect(countSlotsInRange('09:00', '13:00', 0)).toBe(0);
  });

  it('arma fecha y hora para API y extrae hora', () => {
    expect(dateTimeIsoLocal('2026-06-17', '9:5')).toBe('2026-06-17T09:05');
    expect(formatTime('2026-06-17T09:30:00')).toBe('09:30');
    expect(formatTime('14:15:00')).toBe('14:15');
  });

  it('maneja entradas vacías o incompletas sin romper la interfaz', () => {
    expect(normalizeTimeInput(null)).toBe('');
    expect(formatTime(null)).toBe('');
    expect(formatLocalDate('sin-fecha')).toBe('');
    expect(formatLocalDateTime(null)).toBe('');
    expect(countSlotsInRange('abc', '13:00', 30)).toBe(0);
    expect(countSlotsInRange('09:00', 'abc', 30)).toBe(0);
    const fallback = parseIsoDateLocal('');
    expect(fallback).toBeInstanceOf(Date);
  });

});
