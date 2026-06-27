import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtHeader, MtScreen } from '../components/mediturnos';
import { useAuthStore } from '../auth/authStore';
import { humanRole, routeForRole } from '../auth/roles';
import { useMtTheme } from '../theme/themeStore';

export default function NoAutorizadoScreen() {
  const { role, logout } = useAuthStore();
  const theme = useMtTheme();

  const goHome = () => router.replace(routeForRole(role));
  const close = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="SEGURIDAD" title="Sin permisos" subtitle="Tu usuario no tiene acceso a este panel." />
      <MtCard>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>Rol detectado: {humanRole(role)}</Text>
        <Text style={{ color: theme.colors.muted, marginTop: 8, lineHeight: 21 }}>
          Te mandamos acá para evitar que un usuario vea pantallas que no corresponden a su rol.
        </Text>
        <MtButton title="Ir a mi panel" onPress={goHome} style={{ marginTop: 18 }} />
        <MtButton title="Cerrar sesión" variant="danger" onPress={close} style={{ marginTop: 10 }} />
      </MtCard>
    </MtScreen>
  );
}
