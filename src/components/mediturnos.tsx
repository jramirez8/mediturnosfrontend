import React from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomNav } from './AppBottomNav';
import { MediturnosTheme } from '../constants/mediturnosTheme';
import { useMtTheme } from '../theme/themeStore';
import { translateLiteral, useTranslation } from '../i18n/languageStore';
import { useAuthStore } from '../auth/authStore';
import { routeForRole } from '../auth/roles';
import { isConnectivityMessage } from '../utils/errors';
type ScreenProps = {
    children: React.ReactNode;
    scroll?: boolean;
    padded?: boolean;
    bottomSpace?: boolean;
    style?: StyleProp<ViewStyle>;
    scrollRef?: React.RefObject<ScrollView | null>;
};
function useStyles() {
    const theme = useMtTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme.mode]);
    return { theme, styles };
}
function DecorativeBackground() {
    const { theme, styles } = useStyles();
    return (<View pointerEvents="none" style={styles.decorRoot}>
      <View style={styles.topWash}/>
      <View style={styles.topOrb}/>
      <View style={styles.topCurve}/>
      <View style={styles.bottomCurve}/>
      <View style={styles.bottomCurveTwo}/>
      <Text style={styles.watermarkMark}>M+</Text>
      <Text style={styles.decorPlusOne}>+</Text>
      <Text style={styles.decorPlusTwo}>+</Text>
      <Text style={styles.decorDot}>○</Text>
    </View>);
}
export function MtScreen({ children, scroll = false, padded = true, bottomSpace = true, style, scrollRef }: ScreenProps) {
    const { styles } = useStyles();
    const childArray = React.Children.toArray(children);
    const isBottomNav = (child: React.ReactNode) => React.isValidElement(child)
        && (child.type as {
            displayName?: string;
        })?.displayName === 'MediturnosBottomNav';
    const navigation = childArray.filter(isBottomNav);
    const content = childArray.filter((child) => !isBottomNav(child));
    const hasNavigation = navigation.length > 0;
    const contentStyle = [padded && styles.screenPadding, bottomSpace && { paddingBottom: hasNavigation ? 116 : 28 }, style];
    return (<SafeAreaView style={styles.safe} edges={['top']}>
      <DecorativeBackground />
      {scroll ? (<ScrollView ref={scrollRef} style={styles.fill} contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>) : (<View style={[styles.fill, contentStyle]}>{content}</View>)}
      {navigation}
    </SafeAreaView>);
}
export function MtHeader({ eyebrow, title, subtitle, right }: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
}) {
    const { styles } = useStyles();
    const { language } = useTranslation();
    return (<View style={styles.header}>
      <View style={{ flex: 1 }}>
        {!!eyebrow && <Text style={styles.eyebrow}>{translateLiteral(eyebrow, language)}</Text>}
        <Text style={styles.headerTitle}>{translateLiteral(title, language)}</Text>
        {!!subtitle && <Text style={styles.headerSubtitle}>{translateLiteral(subtitle, language)}</Text>}
      </View>
      {right !== undefined ? right : null}
    </View>);
}
export function MtCard({ children, style }: {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}) {
    const { styles } = useStyles();
    return <View style={[styles.card, style]}>{children}</View>;
}
export function MtButton({ title, onPress, variant = 'primary', loading = false, disabled = false, style, }: {
    title: string;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}) {
    const { theme, styles } = useStyles();
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
    const textStyle = [styles.buttonText, variant === 'secondary' && styles.buttonSecondaryText, variant === 'ghost' && styles.buttonGhostText, variant === 'danger' && styles.buttonDangerText];
    return (<Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [buttonStyle, pressed && { transform: [{ scale: 0.985 }], opacity: 0.94 }]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : theme.colors.primary}/> : <Text style={textStyle} numberOfLines={2} adjustsFontSizeToFit>{translateLiteral(title, language)}</Text>}
    </Pressable>);
}
export function MtInput({ label, style, ...props }: TextInputProps & {
    label: string;
}) {
    const { theme, styles } = useStyles();
    const { language } = useTranslation();
    return (<View style={{ gap: 8 }}>
      <Text style={styles.inputLabel}>{translateLiteral(label, language)}</Text>
      <TextInput placeholderTextColor={theme.colors.soft} style={[styles.input, style]} {...props}/>
    </View>);
}
function getToneColor(theme: MediturnosTheme, tone: 'primary' | 'success' | 'warning' | 'danger' | 'muted') {
    if (tone === 'success') return theme.colors.success;
    if (tone === 'warning') return theme.colors.warning;
    if (tone === 'danger') return theme.colors.danger;
    if (tone === 'muted') return theme.colors.muted;
    return theme.colors.primary;
}

