import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type PickedMedia = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

function normalize(result: ImagePicker.ImagePickerResult): PickedMedia | null {
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? asset.uri.split('/').pop() ?? 'archivo-adjunto',
    mimeType: asset.mimeType ?? null,
  };
}

export async function pickFromGallery(): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Necesitamos permiso para abrir la galería.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: true,
  });

  return normalize(result);
}

export async function pickFromCamera(): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Necesitamos permiso para usar la cámara.');

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: true,
  });

  return normalize(result);
}

export function chooseImageSource(onPicked: (media: PickedMedia) => void, onError: (message: string) => void) {
  const openGallery = async () => {
    try {
      const picked = await pickFromGallery();
      if (picked) onPicked(picked);
    } catch (error: any) {
      onError(error?.message ?? 'No pudimos abrir la galería.');
    }
  };

  const openCamera = async () => {
    try {
      const picked = await pickFromCamera();
      if (picked) onPicked(picked);
    } catch (error: any) {
      onError(error?.message ?? 'No pudimos abrir la cámara.');
    }
  };

  if (Platform.OS === 'web') {
    openGallery();
    return;
  }

  Alert.alert('Adjuntar imagen', 'Elegí desde dónde querés cargar el archivo.', [
    { text: 'Cámara', onPress: openCamera },
    { text: 'Galería', onPress: openGallery },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}
