export const MAX_DOCUMENT_BYTES = 1024 * 1024;
export const SUPPORTED_DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export type DocumentCandidate = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  size?: number | null;
};

export function validateDocumentCandidate<T extends DocumentCandidate>(media: T): T {
  if (!media?.uri?.trim()) {
    throw new Error('No pudimos leer el archivo seleccionado.');
  }

  const mime = String(media.mimeType ?? '').toLowerCase().trim();
  const name = String(media.fileName ?? media.uri).toLowerCase();
  const supportedByMime = SUPPORTED_DOCUMENT_MIME_TYPES.includes(mime as (typeof SUPPORTED_DOCUMENT_MIME_TYPES)[number]);
  const supportedByExtension = ['.pdf', '.jpg', '.jpeg', '.png'].some((extension) => name.endsWith(extension));

  if (!supportedByMime && !supportedByExtension) {
    throw new Error('Solo se permiten archivos PDF, JPG o PNG.');
  }

  if (typeof media.size === 'number' && media.size > MAX_DOCUMENT_BYTES) {
    throw new Error('El archivo no puede superar 1 MB.');
  }

  if (typeof media.size === 'number' && media.size < 0) {
    throw new Error('El tamaño del archivo es inválido.');
  }

  return media;
}
