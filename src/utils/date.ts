export const WEEKDAY_API = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'] as const;

export const WEEKDAY_OPTIONS = [
  { api: 'LUNES', short: 'Lun', label: 'Lunes' },
  { api: 'MARTES', short: 'Mar', label: 'Martes' },
  { api: 'MIERCOLES', short: 'Mié', label: 'Miércoles' },
  { api: 'JUEVES', short: 'Jue', label: 'Jueves' },
  { api: 'VIERNES', short: 'Vie', label: 'Viernes' },
  { api: 'SABADO', short: 'Sáb', label: 'Sábado' },
  { api: 'DOMINGO', short: 'Dom', label: 'Domingo' },
];

export const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function pad2(value: number | string) {
  return String(value).padStart(2, '0');
}

export function toLocalIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayLocalIso() {
  return toLocalIsoDate(new Date());
}

export function parseIsoDateLocal(iso?: string | null) {
  const clean = String(iso ?? '').slice(0, 10);
  const [y, m, d] = clean.split('-').map((part) => Number(part));
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export function dateTimeIsoLocal(dateIso: string, time = '00:00') {
  return `${String(dateIso).slice(0, 10)}T${normalizeTimeInput(time) || '00:00'}`;
}

export function normalizeApiDay(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export function weekdayApiFromIso(iso?: string | null) {
  const date = parseIsoDateLocal(iso);
  return WEEKDAY_API[date.getDay()];
}

export function isoFromDateTime(value?: string | null) {
  return String(value ?? '').slice(0, 10);
}

export function normalizeTimeInput(value?: string | null) {
  const raw = String(value ?? '').trim().replace('.', ':');
  const match = raw.match(/^(\d{1,2})(?::?(\d{0,2}))?/);
  if (!match) return '';
  const hours = Number(match[1]);
  const minutes = Number(match[2] || '0');
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function formatTime(value?: string | null) {
  const raw = String(value ?? '');
  if (!raw) return '';
  if (raw.includes('T')) return raw.split('T')[1]?.slice(0, 5) ?? '';
  return raw.slice(0, 5);
}

export function minutesFromTime(value?: string | null) {
  const normalized = normalizeTimeInput(value);
  if (!normalized) return NaN;
  const [h, m] = normalized.split(':').map(Number);
  return h * 60 + m;
}

export function isValidTimeRange(from?: string | null, to?: string | null) {
  const start = minutesFromTime(from);
  const end = minutesFromTime(to);
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

export function countSlotsInRange(from?: string | null, to?: string | null, minutes?: number | string | null) {
  const start = minutesFromTime(from);
  const end = minutesFromTime(to);
  const step = Number(minutes);
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0 || end <= start) return 0;
  return Math.floor((end - start) / step);
}

export function formatLocalDate(value?: string | null) {
  const iso = isoFromDateTime(value);
  if (!iso || !iso.includes('-')) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatLocalDateTime(value?: string | null) {
  const date = formatLocalDate(value);
  const time = formatTime(value);
  return [date, time].filter(Boolean).join(' ');
}
