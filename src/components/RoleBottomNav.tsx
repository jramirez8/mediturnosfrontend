import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMtTheme } from '../theme/themeStore';
import { useTranslation } from '../i18n/languageStore';


type Item = { key: string; labelKey: string; icon: string; path: string };

const itemsByRole: Record<string, Item[]> = {
  medico: [
    { key: 'home', labelKey: 'nav.home', icon: '⌂', path: '/medico' },
    { key: 'agenda', labelKey: 'nav.agenda', icon: '▦', path: '/medico/agenda' },
    { key: 'consulta', labelKey: 'nav.consultation', icon: '⚕', path: '/medico/consulta' },
    { key: 'settings', labelKey: 'common.settings', icon: '◌', path: '/settings' },
  ],
  secretaria: [
    { key: 'home', labelKey: 'nav.home', icon: '⌂', path: '/secretaria' },
    { key: 'turnos', labelKey: 'nav.appointments', icon: '▦', path: '/secretaria/turnos' },
    { key: 'nuevo', labelKey: 'nav.new', icon: '+', path: '/secretaria/nuevo-turno' },
    { key: 'pacientes', labelKey: 'nav.patients', icon: '◎', path: '/secretaria/pacientes' },
    { key: 'settings', labelKey: 'common.settings', icon: '◌', path: '/settings' },
  ],
  admin: [
    { key: 'home', labelKey: 'nav.home', icon: '⌂', path: '/admin' },
    { key: 'usuarios', labelKey: 'nav.users', icon: '◎', path: '/admin/usuarios' },
    { key: 'profesionales', labelKey: 'nav.doctors', icon: '⚕', path: '/admin/profesionales' },
    { key: 'catalogos', labelKey: 'nav.catalogs', icon: '▤', path: '/admin/catalogos' },
    { key: 'reportes', labelKey: 'nav.reports', icon: '▧', path: '/admin/reportes' },
    { key: 'settings', labelKey: 'common.settings', icon: '◌', path: '/settings' },
  ],
};

export function RoleBottomNav({ role, active }: { role: 'medico' | 'secretaria' | 'admin'; active: string }) {
  const theme = useMtTheme();
  const { t } = useTranslation();
  const items = itemsByRole[role];
  const isDark = theme.mode === 'dark';

  return (
    <View style={[styles.nav, { backgroundColor: isDark ? 'rgba(31,20,52,0.96)' : 'rgba(255,255,255,0.94)', borderColor: theme.colors.border, shadowColor: theme.shadow.shadowColor }]}> 
      {items.map((item) => {
        const selected = item.key === active;
        const isNew = item.key === 'nuevo';
        return (
          <Pressable key={item.key} style={styles.item} onPress={() => router.replace(item.path as any)}>
            <View
              style={[
                styles.iconBubble,
                { borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF' },
                selected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 },
                isNew && { width: 44, height: 44, borderRadius: 22, marginTop: -16, backgroundColor: theme.colors.primary, borderColor: theme.colors.bg, borderWidth: 4 },
              ]}
            >
              <Text style={[styles.icon, { color: selected || isNew ? '#FFFFFF' : theme.colors.soft, fontSize: isNew ? 25 : 16 }]}>{item.icon}</Text>
            </View>
            <Text style={[styles.label, { color: selected ? theme.colors.primary : theme.colors.soft, fontWeight: selected ? '900' : '800' }]} numberOfLines={1}>{t(item.labelKey)}</Text>
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
    bottom: 10,
    minHeight: 78,
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 5,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8 },
  iconBubble: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 16, fontWeight: '900' },
  label: { fontSize: 9.5, maxWidth: 68 },
});
