import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  SUPPORTED_DOCUMENT_MIME_TYPES,
  validateDocumentCandidate,
} from './documentValidation';

export { MAX_DOCUMENT_BYTES, SUPPORTED_DOCUMENT_MIME_TYPES } from './documentValidation';

export type PickedMedia = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  size?: number | null;
};

function validateMedia(media: PickedMedia) {
  return validateDocumentCandidate(media);
}

function normalizeImage(result: ImagePicker.ImagePickerResult): PickedMedia | null {
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return validateMedia({
    uri: asset.uri,
    fileName: asset.fileName ?? asset.uri.split('/').pop() ?? 'archivo-adjunto.jpg',
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize ?? null,
  });
}

function normalizeDocument(result: DocumentPicker.DocumentPickerResult): PickedMedia | null {
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return validateMedia({
    uri: asset.uri,
    fileName: asset.name ?? asset.uri.split('/').pop() ?? 'documento-adjunto',
    mimeType: asset.mimeType ?? null,
    size: asset.size ?? null,
  });
}

export async function pickFromGallery(): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Necesitamos permiso para abrir la galería.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });

  return normalizeImage(result);
}

export async function pickFromCamera(): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Necesitamos permiso para usar la cámara.');

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });

  return normalizeImage(result);
}

export async function pickDocumentFile(): Promise<PickedMedia | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...SUPPORTED_DOCUMENT_MIME_TYPES],
    copyToCacheDirectory: true,
    multiple: false,
  });
  return normalizeDocument(result);
}

export function chooseDocumentSource(onPicked: (media: PickedMedia) => void, onError: (message: string) => void) {
  const run = async (picker: () => Promise<PickedMedia | null>) => {
    try {
      const picked = await picker();
      if (picked) onPicked(picked);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error ?? 'No pudimos adjuntar el archivo.');
      onError(message);
    }
  };

  if (Platform.OS === 'web') {
    run(pickDocumentFile);
    return;
  }

  Alert.alert('Adjuntar documentación', 'PDF, JPG o PNG hasta 1 MB.', [
    { text: 'Archivo/PDF', onPress: () => run(pickDocumentFile) },
    { text: 'Cámara', onPress: () => run(pickFromCamera) },
    { text: 'Galería', onPress: () => run(pickFromGallery) },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

export function chooseImageSource(onPicked: (media: PickedMedia) => void, onError: (message: string) => void) {
  chooseDocumentSource(onPicked, onError);
}
