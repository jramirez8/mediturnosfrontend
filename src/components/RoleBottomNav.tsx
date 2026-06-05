import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMtTheme } from '../theme/themeStore';

type Item = { key: string; label: string; icon: string; path: string };

const itemsByRole: Record<string, Item[]> = {
  medico: [
    { key: 'home', label: 'Inicio', icon: '⌂', path: '/medico' },
    { key: 'agenda', label: 'Agenda', icon: '□', path: '/medico/agenda' },
    { key: 'consulta', label: 'Consulta', icon: '✎', path: '/medico/consulta' },
    { key: 'settings', label: 'Ajustes', icon: '⚙', path: '/settings' },
  ],
  secretaria: [
    { key: 'home', label: 'Inicio', icon: '⌂', path: '/secretaria' },
    { key: 'turnos', label: 'Turnos', icon: '□', path: '/secretaria/turnos' },
    { key: 'nuevo', label: 'Nuevo', icon: '+', path: '/secretaria/nuevo-turno' },
    { key: 'pacientes', label: 'Pacientes', icon: '◉', path: '/secretaria/pacientes' },
    { key: 'settings', label: 'Ajustes', icon: '⚙', path: '/settings' },
  ],
  admin: [
    { key: 'home', label: 'Inicio', icon: '⌂', path: '/admin' },
    { key: 'usuarios', label: 'Usuarios', icon: '◉', path: '/admin/usuarios' },
    { key: 'profesionales', label: 'Médicos', icon: '✚', path: '/admin/profesionales' },
    { key: 'catalogos', label: 'Catálogos', icon: '▤', path: '/admin/catalogos' },
    { key: 'settings', label: 'Ajustes', icon: '⚙', path: '/settings' },
  ],
};

export function RoleBottomNav({ role, active }: { role: 'medico' | 'secretaria' | 'admin'; active: string }) {
  const theme = useMtTheme();
  const items = itemsByRole[role];

  return (
    <View style={[styles.nav, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.shadow.shadowColor }]}>
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Pressable key={item.key} style={styles.item} onPress={() => router.replace(item.path as any)}>
            <Text style={[styles.icon, { color: selected ? theme.colors.primary : theme.colors.soft }]}>{item.icon}</Text>
            <Text style={[styles.label, { color: selected ? theme.colors.primary : theme.colors.soft, fontWeight: selected ? '900' : '700' }]}>{item.label}</Text>
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
    minHeight: 72,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 8 },
  icon: { fontSize: 20, fontWeight: '900' },
  label: { fontSize: 10 },
});
