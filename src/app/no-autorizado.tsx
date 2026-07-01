import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtHeader, MtScreen } from '../components/mediturnos';
import { useAuthStore } from '../auth/authStore';
import { humanRole, routeForRole } from '../auth/roles';
import { languageCopy, useTranslation } from '../i18n/languageStore';
import { useMtTheme } from '../theme/themeStore';

export default function NoAutorizadoScreen() {
  const { role, logout } = useAuthStore();
  const { language } = useTranslation();
  const copy = (es: string, en: string, pt: string) => languageCopy(language, es, en, pt);
  const theme = useMtTheme();

  const goHome = () => router.replace(routeForRole(role));
  const close = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <MtScreen scroll>
      <MtHeader
        eyebrow={copy('SEGURIDAD', 'SECURITY', 'SEGURANCA')}
        title={copy('Sin permisos', 'No permission', 'Sem permissao')}
        subtitle={copy('Tu usuario no tiene acceso a este panel.', 'Your user does not have access to this panel.', 'Seu usuario nao tem acesso a este painel.')}
      />
      <MtCard>
        <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>{copy('Rol detectado', 'Detected role', 'Perfil detectado')}: {humanRole(role)}</Text>
        <Text style={{ color: theme.colors.muted, marginTop: 8, lineHeight: 21 }}>
          {copy(
            'Te mandamos aca para evitar que un usuario vea pantallas que no corresponden a su rol.',
            'We sent you here to prevent a user from seeing screens that do not match their role.',
            'Enviamos voce para ca para evitar que um usuario veja telas que nao correspondem ao seu perfil.',
          )}
        </Text>
        <MtButton title={copy('Ir a mi panel', 'Go to my panel', 'Ir para meu painel')} onPress={goHome} style={{ marginTop: 18 }} />
        <MtButton title={copy('Cerrar sesion', 'Sign out', 'Sair')} variant="danger" onPress={close} style={{ marginTop: 10 }} />
      </MtCard>
    </MtScreen>
  );
}
