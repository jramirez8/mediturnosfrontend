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

export function MtScreen({ children, scroll = false, padded = true, bottomSpace = true, style }: ScreenProps) {
  const { styles } = useStyles();
  const contentStyle = [
    padded && styles.screenPadding,
    bottomSpace && { paddingBottom: 112 },
    style,
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false}>
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
      {right}
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

  const textStyle = [
    styles.buttonText,
    variant === 'ghost' && styles.buttonGhostText,
  ];

  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [buttonStyle, pressed && { transform: [{ scale: 0.99 }] }]}>
      {loading ? <ActivityIndicator color="white" /> : <Text style={textStyle}>{translateLiteral(title, language)}</Text>}
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
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.pill, selected && { backgroundColor: toneColor, borderColor: toneColor }]}>
      <Text style={[styles.pillText, { color: selected ? '#FFFFFF' : toneColor }]}>{translateLiteral(label, language)}</Text>
    </Pressable>
  );
}

export function MtEmptyState({ title, subtitle, actionTitle, onAction }: { title: string; subtitle?: string; actionTitle?: string; onAction?: () => void }) {
  const { styles } = useStyles();
  const { language } = useTranslation();
  return (
    <MtCard style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>🩺</Text>
      <Text style={styles.emptyTitle}>{translateLiteral(title, language)}</Text>
      {!!subtitle && <Text style={styles.emptySubtitle}>{translateLiteral(subtitle, language)}</Text>}
      {!!actionTitle && <MtButton title={actionTitle} onPress={onAction} style={{ marginTop: 14 }} />}
    </MtCard>
  );
}

export function MtLoading({ text = 'Cargando...' }: { text?: string }) {
  const { theme, styles } = useStyles();
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>{text}</Text>
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
    home: '🏠',
    perfil: '👤',
    turnos: '📅',
    historia: '📋',
    solicitar: '+',
    profesionales: '🩺',
  };
  const item = (key: typeof active, label: string, path: string) => {
    const selected = active === key;
    return (
      <Pressable style={styles.navItem} onPress={() => router.replace(path as any)}>
        <View style={[styles.navIconBubble, selected && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}>
          <Text style={[styles.navEmoji, selected && { color: theme.colors.primary }]}>{icons[key]}</Text>
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

// Compatibilidad con pantallas viejas que todavía importen textStyle.
export function textStyle(extra?: StyleProp<TextStyle>) {
  return [extra];
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.bg },
    fill: { flex: 1 },
    screenPadding: { paddingHorizontal: 20, paddingTop: 16 },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    eyebrow: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 },
    headerTitle: { color: theme.colors.ink, fontSize: 30, fontWeight: '900', lineHeight: 35 },
    headerSubtitle: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
    text: { color: theme.colors.ink },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 18,
      ...theme.shadow,
    },
    button: { minHeight: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
    buttonPrimary: { backgroundColor: theme.colors.primary },
    buttonSecondary: { backgroundColor: theme.colors.secondary },
    buttonDanger: { backgroundColor: theme.colors.danger },
    buttonGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
    buttonDisabled: { opacity: 0.65 },
    buttonText: { color: theme.mode === 'dark' ? '#06201D' : '#FFFFFF', fontSize: 15, fontWeight: '900' },
    buttonGhostText: { color: theme.colors.primary },
    inputLabel: { color: theme.colors.ink, fontWeight: '800', fontSize: 13 },
    input: {
      minHeight: 52,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      color: theme.colors.ink,
      fontSize: 15,
    },
    pill: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.colors.surface, marginRight: 8 },
    pillText: { fontWeight: '800', fontSize: 12 },
    emptyCard: { alignItems: 'center', gap: 6, paddingVertical: 28 },
    emptyIcon: { fontSize: 34 },
    emptyTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 17, textAlign: 'center' },
    emptySubtitle: { color: theme.colors.muted, textAlign: 'center', lineHeight: 20 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: theme.colors.bg },
    loadingText: { color: theme.colors.muted, marginTop: 12, fontWeight: '700' },
    statCard: { flex: 1, minWidth: 95, backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, padding: 14 },
    statValue: { fontSize: 24, fontWeight: '900' },
    statLabel: { marginTop: 2, color: theme.colors.muted, fontSize: 12, fontWeight: '700' },
    navBar: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 10,
      height: 72,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      ...theme.shadow,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
    navIconBubble: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
    navEmoji: { fontSize: 17, color: theme.colors.soft, fontWeight: '900' },
    navText: { color: theme.colors.soft, fontSize: 10, fontWeight: '800' },
    navFab: { width: 58, height: 58, marginTop: -26, borderRadius: 29, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: theme.colors.bg, ...theme.shadow },
    navFabText: { color: theme.mode === 'dark' ? '#06201D' : '#FFFFFF', fontSize: 34, lineHeight: 36, fontWeight: '300' },
  });
}
