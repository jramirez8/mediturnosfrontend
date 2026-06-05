import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { MtButton, MtCard, MtHeader, MtScreen } from '../components/mediturnos';
import { useAuthStore } from '../auth/authStore';
import { humanRole, routeForRole } from '../auth/roles';
import { ThemeMode, useThemeStore, useMtTheme } from '../theme/themeStore';
import { useLanguageStore } from '../i18n/languageStore';

export default function GlobalSettingsScreen() {
  const { token, role, nombreCompleto, hydrated, loadToken, logout } = useAuthStore();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const { mode, setMode } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();

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

  return (
    <MtScreen scroll>
      <MtHeader eyebrow="CONFIGURACIÓN" title="Ajustes" subtitle="Preferencias globales y cuenta." />

      <MtCard style={{ marginBottom: 14 }}>
        <Text style={styles.cardTitle}>Cuenta</Text>
        <Text style={styles.text}>{nombreCompleto || 'Usuario autenticado'}</Text>
        <Text style={styles.muted}>Rol: {humanRole(role)}</Text>
        <MtButton title="Volver a mi panel" onPress={() => router.replace(routeForRole(role) as any)} style={{ marginTop: 14 }} />
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <Text style={styles.cardTitle}>Apariencia</Text>
        <Text style={styles.muted}>Modo visual de la app.</Text>
        <View style={styles.optionRow}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map((item) => (
            <Option key={item} label={item === 'light' ? 'Claro' : item === 'dark' ? 'Oscuro' : 'Sistema'} selected={mode === item} onPress={() => setMode(item)} />
          ))}
        </View>
      </MtCard>

      <MtCard style={{ marginBottom: 14 }}>
        <Text style={styles.cardTitle}>Idioma</Text>
        <Text style={styles.muted}>Interfaz visible en español para evitar mezcla de idiomas. La base multiidioma queda preparada internamente.</Text>
        <View style={styles.optionRow}>
          <Option label="Español" selected={language === 'es'} onPress={() => setLanguage('es')} />
        </View>
      </MtCard>

      <MtCard>
        <Text style={styles.cardTitle}>Sesión</Text>
        <Text style={styles.muted}>Cierra sesión y limpia tokens/cache local.</Text>
        <MtButton title="Cerrar sesión" variant="danger" onPress={close} style={{ marginTop: 14 }} />
      </MtCard>
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
