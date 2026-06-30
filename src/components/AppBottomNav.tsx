import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMtTheme } from '../theme/themeStore';
import { useTranslation } from '../i18n/languageStore';
import { AnimatedEntrance } from './MicroAnimation';

export type AppNavRole = 'paciente' | 'medico' | 'secretaria' | 'admin';

type NavItem = {
  key: string;
  labelKey: string;
  fallback: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
  center?: boolean;
};

const NAV_ITEMS: Record<AppNavRole, NavItem[]> = {
  paciente: [
    { key: 'home', labelKey: 'nav.home', fallback: 'Inicio', icon: 'home-outline', path: '/paciente' },
    { key: 'perfil', labelKey: 'nav.profile', fallback: 'Perfil', icon: 'person-outline', path: '/paciente/perfil' },
    { key: 'solicitar', labelKey: 'nav.new', fallback: 'Nuevo', icon: 'add', path: '/paciente/solicitar', center: true },
    { key: 'turnos', labelKey: 'nav.appointments', fallback: 'Turnos', icon: 'calendar-outline', path: '/paciente/turnos' },
    { key: 'historia', labelKey: 'nav.history', fallback: 'Historia', icon: 'document-text-outline', path: '/paciente/historia' },
  ],
  medico: [
    { key: 'home', labelKey: 'nav.home', fallback: 'Inicio', icon: 'home-outline', path: '/medico' },
    { key: 'agenda', labelKey: 'nav.agenda', fallback: 'Agenda', icon: 'calendar-outline', path: '/medico/agenda' },
    { key: 'consulta', labelKey: 'nav.consultation', fallback: 'Consulta', icon: 'medkit-outline', path: '/medico/consulta' },
    { key: 'disponibilidad', labelKey: 'nav.availability', fallback: 'Disponib.', icon: 'time-outline', path: '/medico/disponibilidad' },
    { key: 'settings', labelKey: 'common.settings', fallback: 'Ajustes', icon: 'settings-outline', path: '/settings' },
  ],
  secretaria: [
    { key: 'home', labelKey: 'nav.home', fallback: 'Inicio', icon: 'home-outline', path: '/secretaria' },
    { key: 'turnos', labelKey: 'nav.appointments', fallback: 'Turnos', icon: 'calendar-outline', path: '/secretaria/turnos' },
    { key: 'nuevo', labelKey: 'nav.new', fallback: 'Nuevo', icon: 'add', path: '/secretaria/nuevo-turno', center: true },
    { key: 'pacientes', labelKey: 'nav.patients', fallback: 'Pacientes', icon: 'people-outline', path: '/secretaria/pacientes' },
    { key: 'settings', labelKey: 'common.settings', fallback: 'Ajustes', icon: 'settings-outline', path: '/settings' },
  ],
  admin: [
    { key: 'home', labelKey: 'nav.home', fallback: 'Inicio', icon: 'home-outline', path: '/admin' },
    { key: 'usuarios', labelKey: 'nav.users', fallback: 'Usuarios', icon: 'people-outline', path: '/admin/usuarios' },
    { key: 'profesionales', labelKey: 'nav.doctors', fallback: 'Medicos', icon: 'medkit-outline', path: '/admin/profesionales' },
    { key: 'reportes', labelKey: 'nav.reports', fallback: 'Reportes', icon: 'bar-chart-outline', path: '/admin/reportes' },
    { key: 'settings', labelKey: 'common.settings', fallback: 'Ajustes', icon: 'settings-outline', path: '/settings' },
  ],
};

function translateSafe(t: (key: string) => string, item: NavItem) {
  const translated = t(item.labelKey);
  return translated && translated !== item.labelKey ? translated : item.fallback;
}

export function AppBottomNav({ role, active }: Readonly<{ role: AppNavRole; active: string }>) {
  const theme = useMtTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = theme.mode === 'dark';
  const items = NAV_ITEMS[role];
  const bottom = Math.max(insets.bottom, 8);

  return (
    <AnimatedEntrance
      distance={10}
      duration={170}
      style={[
        styles.nav,
        {
          bottom,
          backgroundColor: isDark ? 'rgba(31,20,52,0.96)' : 'rgba(255,255,255,0.95)',
          borderColor: theme.colors.border,
          shadowColor: theme.shadow.shadowColor,
        },
      ]}
    >
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Pressable
            key={`${role}-${item.key}`}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => router.replace(item.path)}
          >
            <View
              style={[
                styles.iconBubble,
                { borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF' },
                selected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                item.center && {
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  marginTop: -28,
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.bg,
                  borderWidth: 4,
                },
              ]}
            >
              <Ionicons name={item.icon} size={item.center ? 32 : 18} color={selected || item.center ? '#FFFFFF' : theme.colors.soft} />
            </View>
            <Text
              style={[styles.label, { color: selected ? theme.colors.primary : theme.colors.soft, fontWeight: selected ? '900' : '800' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {translateSafe(t, item)}
            </Text>
          </Pressable>
        );
      })}
    </AnimatedEntrance>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    left: 12,
    right: 12,
    minHeight: 78,
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    zIndex: 50,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8, minWidth: 0 },
  itemPressed: { transform: [{ translateY: 1 }], opacity: 0.76 },
  iconBubble: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 9.5, maxWidth: 70, textAlign: 'center' },
});
