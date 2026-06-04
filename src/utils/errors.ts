export function readableError(error: any, fallback = 'Ocurrió un error inesperado.') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
