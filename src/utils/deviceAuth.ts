import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '../api/storage';

const PREFIX = 'biometric_';

const KEYS = {
  enabled: `${PREFIX}enabled`,
  email: `${PREFIX}email`,
  token: `${PREFIX}access_token`,
  usuarioId: `${PREFIX}usuario_id`,
  pacienteId: `${PREFIX}paciente_id`,
  profesionalId: `${PREFIX}profesional_id`,
  role: `${PREFIX}role`,
  nombreCompleto: `${PREFIX}nombre_completo`,
};

export type BiometricInfo = {
  enabled: boolean;
  email: string | null;
};

export async function getBiometricInfo(): Promise<BiometricInfo> {
  const enabled = (await storage.getItem(KEYS.enabled)) === 'true';
  const email = await storage.getItem(KEYS.email);
  return { enabled, email };
}

export async function canUseDeviceAuth() {
  if (Platform.OS === 'web') return { ok: false, reason: 'La autenticación del dispositivo no está disponible en Web.' };

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware) return { ok: false, reason: 'Este dispositivo no tiene biometría/PIN compatible.' };
    if (!enrolled) return { ok: false, reason: 'Primero configurá huella, rostro, PIN o patrón en el dispositivo.' };

    return { ok: true, reason: null };
  } catch {
    return { ok: false, reason: 'No pudimos consultar la autenticación del dispositivo.' };
  }
}

export async function authenticateDevice(promptMessage = 'Ingresar a Mediturnos') {
  const available = await canUseDeviceAuth();
  if (!available.ok) return { success: false, error: available.reason ?? 'Autenticación no disponible.' };

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar PIN o patrón',
    disableDeviceFallback: false,
  });

  if (!result.success) return { success: false, error: 'No pudimos validar la identidad con el método del dispositivo.' };
  return { success: true, error: null };
}

export async function saveCurrentSessionForDeviceAuth(email: string) {
  const [token, usuarioId, pacienteId, profesionalId, role, nombreCompleto] = await Promise.all([
    storage.getItem('access_token'),
    storage.getItem('usuario_id'),
    storage.getItem('paciente_id'),
    storage.getItem('profesional_id'),
    storage.getItem('role'),
    storage.getItem('nombre_completo'),
  ]);

  if (!token) throw new Error('No hay sesión activa para guardar con biometría.');

  await storage.setItem(KEYS.enabled, 'true');
  await storage.setItem(KEYS.email, email.trim());
  await storage.setItem(KEYS.token, token);
  if (usuarioId) await storage.setItem(KEYS.usuarioId, usuarioId);
  if (pacienteId) await storage.setItem(KEYS.pacienteId, pacienteId);
  if (profesionalId) await storage.setItem(KEYS.profesionalId, profesionalId);
  if (role) await storage.setItem(KEYS.role, role);
  if (nombreCompleto) await storage.setItem(KEYS.nombreCompleto, nombreCompleto);
}

export async function readSavedDeviceSession() {
  const [enabled, email, token, usuarioId, pacienteId, profesionalId, role, nombreCompleto] = await Promise.all([
    storage.getItem(KEYS.enabled),
    storage.getItem(KEYS.email),
    storage.getItem(KEYS.token),
    storage.getItem(KEYS.usuarioId),
    storage.getItem(KEYS.pacienteId),
    storage.getItem(KEYS.profesionalId),
    storage.getItem(KEYS.role),
    storage.getItem(KEYS.nombreCompleto),
  ]);

  if (enabled !== 'true' || !token || !role) return null;
  return { email, token, usuarioId, pacienteId, profesionalId, role, nombreCompleto };
}

export async function promoteDeviceSessionToActive() {
  const session = await readSavedDeviceSession();
  if (!session) throw new Error('No hay una sesión biométrica guardada en este dispositivo.');

  await storage.setItem('access_token', session.token);
  if (session.usuarioId) await storage.setItem('usuario_id', session.usuarioId);
  if (session.pacienteId) await storage.setItem('paciente_id', session.pacienteId);
  if (session.profesionalId) await storage.setItem('profesional_id', session.profesionalId);
  if (session.role) await storage.setItem('role', session.role);
  if (session.nombreCompleto) await storage.setItem('nombre_completo', session.nombreCompleto);

  return session;
}

export async function disableDeviceAuthLogin() {
  await Promise.all([
    storage.deleteItem(KEYS.enabled),
    storage.deleteItem(KEYS.email),
    storage.deleteItem(KEYS.token),
    storage.deleteItem(KEYS.usuarioId),
    storage.deleteItem(KEYS.pacienteId),
    storage.deleteItem(KEYS.profesionalId),
    storage.deleteItem(KEYS.role),
    storage.deleteItem(KEYS.nombreCompleto),
  ]);
}
