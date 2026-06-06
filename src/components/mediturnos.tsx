import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MediturnosTheme } from '../constants/mediturnosTheme';
import { useMtTheme } from '../theme/themeStore';
import { translateLiteral, useTranslation } from '../i18n/languageStore';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  bottomSpace?: boolean;
  style?: StyleProp<ViewStyle>;
};

function useStyles() {
  const theme = useMtTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme.mode]);
  return { theme, styles };
}

function DecorativeBackground() {
  const { theme, styles } = useStyles();
  return (
    <View pointerEvents="none" style={styles.decorRoot}>
      <View style={styles.topWash} />
      <View style={styles.topOrb} />
      <View style={styles.topCurve} />
      <View style={styles.bottomCurve} />
      <View style={styles.bottomCurveTwo} />
      <Text style={styles.watermarkMark}>M+</Text>
      <Text style={styles.decorPlusOne}>+</Text>
      <Text style={styles.decorPlusTwo}>+</Text>
      <Text style={styles.decorDot}>○</Text>
    </View>
  );
}

export function MtScreen({ children, scroll = false, padded = true, bottomSpace = true, style }: ScreenProps) {
  const { styles } = useStyles();
  const contentStyle = [padded && styles.screenPadding, bottomSpace && { paddingBottom: 116 }, style];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <DecorativeBackground />
      {scroll ? (
        <ScrollView contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function MtHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  const { styles } = useStyles();
  const { language } = useTranslation();
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {!!eyebrow && <Text style={styles.eyebrow}>{translateLiteral(eyebrow, language)}</Text>}
        <Text style={styles.headerTitle}>{translateLiteral(title, language)}</Text>
        {!!subtitle && <Text style={styles.headerSubtitle}>{translateLiteral(subtitle, language)}</Text>}
      </View>
      {right !== undefined ? right : null}
    </View>
  );
}

export function MtCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { styles } = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function MtButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { styles } = useStyles();
  const { language } = useTranslation();
  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'ghost' && styles.buttonGhost,
    variant === 'danger' && styles.buttonDanger,
    (disabled || loading) && styles.buttonDisabled,
    style,
  ];

  const textStyle = [styles.buttonText, variant === 'ghost' && styles.buttonGhostText, variant === 'danger' && styles.buttonDangerText];

  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [buttonStyle, pressed && { transform: [{ scale: 0.985 }], opacity: 0.94 }]}>
      {loading ? <ActivityIndicator color="white" /> : <Text style={textStyle} numberOfLines={2} adjustsFontSizeToFit>{translateLiteral(title, language)}</Text>}
    </Pressable>
  );
}

export function MtInput({ label, style, ...props }: TextInputProps & { label: string }) {
  const { theme, styles } = useStyles();
  const { language } = useTranslation();
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.inputLabel}>{translateLiteral(label, language)}</Text>
      <TextInput placeholderTextColor={theme.colors.soft} style={[styles.input, style]} {...props} />
    </View>
  );
}

export function MtPill({ label, tone = 'primary', selected = false, onPress }: { label: string; tone?: 'primary' | 'success' | 'warning' | 'danger' | 'muted'; selected?: boolean; onPress?: () => void }) {
  const { theme, styles } = useStyles();
  const { language } = useTranslation();
  const toneColor = tone === 'success' ? theme.colors.success : tone === 'warning' ? theme.colors.warning : tone === 'danger' ? theme.colors.danger : tone === 'muted' ? theme.colors.muted : theme.colors.primary;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.pill, selected && { backgroundColor: toneColor, borderColor: toneColor, shadowColor: toneColor, shadowOpacity: 0.18 }]}> 
      <Text style={[styles.pillText, { color: selected ? '#FFFFFF' : toneColor }]} numberOfLines={1} adjustsFontSizeToFit>{translateLiteral(label, language)}</Text>
    </Pressable>
  );
}

export function MtEmptyState({ title, subtitle, actionTitle, onAction }: { title: string; subtitle?: string; actionTitle?: string; onAction?: () => void }) {
  const { styles } = useStyles();
  const { language } = useTranslation();
  return (
    <MtCard style={styles.emptyCard}>
      <View style={styles.emptyLogoShell}>
        <Text style={styles.emptyMarkText}>M+</Text>
      </View>
      <Text style={styles.emptyTitle}>{translateLiteral(title, language)}</Text>
      {!!subtitle && <Text style={styles.emptySubtitle}>{translateLiteral(subtitle, language)}</Text>}
      {!!actionTitle && <MtButton title={actionTitle} onPress={onAction} style={{ marginTop: 14 }} />}
    </MtCard>
  );
}

export function MtLoading({ text = 'Cargando...' }: { text?: string }) {
  const { theme, styles } = useStyles();
  const { language } = useTranslation();
  return (
    <View style={styles.loadingWrap}>
      <View style={styles.loadingLogoShell}>
        <Text style={styles.loadingMarkText}>M+</Text>
      </View>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={styles.loadingText}>{translateLiteral(text, language)}</Text>
    </View>
  );
}

