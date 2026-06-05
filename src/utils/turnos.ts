export function formatTurnoDate(fecha?: string, hora?: string, fechaHora?: string) {
  if (fechaHora) return fechaHora.replace('T', ' ').slice(0, 16);
  return `${fecha ?? ''} ${hora ?? ''}`.trim();
}

export function statusTone(estado?: string): 'primary' | 'success' | 'warning' | 'danger' | 'muted' {
  const value = String(estado ?? '').toUpperCase();
  if (value === 'CONFIRMADO' || value === 'ATENDIDO') return 'success';
  if (value === 'PENDIENTE' || value === 'REPROGRAMADO') return 'warning';
  if (value === 'CANCELADO' || value === 'AUSENTE') return 'danger';
  return 'muted';
}

export function fullName(...parts: Array<string | undefined | null>) {
  return parts.map((p) => String(p ?? '').trim()).filter(Boolean).join(' ');
}
