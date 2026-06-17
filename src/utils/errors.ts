function stringify(value: unknown, seen = new WeakSet<object>()): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value.map((item) => stringify(item, seen)).filter(Boolean).join(' · ') || undefined;
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return undefined;
    seen.add(value);

    const record = value as Record<string, unknown>;
    const preferredKeys = ['message', 'mensaje', 'error', 'detail', 'title'] as const;

    for (const key of preferredKeys) {
      const preferred = record[key];
      if (preferred === undefined || preferred === null) continue;

      if (typeof preferred === 'object') {
        const nested = stringifyObjectEntries(preferred as Record<string, unknown>, seen);
        if (nested) return nested;
      } else {
        const text = stringify(preferred, seen);
        if (text) return text;
      }
    }

    if (record.details !== undefined && record.details !== null) {
      if (typeof record.details === 'object' && !Array.isArray(record.details)) {
        const details = stringifyObjectEntries(record.details as Record<string, unknown>, seen);
        if (details) return details;
      }

      const details = stringify(record.details, seen);
      if (details) return details;
    }

    return stringifyObjectEntries(record, seen);
  }

  return undefined;
}

function stringifyObjectEntries(value: Record<string, unknown>, seen: WeakSet<object>): string | undefined {
  const lines = Object.entries(value)
    .map(([key, nestedValue]) => {
      const text = stringify(nestedValue, seen);
      return text ? `${key}: ${text}` : undefined;
    })
    .filter((line): line is string => Boolean(line));

  return lines.length ? lines.join(' · ') : undefined;
}

export function readableError(error: unknown, fallback = 'Ocurrió un error inesperado.') {
  const response = (error as any)?.response;
  const data = response?.data;
  const status = response?.status;

  let message =
    stringify(data?.message) ||
    stringify(data?.mensaje) ||
    stringify(data?.error) ||
    stringify(data?.detail) ||
    stringify(data?.details) ||
    stringify(data) ||
    stringify((error as any)?.message) ||
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