export function MtStat({ label, value, tone = 'primary' }: { label: string; value: string | number; tone?: 'primary' | 'success' | 'warning' | 'danger' }) {
  const { theme, styles } = useStyles();
  const { language } = useTranslation();
  const color = tone === 'success' ? theme.colors.success : tone === 'warning' ? theme.colors.warning : tone === 'danger' ? theme.colors.danger : theme.colors.primary;
  return (
    <View style={[styles.statCard, { borderColor: `${color}55` }]}> 
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{translateLiteral(label, language)}</Text>
    </View>
  );
}

export function MtBottomNav({ active }: { active: 'home' | 'perfil' | 'turnos' | 'historia' | 'solicitar' | 'profesionales' }) {
  const { theme, styles } = useStyles();
  const { t } = useTranslation();
  const icons: Record<string, string> = {
    home: '⌂',
    perfil: '◉',
    turnos: '▦',
    historia: '✦',
    solicitar: '+',
    profesionales: '⚕',
  };
  const item = (key: typeof active, label: string, path: string) => {
    const selected = active === key;
    return (
      <Pressable style={styles.navItem} onPress={() => router.replace(path as any)}>
        <View style={[styles.navIconBubble, selected && styles.navIconBubbleSelected]}>
          <Text style={[styles.navEmoji, selected && { color: '#FFFFFF' }]}>{icons[key]}</Text>
        </View>
        <Text style={[styles.navText, selected && { color: theme.colors.primary, fontWeight: '900' }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.navBar}>
      {item('home', t('nav.home'), '/paciente')}
      {item('perfil', t('nav.profile'), '/paciente/perfil')}
      <Pressable style={styles.navFab} onPress={() => router.push('/paciente/solicitar')}>
        <Text style={styles.navFabText}>+</Text>
      </Pressable>
      {item('turnos', t('nav.appointments'), '/paciente/turnos')}
      {item('historia', t('nav.history'), '/paciente/historia')}
    </View>
  );
}

export function useMtTextStyle(extra?: StyleProp<TextStyle>) {
  const { styles } = useStyles();
  return [styles.text, extra];
}

export function textStyle(extra?: StyleProp<TextStyle>) {
  return [extra];
}

function createStyles(theme: MediturnosTheme) {
  const isDark = theme.mode === 'dark';
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.bg, overflow: 'hidden' },
    fill: { flex: 1 },
    screenPadding: { paddingHorizontal: 20, paddingTop: 18 },
    decorRoot: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    topWash: {
      position: 'absolute',
      top: -150,
      left: -80,
      width: 520,
      height: 320,
      borderRadius: 260,
      backgroundColor: isDark ? 'rgba(124,58,237,0.16)' : '#F4EEFF',
      transform: [{ rotate: '-10deg' }],
    },
    topOrb: {
      position: 'absolute',
      top: -95,
      right: -115,
      width: 270,
      height: 270,
      borderRadius: 135,
      backgroundColor: isDark ? 'rgba(168,85,247,0.16)' : 'rgba(221,214,254,0.58)',
    },
    topCurve: {
      position: 'absolute',
      top: 78,
      right: -110,
      width: 360,
      height: 120,
      borderRadius: 120,
      backgroundColor: isDark ? 'rgba(196,181,253,0.06)' : 'rgba(255,255,255,0.55)',
      transform: [{ rotate: '-12deg' }],
    },
    bottomCurve: {
      position: 'absolute',
      bottom: -78,
      left: -80,
      width: 430,
      height: 170,
      borderRadius: 140,
      backgroundColor: isDark ? 'rgba(76,29,149,0.24)' : '#EFE7FF',
      transform: [{ rotate: '7deg' }],
    },
    bottomCurveTwo: {
      position: 'absolute',
      bottom: -42,
      right: -120,
      width: 390,
      height: 150,
      borderRadius: 130,
      backgroundColor: isDark ? 'rgba(124,58,237,0.16)' : 'rgba(244,238,255,0.82)',
      transform: [{ rotate: '-8deg' }],
    },
    watermarkMark: { display: 'none', opacity: 0 },
    decorPlusOne: { position: 'absolute', left: 30, bottom: 120, color: theme.colors.primary, opacity: 0.14, fontSize: 28, fontWeight: '900' },
    decorPlusTwo: { position: 'absolute', right: 36, top: 94, color: theme.colors.primary, opacity: 0.12, fontSize: 22, fontWeight: '900' },
    decorDot: { position: 'absolute', left: 55, bottom: 72, color: theme.colors.primary, opacity: 0.15, fontSize: 22, fontWeight: '900' },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 14 },
    eyebrow: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.4, marginBottom: 6, textTransform: 'uppercase' },
    headerTitle: { color: theme.colors.ink, fontSize: 31, fontWeight: '900', lineHeight: 37, letterSpacing: -0.4 },
    headerSubtitle: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, fontWeight: '600' },
    text: { color: theme.colors.ink },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 18,
      overflow: 'hidden',
      ...theme.shadow,
    },
    button: { minHeight: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 3 },
    buttonPrimary: { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
    buttonSecondary: { backgroundColor: isDark ? theme.colors.secondary : '#8B35F6', borderWidth: 1, borderColor: 'transparent', shadowColor: theme.colors.primary },
    buttonDanger: { backgroundColor: theme.mode === 'dark' ? 'rgba(248,113,113,0.14)' : '#FFF1F2', borderWidth: 1, borderColor: theme.colors.danger, shadowOpacity: 0 },
    buttonGhost: { backgroundColor: isDark ? 'rgba(255,255,255,0.075)' : '#EDE7FF', borderWidth: 1, borderColor: isDark ? theme.colors.border : 'rgba(124,58,237,0.28)', shadowColor: theme.colors.primary, shadowOpacity: isDark ? 0 : 0.10 },
    buttonDisabled: { opacity: 0.62 },
    buttonText: { color: '#FFFFFF', backgroundColor: 'transparent', fontSize: 14, fontWeight: '900', letterSpacing: 0.1, textAlign: 'center', lineHeight: 18, includeFontPadding: false },
    buttonGhostText: { color: theme.colors.primary },
    buttonDangerText: { color: theme.colors.danger },
    inputLabel: { color: theme.colors.ink, fontWeight: '900', fontSize: 13, marginLeft: 2 },
    input: {
      minHeight: 54,
      backgroundColor: isDark ? 'rgba(255,255,255,0.045)' : '#F3ECFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      color: theme.colors.ink,
      fontSize: 15,
      fontWeight: '700',
      textAlignVertical: 'center',
      includeFontPadding: false,
    },
    pill: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.75)',
      marginRight: 8,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 14,
      elevation: 2,
    },
    pillText: { fontWeight: '900', fontSize: 12, backgroundColor: 'transparent' },
    emptyCard: { alignItems: 'center', gap: 7, paddingVertical: 30 },
    emptyLogoShell: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(216,200,255,0.14)' : 'rgba(124,58,237,0.10)', borderWidth: 1, borderColor: isDark ? 'rgba(216,200,255,0.20)' : 'rgba(124,58,237,0.18)', marginBottom: 4 },
    emptyMarkText: { color: isDark ? '#D9C8FF' : theme.colors.primary, fontSize: 21, fontWeight: '900', letterSpacing: -1 },
    emptyTitle: { color: theme.colors.ink, backgroundColor: 'transparent', fontWeight: '900', fontSize: 18, lineHeight: 24, textAlign: 'center' },
    emptySubtitle: { color: theme.colors.muted, backgroundColor: 'transparent', textAlign: 'center', lineHeight: 20, fontWeight: '600' },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: theme.colors.bg, gap: 10 },
    loadingLogoShell: { width: 78, height: 78, borderRadius: 28, backgroundColor: isDark ? 'rgba(216,200,255,0.14)' : 'rgba(124,58,237,0.10)', borderWidth: 1, borderColor: isDark ? 'rgba(216,200,255,0.20)' : 'rgba(124,58,237,0.18)', alignItems: 'center', justifyContent: 'center', ...theme.shadow },
    loadingMarkText: { color: isDark ? '#D9C8FF' : theme.colors.primary, fontSize: 27, fontWeight: '900', letterSpacing: -1 },
    loadingText: { color: theme.colors.muted, marginTop: 4, fontWeight: '800' },
    statCard: { flex: 1, minWidth: 96, backgroundColor: theme.colors.surface, borderRadius: 22, borderWidth: 1, padding: 15, ...theme.shadow },
    statValue: { fontSize: 25, fontWeight: '900', letterSpacing: -0.3 },
    statLabel: { marginTop: 2, color: theme.colors.muted, fontSize: 12, fontWeight: '800' },
    navBar: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 10,
      height: 76,
      borderRadius: 30,
      backgroundColor: isDark ? 'rgba(31,20,52,0.96)' : 'rgba(255,255,255,0.94)',
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      ...theme.shadow,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: 5 },
    navIconBubble: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    navIconBubbleSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 },
    navEmoji: { fontSize: 17, color: theme.colors.soft, fontWeight: '900' },
    navText: { color: theme.colors.soft, fontSize: 10, fontWeight: '800' },
    navFab: { width: 60, height: 60, marginTop: -28, borderRadius: 30, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: theme.colors.bg, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 7 },
    navFabText: { color: '#FFFFFF', fontSize: 34, lineHeight: 36, fontWeight: '300' },
  });
}
