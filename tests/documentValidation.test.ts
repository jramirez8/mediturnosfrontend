import { describe, expect, it } from '@jest/globals';
import {
  MAX_DOCUMENT_BYTES,
  validateDocumentCandidate,
} from '../src/utils/documentValidation';

describe('document validation', () => {
  it('acepta PDF, JPG y PNG por MIME', () => {
    expect(validateDocumentCandidate({ uri: 'file://a', mimeType: 'application/pdf', size: 100 }).uri).toBe('file://a');
    expect(validateDocumentCandidate({ uri: 'file://b', mimeType: 'image/jpeg', size: MAX_DOCUMENT_BYTES })).toBeTruthy();
    expect(validateDocumentCandidate({ uri: 'file://c', mimeType: 'image/png' })).toBeTruthy();
  });

  it('acepta extensión válida cuando el MIME no está disponible', () => {
    expect(validateDocumentCandidate({ uri: 'file://cache/placa.JPG', fileName: 'placa.JPG' })).toBeTruthy();
    expect(validateDocumentCandidate({ uri: 'file://cache/orden.pdf', mimeType: null })).toBeTruthy();
  });

  it('rechaza formatos no permitidos', () => {
    expect(() => validateDocumentCandidate({ uri: 'file://video.mp4', mimeType: 'video/mp4' }))
      .toThrow('Solo se permiten archivos PDF, JPG o PNG.');
  });

  it('rechaza archivos mayores a 1 MB', () => {
    expect(() => validateDocumentCandidate({ uri: 'file://placa.png', mimeType: 'image/png', size: MAX_DOCUMENT_BYTES + 1 }))
      .toThrow('El archivo no puede superar 1 MB.');
  });

  it('rechaza uri vacía y tamaños negativos', () => {
    expect(() => validateDocumentCandidate({ uri: ' ', mimeType: 'application/pdf' }))
      .toThrow('No pudimos leer el archivo seleccionado.');
    expect(() => validateDocumentCandidate({ uri: 'file://a.pdf', size: -1 }))
      .toThrow('El tamaño del archivo es inválido.');
  });
});
