import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../auth/authStore';
import { MtButton, MtCard, MtInput, MtScreen } from '../components/mediturnos';
import { MediturnosTheme } from '../constants/mediturnosTheme';
import { useMtTheme } from '../theme/themeStore';
import { useTranslation } from '../i18n/languageStore';
import { debugErrorPayload, readableError } from '../utils/errors';

export default function LoginScreen() {
  const [email, setEmail] = useState('paciente@mediturnos.local');
  const [password, setPassword] = useState('Paciente1234');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const { login, loading } = useAuthStore();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const { t } = useTranslation();

  const handleLogin = async () => {
    setErrorMessage(null);
    setDebugMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Ingresá email y contraseña para continuar.');
      return;
    }

    try {
      const result = await login(email.trim(), password);
      router.replace(result.route as any);
    } catch (error: any) {
      const message = readableError(error, 'Revisá tus credenciales o el estado del backend.');
      const debug = debugErrorPayload(error);
      console.error('LOGIN_REAL_ERROR', debug);
      setErrorMessage(message);
      setDebugMessage(`${debug.method ?? 'POST'} ${debug.url ?? '/api/auth/login'}${debug.status ? ` · HTTP ${debug.status}` : ''}`);
      if (Platform.OS !== 'web') {
        Alert.alert('No pudimos iniciar sesión', message);
      }
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

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>No pudimos iniciar sesión</Text>
              <Text style={styles.errorText}>
                {debugMessage?.includes('HTTP 400') || debugMessage?.includes('HTTP 401')
                  ? 'El usuario o la contraseña no son correctos. Revisá los datos e intentá nuevamente.'
                  : errorMessage}
              </Text>
            </View>
          ) : null}

          <MtButton title={t('login.submit')} onPress={handleLogin} loading={loading} style={{ marginTop: 18 }} />
          <MtButton title={t('login.createAccount')} variant="ghost" onPress={() => router.push('/registro')} style={{ marginTop: 10 }} />
          <Text style={styles.forgot} onPress={() => router.push('/forgot-password')}>{t('login.forgot')}</Text>
        </MtCard>

        <MtCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('login.seedTitle')}</Text>
          <Text style={styles.infoText}>{t('login.seedText')}</Text>
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
    errorBox: { borderWidth: 1, borderColor: theme.colors.danger, backgroundColor: theme.mode === 'dark' ? '#2B1113' : '#FFF1F2', borderRadius: 16, padding: 12, marginTop: 16 },
    errorTitle: { color: theme.colors.danger, fontWeight: '900', marginBottom: 4 },
    errorText: { color: theme.colors.ink, fontWeight: '700', lineHeight: 20 },
    errorDebug: { color: theme.colors.muted, marginTop: 6, fontSize: 12, fontWeight: '800' },
    infoCard: { marginTop: 16, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
    infoTitle: { color: theme.colors.primaryDark, fontWeight: '900', fontSize: 15 },
    infoText: { color: theme.colors.primaryDark, lineHeight: 20, marginTop: 4, fontSize: 13 },
  });
}