export function MtPill({ label, tone = 'primary', selected = false, onPress }: {
    label: string;
    tone?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
    selected?: boolean;
    onPress?: () => void;
}) {
    const { theme, styles } = useStyles();
    const { language } = useTranslation();
    const toneColor = getToneColor(theme, tone);
    return (<Pressable onPress={onPress} disabled={!onPress} style={[styles.pill, selected && { backgroundColor: toneColor, borderColor: toneColor, shadowColor: toneColor, shadowOpacity: 0.18 }]}> 
      <Text style={[styles.pillText, { color: selected ? '#FFFFFF' : toneColor }]} numberOfLines={1} adjustsFontSizeToFit>{translateLiteral(label, language)}</Text>
    </Pressable>);
}
export function MtEmptyState({ title, subtitle, actionTitle, onAction }: {
    title: string;
    subtitle?: string;
    actionTitle?: string;
    onAction?: () => void;
}) {
    const { styles } = useStyles();
    const { language } = useTranslation();
    return (<MtCard style={styles.emptyCard}>
      <View style={styles.emptyLogoShell}>
        <Text style={styles.emptyMarkText}>M+</Text>
      </View>
      <Text style={styles.emptyTitle}>{translateLiteral(title, language)}</Text>
      {!!subtitle && <Text style={styles.emptySubtitle}>{translateLiteral(subtitle, language)}</Text>}
      {!!actionTitle && <MtButton title={actionTitle} onPress={onAction} style={{ marginTop: 14 }}/>}
    </MtCard>);
}
export function MtLoading({ text = 'Cargando...' }: {
    text?: string;
}) {
    const { theme, styles } = useStyles();
    const { language } = useTranslation();
    return (<View style={styles.loadingWrap}>
      <View style={styles.loadingLogoShell}>
        <Text style={styles.loadingMarkText}>M+</Text>
      </View>
      <ActivityIndicator size="small" color={theme.colors.primary}/>
      <Text style={styles.loadingText}>{translateLiteral(text, language)}</Text>
    </View>);
}
type NoticeType = 'info' | 'success' | 'danger' | 'warning';
function noticeColor(type: NoticeType, theme: MediturnosTheme) {
    const colors: Record<NoticeType, string> = {
        success: theme.colors.success,
        danger: theme.colors.danger,
        warning: theme.colors.warning,
        info: theme.colors.primary,
    };
    return colors[type];
}
function noticeBackground(type: NoticeType, dark: boolean) {
    const backgrounds: Record<NoticeType, [
        string,
        string
    ]> = {
        success: ['#F0FDF4', 'rgba(34,197,94,0.12)'],
        danger: ['#FFF1F2', 'rgba(248,113,113,0.12)'],
        warning: ['#FFFBEB', 'rgba(251,191,36,0.12)'],
        info: ['#F3ECFF', 'rgba(124,58,237,0.14)'],
    };
    return backgrounds[type][dark ? 1 : 0];
}
type NoticeProps = {
    type?: NoticeType;
    title?: string;
    message: string;
    actionTitle?: string;
    onAction?: () => void;
    style?: StyleProp<ViewStyle>;
    popup?: boolean;
};
function NoticePopup({ visible, title, message, color, onClose }: {
    visible: boolean;
    title?: string;
    message: string;
    color: string;
    onClose: () => void;
}) {
    const { theme, styles } = useStyles();
    const { language } = useTranslation();
    return (<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.noticeModalBackdrop}>
        <View style={[styles.noticeModalCard, { backgroundColor: theme.colors.surface, borderColor: `${color}66` }]}>
          {title ? <Text style={[styles.noticeModalTitle, { color }]}>{translateLiteral(title, language)}</Text> : null}
          <Text selectable style={[styles.noticeModalMessage, { color: theme.colors.ink }]}>{translateLiteral(message, language)}</Text>
          <MtButton title="OK" onPress={onClose} style={{ marginTop: 12 }}/>
        </View>
      </View>
    </Modal>);
}
function InlineNotice({ type, title, message, actionTitle, onAction, style }: Required<Pick<NoticeProps, 'type' | 'message'>> & Omit<NoticeProps, 'type' | 'message' | 'popup'>) {
    const { theme } = useStyles();
    const { language } = useTranslation();
    const color = noticeColor(type, theme);
    return (<View style={[{ borderRadius: 20, borderWidth: 1, borderColor: `${color}66`, backgroundColor: noticeBackground(type, theme.mode === 'dark'), padding: 14, gap: 5 }, style]}>
      {title ? <Text style={{ color, fontWeight: '900', fontSize: 14 }}>{translateLiteral(title, language)}</Text> : null}
      <Text selectable style={{ color: theme.colors.ink, fontWeight: '700', lineHeight: 20 }}>{translateLiteral(message, language)}</Text>
      {actionTitle && onAction ? <MtButton title={actionTitle} onPress={onAction} variant="ghost" style={{ marginTop: 8, minHeight: 42 }}/> : null}
    </View>);
}
export function MtNotice({ type = 'info', title, message, actionTitle, onAction, style, popup }: NoticeProps) {
    const theme = useMtTheme();
    const role = useAuthStore((state) => state.role);
    const [visible, setVisible] = React.useState(true);
    const shouldPopup = popup ?? (type === 'success' || isConnectivityMessage(message));
    const closePopup = () => {
        setVisible(false);
        router.replace(routeForRole(role) as any);
    };
    if (shouldPopup) {
        return <NoticePopup visible={visible} title={title} message={message} color={noticeColor(type, theme)} onClose={closePopup}/>;
    }
    return <InlineNotice type={type} title={title} message={message} actionTitle={actionTitle} onAction={onAction} style={style}/>;
}
export function MtStat({ label, value, tone = 'primary' }: {
    label: string;
    value: string | number;
    tone?: 'primary' | 'success' | 'warning' | 'danger';
}) {
    const { theme, styles } = useStyles();
    const { language } = useTranslation();
    const color = getToneColor(theme, tone);
    return (<View style={[styles.statCard, { borderColor: `${color}55` }]}> 
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{translateLiteral(label, language)}</Text>
    </View>);
}
export function MtBottomNav({ active }: {
    active: 'home' | 'perfil' | 'turnos' | 'historia' | 'solicitar' | 'profesionales';
}) {
    return <AppBottomNav role="paciente" active={active}/>;
}
MtBottomNav.displayName = 'MediturnosBottomNav';
export function useMtTextStyle(extra?: StyleProp<TextStyle>) {
    const { styles } = useStyles();
    return [styles.text, extra];
}
export function textStyle(extra?: StyleProp<TextStyle>) {
    return [extra];
}
function stylePalette(theme: MediturnosTheme) {
    if (theme.mode === 'dark') {
        return { topWash: 'rgba(124,58,237,0.16)', topOrb: 'rgba(168,85,247,0.16)', topCurve: 'rgba(196,181,253,0.06)', bottomCurve: 'rgba(76,29,149,0.24)', bottomCurveTwo: 'rgba(124,58,237,0.16)', secondaryBg: 'rgba(255,255,255,0.08)', secondaryBorder: 'rgba(255,255,255,0.16)', secondaryShadow: 0.08, dangerBg: 'rgba(248,113,113,0.14)', ghostBg: 'rgba(255,255,255,0.075)', ghostBorder: theme.colors.border, ghostShadow: 0, inputBg: 'rgba(255,255,255,0.045)', pillBg: 'rgba(255,255,255,0.045)', logoBg: 'rgba(216,200,255,0.14)', logoBorder: 'rgba(216,200,255,0.20)', logoText: '#D9C8FF', navBg: 'rgba(31,20,52,0.96)', navIconBg: 'rgba(255,255,255,0.04)' };
    }
    return { topWash: '#F4EEFF', topOrb: 'rgba(221,214,254,0.58)', topCurve: 'rgba(255,255,255,0.55)', bottomCurve: '#EFE7FF', bottomCurveTwo: 'rgba(244,238,255,0.82)', secondaryBg: '#F3ECFF', secondaryBorder: 'rgba(124,58,237,0.24)', secondaryShadow: 0.10, dangerBg: '#FFF1F2', ghostBg: '#EDE7FF', ghostBorder: 'rgba(124,58,237,0.28)', ghostShadow: 0.10, inputBg: '#F3ECFF', pillBg: 'rgba(255,255,255,0.75)', logoBg: 'rgba(124,58,237,0.10)', logoBorder: 'rgba(124,58,237,0.18)', logoText: theme.colors.primary, navBg: 'rgba(255,255,255,0.94)', navIconBg: '#FFFFFF' };
}
function createStyles(theme: MediturnosTheme) {
    const palette = stylePalette(theme);
    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.colors.bg, overflow: 'hidden' },
        fill: { flex: 1 },
        screenPadding: { paddingHorizontal: 20, paddingTop: 18 },
        decorRoot: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
        topWash: { position: 'absolute', top: -150, left: -80, width: 520, height: 320, borderRadius: 260, backgroundColor: palette.topWash, transform: [{ rotate: '-10deg' }] },
        topOrb: { position: 'absolute', top: -95, right: -115, width: 270, height: 270, borderRadius: 135, backgroundColor: palette.topOrb },
        topCurve: { position: 'absolute', top: 78, right: -110, width: 360, height: 120, borderRadius: 120, backgroundColor: palette.topCurve, transform: [{ rotate: '-12deg' }] },
        bottomCurve: { position: 'absolute', bottom: -78, left: -80, width: 430, height: 170, borderRadius: 140, backgroundColor: palette.bottomCurve, transform: [{ rotate: '7deg' }] },
        bottomCurveTwo: { position: 'absolute', bottom: -42, right: -120, width: 390, height: 150, borderRadius: 130, backgroundColor: palette.bottomCurveTwo, transform: [{ rotate: '-8deg' }] },
        watermarkMark: { display: 'none', opacity: 0 },
        decorPlusOne: { position: 'absolute', left: 30, bottom: 120, color: theme.colors.primary, opacity: 0.14, fontSize: 28, fontWeight: '900' },
        decorPlusTwo: { position: 'absolute', right: 36, top: 94, color: theme.colors.primary, opacity: 0.12, fontSize: 22, fontWeight: '900' },
        decorDot: { position: 'absolute', left: 55, bottom: 72, color: theme.colors.primary, opacity: 0.15, fontSize: 22, fontWeight: '900' },
        header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 14 },
        eyebrow: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.4, marginBottom: 6, textTransform: 'uppercase' },
        headerTitle: { color: theme.colors.ink, fontSize: 31, fontWeight: '900', lineHeight: 37, letterSpacing: -0.4 },
        headerSubtitle: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, fontWeight: '600' },
        text: { color: theme.colors.ink },
        card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: 18, overflow: 'hidden', ...theme.shadow },
        button: { minHeight: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 3 },
        buttonPrimary: { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
        buttonSecondary: { backgroundColor: palette.secondaryBg, borderWidth: 1, borderColor: palette.secondaryBorder, shadowColor: theme.colors.primary, shadowOpacity: palette.secondaryShadow },
        buttonDanger: { backgroundColor: palette.dangerBg, borderWidth: 1, borderColor: theme.colors.danger, shadowOpacity: 0 },
        buttonGhost: { backgroundColor: palette.ghostBg, borderWidth: 1, borderColor: palette.ghostBorder, shadowColor: theme.colors.primary, shadowOpacity: palette.ghostShadow },
        buttonDisabled: { opacity: 0.62 },
        buttonText: { color: '#FFFFFF', backgroundColor: 'transparent', fontSize: 14, fontWeight: '900', letterSpacing: 0.1, textAlign: 'center', lineHeight: 18, includeFontPadding: false },
        buttonSecondaryText: { color: theme.colors.primaryDark }, buttonGhostText: { color: theme.colors.primary }, buttonDangerText: { color: theme.colors.danger },
        inputLabel: { color: theme.colors.ink, fontWeight: '900', fontSize: 13, marginLeft: 2 },
        input: { minHeight: 54, backgroundColor: palette.inputBg, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, color: theme.colors.ink, fontSize: 15, fontWeight: '700', textAlignVertical: 'center', includeFontPadding: false },
        pill: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: palette.pillBg, marginRight: 8, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 2 },
        pillText: { fontWeight: '900', fontSize: 12, backgroundColor: 'transparent' },
        emptyCard: { alignItems: 'center', gap: 7, paddingVertical: 30 },
        emptyLogoShell: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.logoBg, borderWidth: 1, borderColor: palette.logoBorder, marginBottom: 4 },
        emptyMarkText: { color: palette.logoText, fontSize: 21, fontWeight: '900', letterSpacing: -1 },
        emptyTitle: { color: theme.colors.ink, backgroundColor: 'transparent', fontWeight: '900', fontSize: 18, lineHeight: 24, textAlign: 'center' },
        emptySubtitle: { color: theme.colors.muted, backgroundColor: 'transparent', textAlign: 'center', lineHeight: 20, fontWeight: '600' },
        loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: theme.colors.bg, gap: 10 },
        loadingLogoShell: { width: 78, height: 78, borderRadius: 28, backgroundColor: palette.logoBg, borderWidth: 1, borderColor: palette.logoBorder, alignItems: 'center', justifyContent: 'center', ...theme.shadow },
        loadingMarkText: { color: palette.logoText, fontSize: 27, fontWeight: '900', letterSpacing: -1 },
        loadingText: { color: theme.colors.muted, marginTop: 4, fontWeight: '800' },
        statCard: { flex: 1, minWidth: 96, backgroundColor: theme.colors.surface, borderRadius: 22, borderWidth: 1, padding: 15, ...theme.shadow },
        statValue: { fontSize: 25, fontWeight: '900', letterSpacing: -0.3 }, statLabel: { marginTop: 2, color: theme.colors.muted, fontSize: 12, fontWeight: '800' },
        noticeModalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 10, 28, 0.58)', alignItems: 'center', justifyContent: 'center', padding: 24 },
        noticeModalCard: { width: '100%', maxWidth: 430, borderRadius: 24, borderWidth: 1, padding: 22, ...theme.shadow },
        noticeModalTitle: { fontWeight: '900', fontSize: 20, marginBottom: 8 }, noticeModalMessage: { fontWeight: '700', fontSize: 15, lineHeight: 22 },
        navBar: { position: 'absolute', left: 12, right: 12, bottom: 10, height: 76, borderRadius: 30, backgroundColor: palette.navBg, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', ...theme.shadow },
        navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: 5 },
        navIconBubble: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: palette.navIconBg, alignItems: 'center', justifyContent: 'center' },
        navIconBubbleSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 },
        navEmoji: { fontSize: 17, color: theme.colors.soft, fontWeight: '900' }, navText: { color: theme.colors.soft, fontSize: 10, fontWeight: '800' },
        navFab: { width: 60, height: 60, marginTop: -28, borderRadius: 30, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: theme.colors.bg, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 7 },
        navFabText: { color: '#FFFFFF', fontSize: 34, lineHeight: 36, fontWeight: '300' },
    });
}

