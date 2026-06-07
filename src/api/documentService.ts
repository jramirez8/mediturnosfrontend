import { api } from './client';
import { mediaToFormData, absoluteApiUrl } from './uploadMedia';
import { PickedMedia } from '../utils/mediaPicker';

export type PacienteDocumento = {
  id: number;
  pacienteId: number;
  turnoId?: number | null;
  nombreArchivo: string;
  mimeType: string;
  tipoDocumento?: string | null;
  originalSizeBytes?: number | null;
  storedSizeBytes?: number | null;
  url?: string;
  subidoPorEmail?: string | null;
  subidoPorRol?: string | null;
  archivado?: boolean;
  creadoEn?: string;
};

function normalize(doc: any): PacienteDocumento {
  return {
    id: Number(doc?.id),
    pacienteId: Number(doc?.pacienteId),
    turnoId: doc?.turnoId ? Number(doc.turnoId) : null,
    nombreArchivo: String(doc?.nombreArchivo ?? doc?.name ?? 'documento'),
    mimeType: String(doc?.mimeType ?? 'application/octet-stream'),
    tipoDocumento: doc?.tipoDocumento ?? doc?.tipo ?? null,
    originalSizeBytes: doc?.originalSizeBytes ?? null,
    storedSizeBytes: doc?.storedSizeBytes ?? doc?.compressedSizeBytes ?? null,
    url: absoluteApiUrl(doc?.url ?? doc?.documentacionUrl),
    subidoPorEmail: doc?.subidoPorEmail ?? null,
    subidoPorRol: doc?.subidoPorRol ?? null,
    archivado: Boolean(doc?.archivado),
    creadoEn: doc?.creadoEn,
  };
}

async function upload(pacienteId: number, media: PickedMedia, tipoDocumento: string, turnoId?: number | null) {
  const form = await mediaToFormData(media);
  form.append('tipoDocumento', tipoDocumento);
  if (turnoId) form.append('turnoId', String(turnoId));
  const response = await api.post(`/api/documentos/paciente/${pacienteId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return response.data;
}

export const documentService = {
  listMine: async () => {
    const response = await api.get('/api/documentos/me');
    return (Array.isArray(response.data) ? response.data : []).map(normalize).filter((d) => d.id > 0);
  },
  listByPaciente: async (pacienteId: number, incluirArchivados = false) => {
    const response = await api.get(`/api/documentos/paciente/${pacienteId}`, { params: { incluirArchivados } });
    return (Array.isArray(response.data) ? response.data : []).map(normalize).filter((d) => d.id > 0);
  },
  upload,
  archive: async (id: number) => {
    const response = await api.put(`/api/documentos/${id}/archivar`);
    return normalize(response.data);
  },
};
