import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../auth/authStore';
import { MtButton, MtCard, MtInput, MtScreen } from '../components/mediturnos';
import { MediturnosTheme } from '../constants/mediturnosTheme';
import { useMtTheme } from '../theme/themeStore';
import { useTranslation } from '../i18n/languageStore';
import { debugErrorPayload, readableError } from '../utils/errors';
import { canUseDeviceAuth, getBiometricInfo, saveCurrentSessionForDeviceAuth, authenticateDevice } from '../utils/deviceAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [biometricEmail, setBiometricEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null);
  const [twoFactorDestination, setTwoFactorDestination] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const { login, loginWithDeviceAuth, verifyTwoFactor, loading } = useAuthStore();
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const { t, language } = useTranslation();

  useEffect(() => {
    let alive = true;
    getBiometricInfo().then((info) => {
      if (!alive) return;
      if (info.enabled && info.email) {
        setBiometricEmail(info.email);
        setEmail(info.email);
      } else {
        setBiometricEmail(null);
        setEmail('');
      }
      setPassword('');
    });
    return () => { alive = false; };
  }, []);

  const askBiometricSetup = async (route: string, identifier: string) => {
    if (Platform.OS === 'web') {
      router.replace(route as any);
      return;
    }

    const available = await canUseDeviceAuth();
    if (!available.ok) {
      router.replace(route as any);
      return;
    }

    Alert.alert(
      language === 'en' ? 'Enable biometric sign-in' : 'Activar ingreso con biometría',
      language === 'en' ? 'Next time you can sign in with fingerprint, face, PIN or pattern. We store your user and session, never your password.' : 'Podés entrar la próxima vez con huella, rostro, PIN o patrón. Guardamos tu usuario y la sesión, nunca tu contraseña.',
      [
        { text: language === 'en' ? 'Not now' : 'Ahora no', style: 'cancel', onPress: () => router.replace(route as any) },
        {
          text: language === 'en' ? 'Enable' : 'Activar',
          onPress: async () => {
            try {
              const auth = await authenticateDevice(language === 'en' ? 'Enable biometric sign-in' : 'Activar ingreso con biometría');
              if (auth.success) await saveCurrentSessionForDeviceAuth(identifier);
            } catch (error) {
              console.warn('No se pudo activar biometría', error);
            } finally {
              router.replace(route as any);
            }
          },
        },
      ],
    );
  };

  const handleLogin = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setDebugMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage(language === 'en' ? 'Enter email/ID and password to continue.' : 'Ingresá email/DNI y contraseña para continuar.');
      return;
    }

    try {
      const result = await login(email.trim(), password);
      if (result.requiresTwoFactor && result.usuarioId) {
        setTwoFactorUserId(result.usuarioId);
        setTwoFactorDestination(result.destination ?? null);
        setPassword('');
        setTwoFactorCode('');
        setInfoMessage(language === 'en' ? `We sent a verification code to ${result.destination ?? 'your email'}.` : `Te enviamos un código de verificación a ${result.destination ?? 'tu correo'}.`);
        return;
      }
      await askBiometricSetup(result.route, email.trim());
    } catch (error: any) {
      const message = readableError(error, language === 'en' ? 'Check your credentials and try again.' : 'Revisá tus credenciales e intentá nuevamente.');
      const debug = debugErrorPayload(error);
      console.error('LOGIN_REAL_ERROR', debug);
      setErrorMessage(message);
      setDebugMessage(`${debug.method ?? 'POST'} ${debug.url ?? '/api/auth/login'}${debug.status ? ` · HTTP ${debug.status}` : ''}`);
    }
  };

  const handleVerifyTwoFactor = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    if (!twoFactorUserId || !twoFactorCode.trim()) {
      setErrorMessage(language === 'en' ? 'Enter the verification code.' : 'Ingresá el código de verificación.');
      return;
    }
    try {
      const result = await verifyTwoFactor(twoFactorUserId, twoFactorCode.trim());
      router.replace(result.route as any);
    } catch (error: any) {
      setErrorMessage(readableError(error, language === 'en' ? 'Invalid or expired code.' : 'Código inválido o vencido.'));
    }
  };

  const handleBiometricLogin = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setDebugMessage(null);
    try {
      const result = await loginWithDeviceAuth();
      router.replace(result.route as any);
    } catch (error: any) {
      setErrorMessage(readableError(error, language === 'en' ? 'We could not sign in with your device method. Sign in with password once more.' : 'No pudimos ingresar con el método del dispositivo. Ingresá con contraseña una vez más.'));
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
          <Text style={styles.helper}>{language === 'en' ? 'Sign in with your email or ID. Your password is never prefilled.' : 'Ingresá con tu email o DNI. La contraseña nunca queda precargada.'}</Text>

          <View style={styles.form}>
            <MtInput
              label={t('login.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={language === 'en' ? 'your@email.com or ID' : 'tu@email.com o DNI'}
            />
            {!twoFactorUserId ? (
              <MtInput
                label={t('login.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />
            ) : (
              <MtInput
                label={language === 'en' ? 'Verification code' : 'Código de verificación'}
                value={twoFactorCode}
                onChangeText={setTwoFactorCode}
                keyboardType="number-pad"
                placeholder="123456"
              />
            )}
          </View>

          {!!biometricEmail && (
            <Text style={styles.biometricHint}>{language === 'en' ? 'Device sign-in enabled for' : 'Biometría activada para'} {biometricEmail}. {language === 'en' ? 'Your password is never shown or stored as text.' : 'Tu clave no se muestra ni se guarda como texto.'}</Text>
          )}

          {infoMessage ? (
            <View style={[styles.errorBox, { borderColor: theme.colors.success, backgroundColor: theme.mode === 'dark' ? '#063D35' : '#ECFDF5' }]}>
              <Text style={[styles.errorTitle, { color: theme.colors.success }]}>{language === 'en' ? 'Verification required' : 'Verificación requerida'}</Text>
              <Text style={styles.errorText}>{infoMessage}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>{language === 'en' ? 'We could not sign in' : 'No pudimos iniciar sesión'}</Text>
              <Text style={styles.errorText}>
                {debugMessage?.includes('HTTP 400') || debugMessage?.includes('HTTP 401')
                  ? t('login.errorInvalid')
                  : errorMessage}
              </Text>
            </View>
          ) : null}

          <MtButton title={twoFactorUserId ? (language === 'en' ? 'Validate code' : 'Validar código') : t('login.submit')} onPress={twoFactorUserId ? handleVerifyTwoFactor : handleLogin} loading={loading} style={{ marginTop: 18 }} />
          {!!twoFactorUserId && (
            <MtButton title={language === 'en' ? 'Use another account' : 'Usar otra cuenta'} variant="ghost" onPress={() => { setTwoFactorUserId(null); setTwoFactorDestination(null); setTwoFactorCode(''); setErrorMessage(null); setInfoMessage(null); }} style={{ marginTop: 8 }} />
          )}
          <Pressable style={styles.biometricButton} onPress={handleBiometricLogin} disabled={loading}>
            <Text style={styles.biometricIcon}>☝️</Text>
            <Text style={styles.biometricText}>{t('login.biometric')}</Text>
          </Pressable>
          <MtButton title={t('login.createAccount')} variant="ghost" onPress={() => router.push('/registro')} style={{ marginTop: 10 }} />
          <Text style={styles.forgot} onPress={() => router.push('/forgot-password')}>{t('login.forgot')}</Text>
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
    biometricHint: { color: theme.colors.muted, fontWeight: '700', fontSize: 12, lineHeight: 18, marginTop: 12 },
    biometricButton: {
      marginTop: 10,
      minHeight: 52,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      flexDirection: 'row',
      gap: 8,
    },
    biometricIcon: { fontSize: 18 },
    biometricText: { color: theme.colors.primaryDark, fontSize: 15, fontWeight: '900' },
    errorBox: { borderWidth: 1, borderColor: theme.colors.danger, backgroundColor: theme.mode === 'dark' ? '#2B1113' : '#FFF1F2', borderRadius: 16, padding: 12, marginTop: 16 },
    errorTitle: { color: theme.colors.danger, fontWeight: '900', marginBottom: 4 },
    errorText: { color: theme.colors.ink, fontWeight: '700', lineHeight: 20 },
  });
}
