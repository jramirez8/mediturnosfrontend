// Canon real del backend/MySQL: PATIENT, PROFESSIONAL, SECRETARY, ADMIN.
// La UI muestra los nombres en español con humanRole().
export type AppRole = 'PATIENT' | 'PROFESSIONAL' | 'SECRETARY' | 'ADMIN';

export function normalizeRole(role?: string | null): AppRole | null {
  const value = String(role ?? '').trim().toUpperCase();
  if (!value) return null;

  if (['PATIENT', 'PACIENTE'].includes(value)) return 'PATIENT';
  if (['PROFESSIONAL', 'PROFESIONAL', 'MEDICO', 'DOCTOR'].includes(value)) return 'PROFESSIONAL';
  if (['SECRETARY', 'SECRETARIA'].includes(value)) return 'SECRETARY';
  if (value === 'ADMIN' || value === 'ADMINISTRADOR') return 'ADMIN';

  return null;
}

export type AppRoute = '/admin' | '/secretaria' | '/medico' | '/paciente' | '/login';

export function routeForRole(role?: string | null): AppRoute {
  const normalized = normalizeRole(role);
  if (normalized === 'ADMIN') return '/admin';
  if (normalized === 'SECRETARY') return '/secretaria';
  if (normalized === 'PROFESSIONAL') return '/medico';
  if (normalized === 'PATIENT') return '/paciente';
  return '/login';
}

export function humanRole(role?: string | null) {
  const normalized = normalizeRole(role);
  if (normalized === 'ADMIN') return 'Administrador';
  if (normalized === 'SECRETARY') return 'Secretaría';
  if (normalized === 'PROFESSIONAL') return 'Médico';
  if (normalized === 'PATIENT') return 'Paciente';
  return 'Sin rol';
}

export function isAllowedRole(current: string | null | undefined, allowed: AppRole[]) {
  const normalized = normalizeRole(current);
  return !!normalized && allowed.includes(normalized);
}
