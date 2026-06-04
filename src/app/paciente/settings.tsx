import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useAuthStore } from '../../auth/authStore';
import { MtBottomNav, MtButton, MtCard, MtHeader, MtScreen } from '../../components/mediturnos';
import { MediturnosTheme } from '../../constants/mediturnosTheme';
import { useMtTheme, useThemeStore } from '../../theme/themeStore';
import { useTranslation } from '../../i18n/languageStore';
import { logoutAndGoToLogin } from '../../utils/session';

export default function SettingsScreen() {
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const { language, setLanguage, t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logoutAndGoToLogin(logout);
  };

  return (
    <>
      <MtScreen scroll>
        <MtHeader
          eyebrow="CONFIGURACIÓN"
          title="Ajustes"
          subtitle="Tema, idioma, sesión y preferencias visibles de la app. Esto responde directo a Clase 10."
        />

        <MtCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('settings.subtitle')}</Text>

          <View style={styles.preferenceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.preferenceTitle}>{t('settings.darkMode')}</Text>
              <Text style={styles.preferenceHint}>{t('settings.darkModeHint')}</Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={(value) => setMode(value ? 'dark' : 'light')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={mode === 'dark' ? theme.colors.primary : theme.colors.soft}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.preferenceTitle}>Seguir sistema</Text>
              <Text style={styles.preferenceHint}>Toma claro/oscuro del dispositivo cuando está disponible.</Text>
            </View>
            <Switch
              value={mode === 'system'}
              onValueChange={(value) => setMode(value ? 'system' : 'light')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={mode === 'system' ? theme.colors.primary : theme.colors.soft}
            />
          </View>
        </MtCard>

        <MtCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <Text style={styles.sectionSubtitle}>{t('settings.languageHint')}</Text>
          <View style={styles.languageRow}>
            <LanguageButton label={t('settings.spanish')} selected={language === 'es'} onPress={() => setLanguage('es')} styles={styles} />
            <LanguageButton label={t('settings.english')} selected={language === 'en'} onPress={() => setLanguage('en')} styles={styles} />
          </View>
        </MtCard>

        <MtCard style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <Text style={styles.sectionSubtitle}>Desde acá sí o sí se ve el cierre de sesión, sin esconderlo abajo del dashboard.</Text>
          <MtButton title="Cerrar sesión" variant="danger" onPress={handleLogout} />
          <MtButton title="Volver al perfil" variant="ghost" onPress={() => router.push('/paciente/perfil')} style={{ marginTop: 10 }} />
        </MtCard>
      </MtScreen>
      <MtBottomNav active="perfil" />
    </>
  );
}

function LanguageButton({ label, selected, onPress, styles }: { label: string; selected: boolean; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  return (
    <Pressable onPress={onPress} style={[styles.languageButton, selected && styles.languageButtonSelected]}>
      <Text style={[styles.languageButtonText, selected && styles.languageButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    section: { marginBottom: 16 },
    sectionTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 6 },
    sectionSubtitle: { color: theme.colors.muted, lineHeight: 20, marginBottom: 14 },
    preferenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 14, marginTop: 14 },
    preferenceTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 15 },
    preferenceHint: { color: theme.colors.muted, lineHeight: 19, marginTop: 4, fontSize: 13 },
    languageRow: { flexDirection: 'row', gap: 10 },
    languageButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
    languageButtonSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
    languageButtonText: { color: theme.colors.muted, fontWeight: '900' },
    languageButtonTextSelected: { color: theme.colors.primaryDark },
  });
}
