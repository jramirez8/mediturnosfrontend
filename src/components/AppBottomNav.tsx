import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMtTheme } from '../theme/themeStore';
import { useTranslation } from '../i18n/languageStore';

export type AppNavRole = 'paciente' | 'medico' | 'secretaria' | 'admin';

type NavItem = {
  key: string;
  labelKey: string;
  fallback: string;
  icon: string;
  path: string;
  center?: boolean;
};

const NAV_ITEMS: Record<AppNavRole, NavItem[]> = {
  paciente: [
    { key: 'home', labelKey: 'nav.home', fallback: 'Inicio', icon: '⌂', path: '/paciente' },
    { key: 'perfil', labelKey: 'nav.profile', fallback: 'Perfil', icon: '◉', path: '/paciente/perfil' },
    { key: 'solicitar', labelKey: 'nav.new', fallback: 'Nuevo', icon: '+', path: '/paciente/solicitar', center: true },
    { key: 'turnos', labelKey: 'nav.appointments', fallback: 'Turnos', icon: '▦', path: '/paciente/turnos' },
    { key: 'historia', labelKey: 'nav.history', fallback: 'Historia', icon: '✦', path: '/paciente/historia' },
  ],
  medico: [
    { key: 'home', labelKey: 'nav.home', fallback: 'Inicio', icon: '⌂', path: '/medico' },
    { key: 'agenda', labelKey: 'nav.agenda', fallback: 'Agenda', icon: '▦', path: '/medico/agenda' },
    { key: 'consulta', labelKey: 'nav.consultation', fallback: 'Consulta', icon: '⚕', path: '/medico/consulta' },
    { key: 'disponibilidad', labelKey: 'nav.availability', fallback: 'Disponib.', icon: '◷', path: '/medico/disponibilidad' },
    { key: 'settings', labelKey: 'common.settings', fallback: 'Ajustes', icon: '◌', path: '/settings' },
  ],
  secretaria: [
    { key: 'home', labelKey: 'nav.home', fallback: 'Inicio', icon: '⌂', path: '/secretaria' },
    { key: 'turnos', labelKey: 'nav.appointments', fallback: 'Turnos', icon: '▦', path: '/secretaria/turnos' },
    { key: 'nuevo', labelKey: 'nav.new', fallback: 'Nuevo', icon: '+', path: '/secretaria/nuevo-turno', center: true },
    { key: 'pacientes', labelKey: 'nav.patients', fallback: 'Pacientes', icon: '◎', path: '/secretaria/pacientes' },
    { key: 'settings', labelKey: 'common.settings', fallback: 'Ajustes', icon: '◌', path: '/settings' },
  ],
  admin: [
    { key: 'home', labelKey: 'nav.home', fallback: 'Inicio', icon: '⌂', path: '/admin' },
    { key: 'usuarios', labelKey: 'nav.users', fallback: 'Usuarios', icon: '◎', path: '/admin/usuarios' },
    { key: 'profesionales', labelKey: 'nav.doctors', fallback: 'Médicos', icon: '⚕', path: '/admin/profesionales' },
    { key: 'reportes', labelKey: 'nav.reports', fallback: 'Reportes', icon: '▧', path: '/admin/reportes' },
    { key: 'settings', labelKey: 'common.settings', fallback: 'Ajustes', icon: '◌', path: '/settings' },
  ],
};

function translateSafe(t: (key: string) => string, item: NavItem) {
  const translated = t(item.labelKey);
  return translated && translated !== item.labelKey ? translated : item.fallback;
}

export function AppBottomNav({ role, active }: { role: AppNavRole; active: string }) {
  const theme = useMtTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = theme.mode === 'dark';
  const items = NAV_ITEMS[role];
  const bottom = Math.max(insets.bottom, 8);

  return (
    <View
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
          <Pressable key={`${role}-${item.key}`} style={styles.item} onPress={() => router.replace(item.path as any)}>
            <View
              style={[
                styles.iconBubble,
                { borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF' },
                selected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 },
                item.center && {
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  marginTop: -28,
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.bg,
                  borderWidth: 4,
                  shadowColor: theme.colors.primary,
                  shadowOpacity: 0.26,
                  shadowRadius: 18,
                  elevation: 8,
                },
              ]}
            >
              <Text style={[styles.icon, { color: selected || item.center ? '#FFFFFF' : theme.colors.soft, fontSize: item.center ? 32 : 16, lineHeight: item.center ? 34 : 19 }]}>
                {item.icon}
              </Text>
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
    </View>
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
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 8,
    zIndex: 50,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8, minWidth: 0 },
  iconBubble: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontWeight: '900', textAlign: 'center' },
  label: { fontSize: 9.5, maxWidth: 70, textAlign: 'center' },
});
