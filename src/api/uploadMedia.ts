import { Platform } from 'react-native';
import { PickedMedia } from '../utils/mediaPicker';
import { API_BASE_URL } from './client';

type ReactNativeFormDataFile = {
  uri: string;
  name: string;
  type: string;
};

export function absoluteApiUrl(url?: string | null) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function mediaToFormData(media: PickedMedia) {
  const form = new FormData();
  const name = media.fileName || `mediturnos-${Date.now()}.jpg`;
  const type = media.mimeType || 'image/jpeg';

  if (Platform.OS === 'web') {
    const response = await fetch(media.uri);
    const blob = await response.blob();
    form.append('file', blob, name);
  } else {
    const filePart: ReactNativeFormDataFile = {
      uri: media.uri,
      name,
      type,
    };
    form.append('file', filePart as unknown as Blob);
  }

  return form;
}
