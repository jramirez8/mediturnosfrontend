import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMtTheme } from '../theme/themeStore';
import { MediturnosTheme } from '../constants/mediturnosTheme';
import { translateLiteral, useTranslation } from '../i18n/languageStore';

export type MtSelectOption = { label: string; value: string };

export function MtSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled,
}: Readonly<{
  label: string;
  value: string;
  placeholder: string;
  options: MtSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}>) {
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const { language } = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{translateLiteral(label, language)}</Text>
      <Pressable disabled={disabled} onPress={() => setOpen((current) => !current)} style={[styles.button, disabled && { opacity: 0.55 }]}> 
        <Text style={[styles.value, !selected && styles.placeholder]}>{selected?.label ? translateLiteral(selected.label, language) : translateLiteral(placeholder, language)}</Text>
        <View style={styles.chevronBubble}>
          <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
        </View>
      </Pressable>
      {open ? (
        <ScrollView style={styles.options} nestedScrollEnabled>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={`${label}-${option.value}`}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{translateLiteral(option.label, language)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

function createStyles(theme: MediturnosTheme) {
  const isDark = theme.mode === 'dark';
  return StyleSheet.create({
    wrap: { gap: 8 },
    label: { color: theme.colors.ink, fontWeight: '900', fontSize: 13, marginLeft: 2 },
    button: {
      minHeight: 54,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.86)',
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    value: { flex: 1, color: theme.colors.ink, fontWeight: '800', fontSize: 15 },
    placeholder: { color: theme.colors.soft, fontWeight: '700' },
    chevronBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    chevron: { color: theme.colors.primary, fontWeight: '900', fontSize: 18, lineHeight: 18 },
    options: {
      maxHeight: 260,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      backgroundColor: isDark ? '#1F1434' : '#FFFFFF',
      overflow: 'hidden',
      zIndex: 20,
      elevation: isDark ? 0 : 2,
      shadowColor: theme.colors.primary,
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: isDark ? 0 : 10,
    },
    option: { paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: isDark ? '#1F1434' : '#FFFFFF' },
    optionActive: { backgroundColor: theme.colors.primaryLight },
    optionText: { color: theme.colors.ink, fontWeight: '900', fontSize: 15 },
    optionTextActive: { color: theme.mode === 'dark' ? '#FFFFFF' : theme.colors.primaryDark, fontWeight: '900' },
  });
}
