function stringify(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(stringify).filter(Boolean).join(' · ') || undefined;
  if (typeof value === 'object') {
    const preferred = value.message ?? value.mensaje ?? value.error ?? value.detail ?? value.title;
    const asPreferred = stringify(preferred);
    if (asPreferred) return asPreferred;
    if (value.details) {
      if (typeof value.details === 'object') {
        const lines = Object.entries(value.details).map(([k, v]) => `${k}: ${stringify(v) ?? ''}`).filter(Boolean);
        if (lines.length) return lines.join(' · ');
      }
      const details = stringify(value.details);
      if (details) return details;
    }
    try { return JSON.stringify(value); } catch { return undefined; }
  }
  return undefined;
}

export function readableError(error: any, fallback = 'Ocurrió un error inesperado.') {
  const data = error?.response?.data;
  const status = error?.response?.status;

  let message =
    stringify(data?.message) ||
    stringify(data?.mensaje) ||
    stringify(data?.error) ||
    stringify(data?.detail) ||
    stringify(data?.details) ||
    stringify(data) ||
    stringify(error?.message) ||
    fallback;

  if (status && !String(message).includes(String(status))) {
    message = `HTTP ${status}: ${message}`;
  }

  return String(message);
}

export function debugErrorPayload(error: any) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const url = error?.config?.url;
  const method = error?.config?.method?.toUpperCase?.();

  return {
    status,
    method,
    url,
    data,
    message: error?.message,
  };
}
