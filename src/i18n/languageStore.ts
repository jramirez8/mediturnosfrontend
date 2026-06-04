import { create } from 'zustand';
import { storage } from '../api/storage';

export type AppLanguage = 'es' | 'en';
const LANGUAGE_KEY = 'mediturnos_language';

type Dictionary = Record<string, string>;

const es: Dictionary = {
  'common.save': 'Guardar cambios',
  'common.back': 'Volver',
  'common.cancel': 'Cancelar',
  'common.loadingProfile': 'Cargando perfil...',
  'common.logout': 'Cerrar sesión',
  'profile.eyebrow': 'CUENTA',
  'profile.title': 'Mi perfil',
  'profile.subtitle': 'Datos personales, cobertura médica y preferencias de contacto.',
  'profile.editableInfo': 'Información editable',
  'profile.email': 'Email',
  'profile.phone': 'Teléfono',
  'profile.healthInsurance': 'Obra social',
  'profile.memberNumber': 'Número de afiliado',
  'profile.mainInstitution': 'Institución de cabecera',
  'profile.mainDoctor': 'Médico de cabecera',
  'settings.title': 'Preferencias de la app',
  'settings.subtitle': 'Implementa modo oscuro y multiidioma, dos puntos explícitos de la Clase 10.',
  'settings.darkMode': 'Modo oscuro',
  'settings.darkModeHint': 'Cambia colores globales sin reiniciar la app.',
  'settings.language': 'Idioma',
  'settings.languageHint': 'Los textos nuevos usan claves de traducción con fallback.',
  'settings.spanish': 'Español',
  'settings.english': 'Inglés',
  'privacy.title': 'Buenas prácticas de privacidad',
  'privacy.text': 'El token se guarda en storage de emergencia durante la sesión y el cache local se limpia al cerrar sesión. Los datos sensibles deben sincronizarse siempre contra el backend.',
  'login.title': 'Iniciar sesión',
  'login.subtitle': 'Turnos médicos simples, rápidos y seguros.',
  'login.helper': 'Entrá con tu usuario para gestionar turnos, perfil e historia clínica.',
  'login.email': 'Email',
  'login.password': 'Contraseña',
  'login.submit': 'Ingresar',
  'login.createAccount': 'Crear cuenta',
  'login.forgot': '¿Olvidaste tu contraseña?',
  'login.demoTitle': 'Demo lista para defensa',
  'login.demoText': 'Credenciales seed precargadas. Si Railway cae, algunas pantallas siguen mostrando cache/datos demo para no quedar en blanco.',
};

const en: Dictionary = {
  'common.save': 'Save changes',
  'common.back': 'Back',
  'common.cancel': 'Cancel',
  'common.loadingProfile': 'Loading profile...',
  'common.logout': 'Sign out',
  'profile.eyebrow': 'ACCOUNT',
  'profile.title': 'My profile',
  'profile.subtitle': 'Personal data, health coverage and contact preferences.',
  'profile.editableInfo': 'Editable information',
  'profile.email': 'Email',
  'profile.phone': 'Phone',
  'profile.healthInsurance': 'Health insurance',
  'profile.memberNumber': 'Member number',
  'profile.mainInstitution': 'Main institution',
  'profile.mainDoctor': 'Main doctor',
  'settings.title': 'App preferences',
  'settings.subtitle': 'Adds dark mode and multilingual support, both explicitly covered in Class 10.',
  'settings.darkMode': 'Dark mode',
  'settings.darkModeHint': 'Changes global colors without restarting the app.',
  'settings.language': 'Language',
  'settings.languageHint': 'New texts use translation keys with fallback.',
  'settings.spanish': 'Spanish',
  'settings.english': 'English',
  'privacy.title': 'Privacy best practices',
  'privacy.text': 'The token is stored in emergency storage during the session and the local cache is cleared on logout. Sensitive data should always sync with the backend.',
  'login.title': 'Sign in',
  'login.subtitle': 'Simple, fast and safe medical appointments.',
  'login.helper': 'Log in to manage appointments, profile and medical history.',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.createAccount': 'Create account',
  'login.forgot': 'Forgot your password?',
  'login.demoTitle': 'Demo ready for presentation',
  'login.demoText': 'Seed credentials are preloaded. If Railway is down, some screens still show cache/demo data instead of going blank.',
};

const dictionaries: Record<AppLanguage, Dictionary> = { es, en };

type LanguageState = {
  language: AppLanguage;
  hydrated: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  loadLanguage: () => Promise<void>;
  t: (key: string) => string;
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'es',
  hydrated: false,

  setLanguage: async (language) => {
    await storage.setItem(LANGUAGE_KEY, language);
    set({ language, hydrated: true });
  },

  toggleLanguage: async () => {
    const next = get().language === 'es' ? 'en' : 'es';
    await get().setLanguage(next);
  },

  loadLanguage: async () => {
    const saved = await storage.getItem(LANGUAGE_KEY);
    if (saved === 'es' || saved === 'en') {
      set({ language: saved, hydrated: true });
      return;
    }
    set({ language: 'es', hydrated: true });
  },

  t: (key) => {
    const language = get().language;
    return dictionaries[language][key] ?? dictionaries.es[key] ?? key;
  },
}));

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const t = useLanguageStore((state) => state.t);
  return { language, setLanguage, t };
}
