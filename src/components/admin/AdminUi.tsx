import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { MtButton, MtCard, MtPill } from '../mediturnos';
import { useMtTheme } from '../../theme/themeStore';
import { translateLiteral, useTranslation } from '../../i18n/languageStore';

export function AdminNotice({ type = 'info', title, message, onRetry }: { type?: 'info' | 'success' | 'danger' | 'warning'; title: string; message?: string; onRetry?: () => void }) {
  const theme = useMtTheme();
  const { t, language } = useTranslation();
  const color = type === 'success' ? theme.colors.success : type === 'danger' ? theme.colors.danger : type === 'warning' ? theme.colors.warning : theme.colors.primary;
  return (
    <MtCard style={{ borderColor: color, marginBottom: 14 }}>
      <Text style={{ color, fontWeight: '900', fontSize: 16 }}>{translateLiteral(title, language)}</Text>
      {message ? <Text style={{ color: theme.colors.muted, marginTop: 6, lineHeight: 20 }}>{message}</Text> : null}
      {onRetry ? <MtButton title={t('common.retry')} onPress={onRetry} style={{ marginTop: 12 }} /> : null}
    </MtCard>
  );
}

export function AdminTabs<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; tone?: 'primary' | 'success' | 'warning' | 'danger' | 'muted' }[]; onChange: (value: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
      {options.map((option) => (
        <MtPill key={option.value} label={option.label} tone={option.tone ?? 'primary'} selected={value === option.value} onPress={() => onChange(option.value)} />
      ))}
    </View>
  );
}

export function AdminKV({ label, value }: { label: string; value?: string | number | null }) {
  const theme = useMtTheme();
  const { language } = useTranslation();
  return (
    <View style={{ marginTop: 5 }}>
      <Text style={{ color: theme.colors.soft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>{translateLiteral(label, language)}</Text>
      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginTop: 2 }}>{value || (language === 'en' ? 'Not provided' : 'No informado')}</Text>
    </View>
  );
}

export function AdminActionRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }, style]}>{children}</View>;
}

export function AdminMiniButton({ label, onPress, tone = 'primary', disabled }: { label: string; onPress?: () => void; tone?: 'primary' | 'danger' | 'success' | 'warning' | 'muted'; disabled?: boolean }) {
  const theme = useMtTheme();
  const { language } = useTranslation();
  const color = tone === 'danger' ? theme.colors.danger : tone === 'success' ? theme.colors.success : tone === 'warning' ? theme.colors.warning : tone === 'muted' ? theme.colors.muted : theme.colors.primary;
  return (
    <Pressable disabled={disabled} onPress={onPress} style={{ borderWidth: 1, borderColor: color, borderRadius: 14, paddingVertical: 9, paddingHorizontal: 12, opacity: disabled ? 0.5 : 1 }}>
      <Text style={{ color, fontWeight: '900', fontSize: 12 }}>{translateLiteral(label, language)}</Text>
    </Pressable>
  );
}

export function AdminTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useMtTheme();
  const { language } = useTranslation();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: theme.colors.ink, fontWeight: '900', fontSize: 18 }}>{translateLiteral(title, language)}</Text>
      {subtitle ? <Text style={{ color: theme.colors.muted, marginTop: 4, lineHeight: 19 }}>{translateLiteral(subtitle, language)}</Text> : null}
    </View>
  );
}
