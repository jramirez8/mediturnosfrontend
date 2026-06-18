import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../auth/authStore';
import { useTranslation } from '../i18n/languageStore';
import { readableError } from '../utils/errors';
import {
  authenticateDevice,
  canUseDeviceAuth,
  getBiometricInfo,
  saveCurrentSessionForDeviceAuth,
} from '../utils/deviceAuth';

const logo = require('../../assets/images/mediturnos-login-logo-transparent.png');

const palette = {
  ink: '#24104F',
  muted: '#7F7897',
  softMuted: '#A19BB6',
  purple: '#7C3AED',
  purpleDark: '#5B21B6',
  purpleDeep: '#4C1D95',
  purpleSoft: '#F3ECFF',
  purpleBorder: '#D8CBF6',
  white: '#FFFFFF',
  danger: '#DC2626',
  dangerBg: '#FFF1F2',
  success: '#16A34A',
  successBg: '#F3EEFF',
};

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'identifier' | 'password' | 'twoFactor' | null>(null);
  const [biometricEmail, setBiometricEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null);
  const [twoFactorDestination, setTwoFactorDestination] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const { login, loginWithDeviceAuth, verifyTwoFactor, loading } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    let alive = true;

    getBiometricInfo().then((info) => {
      if (!alive) return;

      if (info.enabled && info.email) {
        setBiometricEmail(info.email);
        setIdentifier(info.email);
      } else {
        setBiometricEmail(null);
        setIdentifier('');
      }

      setPassword('');
    });

    return () => {
      alive = false;
    };
  }, []);

  const askBiometricSetup = async (route: string, userIdentifier: string) => {
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
      t('login.enableSecureTitle'),
      t('login.enableSecureText'),
      [
        {
          text: t('login.notNow'),
          style: 'cancel',
          onPress: () => router.replace(route as any),
        },
        {
          text: t('login.enable'),
          onPress: async () => {
            try {
              const auth = await authenticateDevice(t('login.enableSecureAction'));
              if (auth.success) await saveCurrentSessionForDeviceAuth(userIdentifier);
            } catch {
              // El ingreso normal sigue disponible si el dispositivo rechaza la biometría.
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
    setInvalidCredentials(false);

    if (!identifier.trim() || !password) {
      setErrorMessage(t('login.requiredFields'));
      return;
    }

    try {
      const result = await login(identifier.trim(), password);
      if (result.requiresTwoFactor && result.usuarioId) {
        setTwoFactorUserId(result.usuarioId);
        setTwoFactorDestination(result.destination ?? null);
        setPassword('');
        setTwoFactorCode('');
        setInfoMessage(
          t('login.codeSent', { destination: result.destination ?? t('login.yourEmail') }),
        );
        return;
      }

      await askBiometricSetup(result.route, identifier.trim());
    } catch (error: any) {
      const message = readableError(error, t('login.checkCredentials'));
      const status = Number(error?.response?.status);
      setInvalidCredentials(status === 400 || status === 401);
      setErrorMessage(message);
    }
  };

  const handleVerifyTwoFactor = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!twoFactorUserId || !twoFactorCode.trim()) {
      setErrorMessage(t('login.enterCode'));
      return;
    }

    try {
      const result = await verifyTwoFactor(twoFactorUserId, twoFactorCode.trim());
      router.replace(result.route as any);
    } catch (error: any) {
      setErrorMessage(readableError(error, t('login.invalidCode')));
    }
  };

  const handleBiometricLogin = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setInvalidCredentials(false);

    try {
      const result = await loginWithDeviceAuth();
      router.replace(result.route as any);
    } catch (error: any) {
      setErrorMessage(
        readableError(
          error,
          t('login.deviceLoginError'),
        ),
      );
    }
  };

  const needsAccountVerification = !!errorMessage && /verific/i.test(errorMessage);

  return (
    <View style={styles.page}>
      <View style={styles.topGlow} />
      <View style={styles.topWave} />
      <View style={styles.bottomWave} />
      <View style={styles.bottomWaveTwo} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.logoWrap}>
            <Image source={logo} resizeMode="contain" style={styles.logo} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.welcome')}</Text>

            <View style={styles.formBlock}>
              <Text style={styles.label}>{t('login.email')}</Text>
              <View style={[styles.inputShell, focused === 'identifier' && styles.inputShellFocused]}>
                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  onFocus={() => setFocused('identifier')}
                  onBlur={() => setFocused(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder={t('login.emailPlaceholder')}
                  placeholderTextColor={palette.softMuted}
                  underlineColorAndroid="transparent"
                  selectionColor={palette.purple}
                  style={styles.input}
                />
              </View>

              {!twoFactorUserId ? (
                <>
                  <Text style={styles.label}>{t('login.password')}</Text>
                  <View style={[styles.inputShell, focused === 'password' && styles.inputShellFocused]}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      secureTextEntry={!showPassword}
                      placeholder={t('login.password')}
                      placeholderTextColor={palette.softMuted}
                      underlineColorAndroid="transparent"
                      selectionColor={palette.purple}
                      style={styles.input}
                    />
                    <Pressable hitSlop={10} onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color={palette.purpleDeep} />
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.label}>{t('login.verificationCode')}</Text>
                  <View style={[styles.inputShell, focused === 'twoFactor' && styles.inputShellFocused]}>
                    <TextInput
                      value={twoFactorCode}
                      onChangeText={setTwoFactorCode}
                      onFocus={() => setFocused('twoFactor')}
                      onBlur={() => setFocused(null)}
                      keyboardType="number-pad"
                      placeholder="123456"
                      placeholderTextColor={palette.softMuted}
                      underlineColorAndroid="transparent"
                      selectionColor={palette.purple}
                      style={styles.input}
                    />
                  </View>
                </>
              )}
            </View>

            <Pressable style={styles.forgotButton} onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotText}>{t('login.forgot')}</Text>
            </Pressable>

            {infoMessage ? (
              <View style={[styles.messageBox, styles.infoBox]}>
                <Text style={[styles.messageTitle, styles.infoTitle]}>{t('login.verificationRequired')}</Text>
                <Text style={styles.messageText}>{infoMessage}</Text>
                {twoFactorDestination ? <Text style={styles.messageFoot}>{twoFactorDestination}</Text> : null}
              </View>
            ) : null}

            {errorMessage ? (
              <View style={[styles.messageBox, styles.errorBox]}>
                <Text style={[styles.messageTitle, styles.errorTitle]}>{t('login.signInErrorTitle')}</Text>
                <Text style={styles.messageText}>{needsAccountVerification ? errorMessage : invalidCredentials ? t('login.errorInvalid') : errorMessage}</Text>
                {needsAccountVerification ? (
                  <Pressable
                    style={styles.verifyAccountButton}
                    onPress={() => router.push({ pathname: '/registro/verificar', params: { email: identifier.trim() } })}
                  >
                    <Text style={styles.verifyAccountText}>Ingresar código de verificación</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {!!biometricEmail && !twoFactorUserId ? (
              <Text style={styles.secureHint}>
                {t('login.secureEnabledFor')} {biometricEmail}.
              </Text>
            ) : null}

            <Pressable
              disabled={loading}
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={twoFactorUserId ? handleVerifyTwoFactor : handleLogin}
            >
              <Text style={styles.primaryText}>{twoFactorUserId ? (t('login.validateCode')) : t('login.submit')}</Text>
              <Ionicons name="arrow-forward" size={30} color="#FFFFFF" style={styles.arrowIcon} />
            </Pressable>

            {!twoFactorUserId ? (
              <Pressable disabled={loading} style={[styles.biometricButton, loading && styles.disabledButton]} onPress={handleBiometricLogin}>
                <Ionicons name="finger-print-outline" size={22} color={palette.purpleDark} />
                <Text style={styles.biometricText}>{t('login.biometric')}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.biometricButton}
                onPress={() => {
                  setTwoFactorUserId(null);
                  setTwoFactorDestination(null);
                  setTwoFactorCode('');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
              >
                <Text style={styles.biometricText}>{t('login.useAnotherAccount')}</Text>
              </Pressable>
            )}

            <Pressable style={styles.secondaryButton} onPress={() => router.push('/registro')}>
              <Text style={styles.secondaryText}>{t('login.createAccount')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: '#FFFEFF',
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: -160,
    right: -135,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: '#EFE5FF',
    opacity: 0.9,
  },
  topWave: {
    position: 'absolute',
    top: -125,
    left: -90,
    width: 620,
    height: 294,
    borderBottomLeftRadius: 260,
    borderBottomRightRadius: 420,
    backgroundColor: '#F7F1FF',
    transform: [{ rotate: '-8deg' }],
  },
  bottomWave: {
    position: 'absolute',
    bottom: -132,
    left: -130,
    width: 640,
    height: 210,
    borderTopLeftRadius: 320,
    borderTopRightRadius: 260,
    backgroundColor: '#F2EAFE',
    transform: [{ rotate: '4deg' }],
  },
  bottomWaveTwo: {
    position: 'absolute',
    bottom: -160,
    right: -185,
    width: 520,
    height: 210,
    borderTopLeftRadius: 300,
    borderTopRightRadius: 260,
    backgroundColor: '#EBDDFF',
    opacity: 0.62,
    transform: [{ rotate: '-8deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: Platform.OS === 'web' ? 26 : 46,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  logoWrap: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 332,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 258,
    height: 78,
  },
  card: {
    width: '100%',
    maxWidth: 470,
    alignSelf: 'center',
  },
  title: {
    color: palette.ink,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: 0,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 22,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 24,
  },
  formBlock: {
    gap: 9,
  },
  label: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
    marginLeft: 2,
  },
  inputShell: {
    height: 60,
    borderRadius: 18,
    borderWidth: 1.3,
    borderColor: palette.purpleBorder,
    backgroundColor: '#F7F2FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 10,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  inputShellFocused: {
    borderColor: palette.purple,
    backgroundColor: '#F7F2FF',
    shadowOpacity: 0.16,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    color: palette.ink,
    fontSize: 20,
    fontWeight: '600',
    paddingVertical: 0,
    paddingHorizontal: 0,
    outlineStyle: 'none' as any,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  eyeButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 17,
    paddingVertical: 5,
  },
  forgotText: {
    color: palette.purpleDeep,
    fontSize: 17,
    fontWeight: '800',
  },
  messageBox: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorBox: {
    borderColor: '#FDA4AF',
    backgroundColor: palette.dangerBg,
  },
  infoBox: {
    borderColor: '#86EFAC',
    backgroundColor: palette.successBg,
  },
  messageTitle: {
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 5,
  },
  errorTitle: {
    color: palette.danger,
  },
  infoTitle: {
    color: palette.success,
  },
  messageText: {
    color: palette.ink,
    fontWeight: '600',
    lineHeight: 20,
  },
  messageFoot: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  verifyAccountButton: {
    backgroundColor: palette.purple,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  verifyAccountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  secureHint: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: -2,
    marginBottom: 12,
  },
  primaryButton: {
    height: 62,
    borderRadius: 20,
    backgroundColor: palette.purple,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 26,
    shadowColor: palette.purple,
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 7,
  },
  primaryText: {
    color: palette.white,
    backgroundColor: 'transparent',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.25,
  },
  arrowIcon: {
    position: 'absolute',
    right: 28,
  },
  biometricButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: palette.purpleBorder,
    backgroundColor: '#F7F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 14,
  },
  biometricText: {
    color: palette.purpleDark,
    backgroundColor: 'transparent',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryButton: {
    height: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.purple,
    backgroundColor: '#F7F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  secondaryText: {
    color: palette.purpleDeep,
    backgroundColor: 'transparent',
    fontSize: 19,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.62,
  },
});
