import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { MtButton, MtBottomNav, MtCard, MtHeader, MtScreen } from '../components/mediturnos';
import { RoleBottomNav } from '../components/RoleBottomNav';
import { useAuthStore } from '../auth/authStore';
import { humanRole, routeForRole } from '../auth/roles';
import { ThemeMode, useThemeStore, useMtTheme } from '../theme/themeStore';
import { useTranslation } from '../i18n/languageStore';

export default function GlobalSettingsScreen() {
  const { token, role, nombreCompleto, hydrated, loadToken, logout } = useAuthStore();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const { mode, setMode } = useThemeStore();
  const { language, setLanguage, t } = useTranslation();

  useEffect(() => {
    if (!hydrated) loadToken();
  }, [hydrated, loadToken]);

  if (!hydrated) return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  if (!token) return <Redirect href="/login" />;

  const close = async () => {
    await logout();
    router.replace('/login');
  };

  const Option = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );

  const getThemeLabel = (item: ThemeMode) => {
    if (item === 'light') return t('settings.light');
    if (item === 'dark') return t('settings.dark');
    return t('settings.system');
  };

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="CONFIG" title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <MtCard style={{ marginBottom: 14 }}>
        <Text style={styles.cardTitle}>{t('settings.account')}</Text>
        <Text style={styles.text}>{nombreCompleto || 'Usuario'}</Text>
        <Text style={styles.muted}>{t('role.admin')}: {humanRole(role)}</Text>
        <MtButton title={t('settings.backToPanel')} onPress={() => router.replace(routeForRole(role))} style={{ marginTop: 14 }} />
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <Text style={styles.cardTitle}>{t('settings.appearance')}</Text>
        <Text style={styles.muted}>{t('settings.appearanceHelp')}</Text>
        <View style={styles.optionRow}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map((item) => (
            <Option key={item} label={getThemeLabel(item)} selected={mode === item} onPress={() => setMode(item)} />
          ))}
        </View>
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <Text style={styles.cardTitle}>{t('settings.language')}</Text>
        <Text style={styles.muted}>{t('settings.languageHelp')}</Text>
        <View style={styles.optionRow}>
          <Option label={t('settings.spanish')} selected={language === 'es'} onPress={() => setLanguage('es')} />
          <Option label={t('settings.english')} selected={language === 'en'} onPress={() => setLanguage('en')} />
          <Option label={t('settings.portuguese')} selected={language === 'pt'} onPress={() => setLanguage('pt')} />
        </View>
      </MtCard>

      <MtCard style={{ marginBottom: 92 }}>
        <Text style={styles.cardTitle}>{t('settings.session')}</Text>
        <Text style={styles.muted}>{t('settings.sessionHelp')}</Text>
        <MtButton title={t('common.logout')} variant="danger" onPress={close} style={{ marginTop: 14 }} />
      </MtCard>

      {role === 'ADMIN' ? <RoleBottomNav role="admin" active="settings" /> : null}
      {role === 'PROFESSIONAL' ? <RoleBottomNav role="medico" active="settings" /> : null}
      {role === 'SECRETARY' ? <RoleBottomNav role="secretaria" active="settings" /> : null}
      {role === 'PATIENT' ? <MtBottomNav active="perfil" /> : null}
    </MtScreen>
  );
}

function createStyles(theme: ReturnType<typeof useMtTheme>) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
    cardTitle: { color: theme.colors.ink, fontSize: 17, fontWeight: '900', marginBottom: 8 },
    text: { color: theme.colors.ink, fontWeight: '800' },
    muted: { color: theme.colors.muted, lineHeight: 20 },
    optionRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
    option: { flexGrow: 1, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 13, paddingHorizontal: 14, alignItems: 'center' },
    optionSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    optionText: { color: theme.colors.ink, fontWeight: '900' },
    optionTextSelected: { color: theme.mode === 'dark' ? '#06201D' : '#FFFFFF' },
  });
}
