import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../auth/authStore';
import { useTranslation } from '../i18n/languageStore';
import { readableError } from '../utils/errors';
import { authenticateDevice, canUseDeviceAuth, getBiometricInfo, saveCurrentSessionForDeviceAuth, } from '../utils/deviceAuth';
import { DEMO_MODE, DEMO_PASSWORD, DEMO_USERS } from '../demo/demoApi';
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
type FocusedField = 'identifier' | 'password' | 'twoFactor' | null;
type LoginCardProps = Readonly<{
    identifier: string;
    setIdentifier: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    showPassword: boolean;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    focused: FocusedField;
    setFocused: (value: FocusedField) => void;
    twoFactorUserId: string | null;
    twoFactorCode: string;
    setTwoFactorCode: (value: string) => void;
    twoFactorDestination: string | null;
    infoMessage: string | null;
    errorMessage: string | null;
    invalidCredentials: boolean;
    biometricEmail: string | null;
    loading: boolean;
    submit: () => void;
    biometricLogin: () => void;
    resetTwoFactor: () => void;
}>;
type LoginFieldsProps = Pick<LoginCardProps, 'identifier' | 'setIdentifier' | 'focused' | 'setFocused' | 'twoFactorUserId' | 'password' | 'setPassword' | 'showPassword' | 'setShowPassword' | 'twoFactorCode' | 'setTwoFactorCode'>;
type PasswordFieldProps = Pick<LoginCardProps, 'password' | 'setPassword' | 'showPassword' | 'setShowPassword' | 'focused' | 'setFocused'>;
type TwoFactorFieldProps = Pick<LoginCardProps, 'twoFactorCode' | 'setTwoFactorCode' | 'focused' | 'setFocused'>;
type LoginMessagesProps = Pick<LoginCardProps, 'errorMessage' | 'invalidCredentials' | 'infoMessage' | 'twoFactorDestination' | 'identifier'>;
type LoginActionsProps = Pick<LoginCardProps, 'biometricEmail' | 'twoFactorUserId' | 'loading' | 'submit' | 'resetTwoFactor' | 'biometricLogin'>;
type LoginDialog = { title: string; message: string } | null;

