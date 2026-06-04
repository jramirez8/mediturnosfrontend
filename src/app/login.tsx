import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../auth/authStore';
import { MtButton, MtCard, MtInput, MtScreen } from '../components/mediturnos';
import { MediturnosTheme } from '../constants/mediturnosTheme';
import { useMtTheme } from '../theme/themeStore';
import { useTranslation } from '../i18n/languageStore';
import { readableError } from '../utils/errors';

export default function LoginScreen() {
  const [email, setEmail] = useState('admin@mediturnos.local');
  const [password, setPassword] = useState('Admin1234');
  const { login, loading } = useAuthStore();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Datos incompletos', 'Ingresá email y contraseña para continuar.');
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace('/paciente');
    } catch (error: any) {
      Alert.alert('No pudimos iniciar sesión', readableError(error, 'Revisá tus credenciales o el estado del backend.'));
    }
  };

  return (
    <MtScreen scroll bottomSpace={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.brand}>Mediturnos</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        <MtCard style={styles.loginCard}>
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.helper}>{t('login.helper')}</Text>

          <View style={styles.form}>
            <MtInput
              label={t('login.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="tu@email.com"
            />
            <MtInput
              label={t('login.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
          </View>

          <MtButton title={t('login.submit')} onPress={handleLogin} loading={loading} style={{ marginTop: 18 }} />
          <MtButton title={t('login.createAccount')} variant="ghost" onPress={() => router.push('/registro')} style={{ marginTop: 10 }} />
          <Text style={styles.forgot} onPress={() => router.push('/forgot-password')}>{t('login.forgot')}</Text>
        </MtCard>

        <MtCard style={styles.demoCard}>
          <Text style={styles.demoTitle}>{t('login.demoTitle')}</Text>
          <Text style={styles.demoText}>{t('login.demoText')}</Text>
        </MtCard>
      </KeyboardAvoidingView>
    </MtScreen>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    hero: { alignItems: 'center', paddingTop: 12, paddingBottom: 22 },
    logoCircle: {
      width: 78,
      height: 78,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      ...theme.shadow,
    },
    logoText: { color: theme.mode === 'dark' ? '#06201D' : 'white', fontSize: 38, fontWeight: '900' },
    brand: { color: theme.colors.ink, fontSize: 36, fontWeight: '900', letterSpacing: -1 },
    subtitle: { color: theme.colors.muted, fontSize: 15, marginTop: 6, textAlign: 'center' },
    loginCard: { padding: 22 },
    title: { color: theme.colors.ink, fontSize: 24, fontWeight: '900' },
    helper: { color: theme.colors.muted, marginTop: 6, lineHeight: 20 },
    form: { gap: 14, marginTop: 20 },
    forgot: { color: theme.colors.primary, fontWeight: '800', textAlign: 'center', marginTop: 18 },
    demoCard: { marginTop: 16, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
    demoTitle: { color: theme.colors.primaryDark, fontWeight: '900', fontSize: 15 },
    demoText: { color: theme.colors.primaryDark, lineHeight: 20, marginTop: 4, fontSize: 13 },
  });
}
