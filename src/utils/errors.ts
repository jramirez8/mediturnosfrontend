const PREFERRED_ERROR_KEYS = ['message', 'mensaje', 'error', 'detail', 'title'] as const;
function primitiveText(value: unknown) {
    if (typeof value === 'string')
        return value.trim() || undefined;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    return undefined;
}
function arrayText(value: unknown[], seen: WeakSet<object>) {
    return value.map((item) => stringify(item, seen)).filter(Boolean).join(' · ') || undefined;
}
function preferredObjectText(record: Record<string, unknown>, seen: WeakSet<object>) {
    for (const key of PREFERRED_ERROR_KEYS) {
        const text = stringify(record[key], seen);
        if (text)
            return text;
    }
    return undefined;
}
function detailsText(record: Record<string, unknown>, seen: WeakSet<object>) {
    return stringify(record.details, seen);
}
function objectText(value: object, seen: WeakSet<object>) {
    if (seen.has(value))
        return undefined;
    seen.add(value);
    const record = value as Record<string, unknown>;
    return preferredObjectText(record, seen)
        ?? detailsText(record, seen)
        ?? stringifyObjectEntries(record, seen);
}
function stringify(value: unknown, seen = new WeakSet<object>()): string | undefined {
    if (value === undefined || value === null)
        return undefined;
    const primitive = primitiveText(value);
    if (primitive)
        return primitive;
    if (Array.isArray(value))
        return arrayText(value, seen);
    if (typeof value === 'object')
        return objectText(value, seen);
    return undefined;
}
type ApiError = {
    response?: { data?: unknown; status?: unknown };
    request?: unknown;
    message?: unknown;
    code?: unknown;
    config?: { method?: string; url?: string };
};
function asApiError(error: unknown): ApiError {
    return typeof error === 'object' && error !== null ? error as ApiError : {};
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
function isTimeoutError(error: unknown, rawMessage?: string) {
    const apiError = asApiError(error);
    return !apiError.response && (apiError.code === 'ECONNABORTED' || /timeout|tard[oó] demasiado/i.test(rawMessage ?? ''));
}
function isNetworkError(error: unknown, rawMessage?: string) {
    const apiError = asApiError(error);
    const networkText = /network error|failed to fetch|internet|conexi[oó]n|conectarnos|servidor/i.test(rawMessage ?? '');
    return !apiError.response && (networkText || Boolean(apiError.request));
}
function backendMessage(error: unknown, fallback: string) {
    const apiError = asApiError(error);
    const data = apiError.response?.data as Record<string, unknown> | undefined;
    return stringify(data?.message)
        ?? stringify(data?.mensaje)
        ?? stringify(data?.error)
        ?? stringify(data?.detail)
        ?? stringify(data?.details)
        ?? stringify(data)
        ?? stringify(apiError.message)
        ?? fallback;
}
export function readableError(error: unknown, fallback = 'Ocurrió un error inesperado.') {
    const apiError = asApiError(error);
    const rawMessage = stringify(apiError.message);
    if (isTimeoutError(apiError, rawMessage))
        return 'El servicio está tardando en responder. Revisá tu conexión e intentá nuevamente.';
    if (isNetworkError(apiError, rawMessage))
        return 'No hay conexión a internet. Revisá tu conexión e intentá nuevamente.';
    if (Number(apiError.response?.status) >= 500)
        return 'El servicio no está disponible en este momento. Intentá nuevamente más tarde.';
    return backendMessage(apiError, fallback).replace(/^HTTP\s+\d+\s*:\s*/i, '').trim() || fallback;
}
export function isConnectivityMessage(message?: string | null) {
    return /conexi[oó]n a internet|tardando en responder|servicio no est[aá] disponible/i.test(String(message ?? ''));
}
export function debugErrorPayload(error: unknown) {
    const apiError = asApiError(error);
    return {
        status: apiError.response?.status,
        method: apiError.config?.method?.toUpperCase?.(),
        url: apiError.config?.url,
        data: apiError.response?.data,
        message: apiError.message,
    };
}