function LoginFields(props: LoginFieldsProps) {
    const { t } = useTranslation();
    return <View style={styles.formBlock}>
    <Text style={styles.label}>{t('login.email')}</Text>
    <View style={[styles.inputShell, props.focused === 'identifier' && styles.inputShellFocused]}><TextInput value={props.identifier} onChangeText={props.setIdentifier} onFocus={() => props.setFocused('identifier')} onBlur={() => props.setFocused(null)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder={t('login.emailPlaceholder')} placeholderTextColor={palette.softMuted} underlineColorAndroid="transparent" selectionColor={palette.purple} style={styles.input}/></View>
    {props.twoFactorUserId ? <TwoFactorField {...props}/> : <PasswordField {...props}/>}
  </View>;
}
function PasswordField(props: PasswordFieldProps) {
    const { t } = useTranslation();
    return <><Text style={styles.label}>{t('login.password')}</Text><View style={[styles.inputShell, props.focused === 'password' && styles.inputShellFocused]}>
    <TextInput value={props.password} onChangeText={props.setPassword} onFocus={() => props.setFocused('password')} onBlur={() => props.setFocused(null)} secureTextEntry={!props.showPassword} placeholder={t('login.password')} placeholderTextColor={palette.softMuted} underlineColorAndroid="transparent" selectionColor={palette.purple} style={styles.input}/>
    <Pressable hitSlop={10} onPress={() => props.setShowPassword((value) => !value)} style={styles.eyeButton}><Ionicons name={props.showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color={palette.purpleDeep}/></Pressable>
  </View></>;
}
function TwoFactorField(props: TwoFactorFieldProps) {
    const { t } = useTranslation();
    return <><Text style={styles.label}>{t('login.verificationCode')}</Text><View style={[styles.inputShell, props.focused === 'twoFactor' && styles.inputShellFocused]}><TextInput value={props.twoFactorCode} onChangeText={props.setTwoFactorCode} onFocus={() => props.setFocused('twoFactor')} onBlur={() => props.setFocused(null)} keyboardType="number-pad" placeholder="123456" placeholderTextColor={palette.softMuted} underlineColorAndroid="transparent" selectionColor={palette.purple} style={styles.input}/></View></>;
}
function LoginMessages(props: LoginMessagesProps) {
    const { t } = useTranslation();
    const needsVerification = Boolean(props.errorMessage && /verific/i.test(props.errorMessage));
    let displayedError = props.errorMessage;
    if (!needsVerification) {
      displayedError = props.invalidCredentials ? t('login.errorInvalid') : props.errorMessage;
    }
    return <>
    {props.infoMessage ? <View style={[styles.messageBox, styles.infoBox]}><Text style={[styles.messageTitle, styles.infoTitle]}>{t('login.verificationRequired')}</Text><Text style={styles.messageText}>{props.infoMessage}</Text>{props.twoFactorDestination ? <Text style={styles.messageFoot}>{props.twoFactorDestination}</Text> : null}</View> : null}
    {props.errorMessage ? <View style={[styles.messageBox, styles.errorBox]}><Text style={[styles.messageTitle, styles.errorTitle]}>{t('login.signInErrorTitle')}</Text><Text style={styles.messageText}>{displayedError}</Text>{needsVerification ? <Pressable style={styles.verifyAccountButton} onPress={() => router.push({ pathname: '/registro/verificar', params: { email: props.identifier.trim() } })}><Text style={styles.verifyAccountText}>Ingresar código de verificación</Text></Pressable> : null}</View> : null}
  </>;
}
function LoginActions(props: LoginActionsProps) {
    const { t } = useTranslation();
    const twoFactor = Boolean(props.twoFactorUserId);
    return <>
    {props.biometricEmail && !twoFactor ? <Text style={styles.secureHint}>{t('login.secureEnabledFor')} {props.biometricEmail}.</Text> : null}
    <Pressable disabled={props.loading} style={[styles.primaryButton, props.loading && styles.disabledButton]} onPress={props.submit}><Text style={styles.primaryText}>{twoFactor ? t('login.validateCode') : t('login.submit')}</Text><Ionicons name="arrow-forward" size={30} color="#FFFFFF" style={styles.arrowIcon}/></Pressable>
    {twoFactor ? <Pressable style={styles.biometricButton} onPress={props.resetTwoFactor}><Text style={styles.biometricText}>{t('login.useAnotherAccount')}</Text></Pressable> : <Pressable disabled={props.loading} style={[styles.biometricButton, props.loading && styles.disabledButton]} onPress={props.biometricLogin}><Ionicons name="finger-print-outline" size={22} color={palette.purpleDark}/><Text style={styles.biometricText}>{t('login.biometric')}</Text></Pressable>}
    <Pressable style={styles.secondaryButton} onPress={() => router.push('/registro')}><Text style={styles.secondaryText}>{t('login.createAccount')}</Text></Pressable>
  </>;
}
function LoginCard(props: LoginCardProps) {
    const { t } = useTranslation();
    return <View style={styles.card}><Text style={styles.title}>{t('login.title')}</Text><Text style={styles.subtitle}>{t('login.welcome')}</Text><LoginFields {...props}/>
    <Pressable style={styles.forgotButton} onPress={() => router.push('/forgot-password')}><Text style={styles.forgotText}>{t('login.forgot')}</Text></Pressable>
    <LoginMessages {...props}/><LoginActions {...props}/>
  </View>;
}
function LoginErrorDialog({ dialog, onClose }: Readonly<{ dialog: LoginDialog; onClose: () => void }>) {
    return <Modal visible={Boolean(dialog)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>{dialog?.title}</Text>
          <Text style={styles.dialogMessage}>{dialog?.message}</Text>
          <Pressable style={styles.dialogButton} onPress={onClose}>
            <Text style={styles.dialogButtonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>;
}
export default function LoginScreen() {
    const params = useLocalSearchParams<{ sessionExpired?: string }>();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState<FocusedField>(null);
    const [biometricEmail, setBiometricEmail] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialog, setErrorDialog] = useState<LoginDialog>(null);
    const [invalidCredentials, setInvalidCredentials] = useState(false);
    const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null);
    const [twoFactorDestination, setTwoFactorDestination] = useState<string | null>(null);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const { login, loginWithDeviceAuth, verifyTwoFactor, loading } = useAuthStore();
    const { t } = useTranslation();
    useEffect(() => {
        if (params.sessionExpired === '1') {
            Alert.alert('Vuelva a iniciar sesión', 'Tu sesión venció o no es válida.', [{ text: 'OK' }]);
        }
    }, [params.sessionExpired]);
    useEffect(() => {
        let alive = true;
        getBiometricInfo().then((info) => {
            if (!alive)
                return;
            if (info.enabled && info.email) {
                setBiometricEmail(info.email);
                setIdentifier(info.email);
            }
            else {
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
            router.replace(route);
            return;
        }
        const available = await canUseDeviceAuth();
        if (!available.ok) {
            router.replace(route);
            return;
        }
        Alert.alert(t('login.enableSecureTitle'), t('login.enableSecureText'), [
            {
                text: t('login.notNow'),
                style: 'cancel',
                onPress: () => router.replace(route),
            },
            {
                text: t('login.enable'),
                onPress: async () => {
                    try {
                        const auth = await authenticateDevice(t('login.enableSecureAction'));
                        if (auth.success)
                            await saveCurrentSessionForDeviceAuth(userIdentifier);
                    }
                    catch {
                        // El ingreso normal sigue disponible si el dispositivo rechaza la biometría.
                    }
                    finally {
                        router.replace(route);
                    }
                },
            },
        ]);
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
                setInfoMessage(t('login.codeSent', { destination: result.destination ?? t('login.yourEmail') }));
                return;
            }
            await askBiometricSetup(result.route, identifier.trim());
        }
        catch (error: unknown) {
            const message = readableError(error, t('login.checkCredentials'));
            const status = Number((error as { response?: { status?: unknown } })?.response?.status);
            const accountNeedsVerification = /verific/i.test(message);
            if (accountNeedsVerification) {
                setErrorMessage(message);
                return;
            }
            const invalid = status === 400 || status === 401;
            setInvalidCredentials(invalid);
            const dialogMessage = invalid ? 'Revise su correo/DNI o contraseña.' : message;
            setErrorMessage(dialogMessage);
            setErrorDialog({ title: 'Error', message: dialogMessage });
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
            router.replace(result.route);
        }
        catch (error: unknown) {
            Alert.alert(t('login.signInErrorTitle'), readableError(error, t('login.invalidCode')), [{ text: 'OK' }]);
        }
    };
    const handleBiometricLogin = async () => {
        setErrorMessage(null);
        setInfoMessage(null);
        setInvalidCredentials(false);
        try {
            const result = await loginWithDeviceAuth();
            router.replace(result.route);
        }
        catch (error: unknown) {
            Alert.alert(t('login.signInErrorTitle'), readableError(error, t('login.deviceLoginError')), [{ text: 'OK' }]);
        }
    };
    const resetTwoFactor = () => { setTwoFactorUserId(null); setTwoFactorDestination(null); setTwoFactorCode(''); setErrorMessage(null); setInfoMessage(null); };
    return (<View style={styles.page}>
      <View style={styles.topGlow}/><View style={styles.topWave}/><View style={styles.bottomWave}/><View style={styles.bottomWaveTwo}/>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoWrap}><Image source={logo} resizeMode="contain" style={styles.logo}/></View>
          {DEMO_MODE ? <View style={styles.demoPanel}>
            <View style={styles.demoHeading}><View><Text style={styles.demoEyebrow}>ENTORNO DEMOSTRATIVO</Text><Text style={styles.demoTitle}>Elegí cómo recorrer Mediturnos</Text></View><Text style={styles.demoBadge}>SIN DATOS REALES</Text></View>
            <Text style={styles.demoText}>Seleccioná un perfil y después tocá “Ingresar”. La contraseña ya queda cargada.</Text>
            <View style={styles.demoRoles}>{DEMO_USERS.map((user) => <Pressable key={user.role} onPress={() => { setIdentifier(user.email); setPassword(DEMO_PASSWORD); setErrorMessage(null); }} style={[styles.demoRole, identifier === user.email && styles.demoRoleActive]}><Text style={styles.demoRoleIcon}>{user.role === 'ADMIN' ? '⚙️' : user.role === 'SECRETARY' ? '🗓️' : user.role === 'PROFESSIONAL' ? '🩺' : '👤'}</Text><Text style={[styles.demoRoleText, identifier === user.email && styles.demoRoleTextActive]}>{user.role === 'ADMIN' ? 'Administración' : user.role === 'SECRETARY' ? 'Secretaría' : user.role === 'PROFESSIONAL' ? 'Profesional' : 'Paciente'}</Text></Pressable>)}</View>
          </View> : null}
          <LoginCard identifier={identifier} setIdentifier={setIdentifier} password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} focused={focused} setFocused={setFocused} biometricEmail={biometricEmail} errorMessage={errorMessage} invalidCredentials={invalidCredentials} twoFactorUserId={twoFactorUserId} twoFactorDestination={twoFactorDestination} twoFactorCode={twoFactorCode} setTwoFactorCode={setTwoFactorCode} infoMessage={infoMessage} loading={loading} submit={twoFactorUserId ? handleVerifyTwoFactor : handleLogin} biometricLogin={handleBiometricLogin} resetTwoFactor={resetTwoFactor}/>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoginErrorDialog dialog={errorDialog} onClose={() => setErrorDialog(null)} />
    </View>);
}
const styles = StyleSheet.create({
    demoPanel: { width: '100%', maxWidth: 760, backgroundColor: '#24104F', borderRadius: 24, padding: 20, marginBottom: 18 },
    demoHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
    demoEyebrow: { color: '#C4B5FD', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
    demoTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 5 },
    demoBadge: { color: '#24104F', backgroundColor: '#DDD6FE', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: '900' },
    demoText: { color: '#D8D0EB', fontSize: 13, lineHeight: 19, marginTop: 11 },
    demoRoles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    demoRole: { flexGrow: 1, minWidth: 130, borderWidth: 1, borderColor: '#65528C', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
    demoRoleActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
    demoRoleIcon: { fontSize: 17 },
    demoRoleText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
    demoRoleTextActive: { color: '#24104F' },
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
        shadowOpacity: 0.3,
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
    dialogBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(36, 16, 79, 0.48)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    dialogCard: {
        width: '100%',
        maxWidth: 390,
        borderRadius: 24,
        backgroundColor: palette.white,
        borderWidth: 1,
        borderColor: palette.purpleBorder,
        padding: 22,
        shadowColor: palette.purpleDeep,
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    dialogTitle: {
        color: palette.danger,
        fontSize: 21,
        fontWeight: '900',
        marginBottom: 8,
    },
    dialogMessage: {
        color: palette.ink,
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 23,
    },
    dialogButton: {
        height: 52,
        borderRadius: 18,
        backgroundColor: palette.purple,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
    },
    dialogButtonText: {
        color: palette.white,
        fontSize: 16,
        fontWeight: '900',
    },
});
