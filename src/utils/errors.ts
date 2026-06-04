export function readableError(error: any, fallback = 'Ocurrió un error inesperado.') {
  const data = error?.response?.data;
  const status = error?.response?.status;

  let message =
    (typeof data === 'string' ? data : undefined) ||
    data?.message ||
    data?.mensaje ||
    data?.error ||
    data?.detail ||
    error?.message ||
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
