import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <Pressable disabled={disabled} onPress={() => setOpen(true)} style={[styles.button, disabled && { opacity: 0.55 }]}>
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ? translateLiteral(selected.label, language) : translateLiteral(placeholder, language)}
        </Text>
        <View style={styles.chevronBubble}>
          <Ionicons name="chevron-down" size={18} color={theme.colors.primary} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{translateLiteral(label, language)}</Text>
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
          </Pressable>
        </Pressable>
      </Modal>
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
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 10, 28, 0.42)',
      justifyContent: 'center',
      padding: 22,
    },
    modalCard: {
      width: '100%',
      maxHeight: '78%',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: isDark ? '#1F1434' : '#FFFFFF',
      overflow: 'hidden',
    },
    modalTitle: { color: theme.colors.ink, fontWeight: '900', fontSize: 17, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
    options: { maxHeight: 320, backgroundColor: isDark ? '#1F1434' : '#FFFFFF' },
    option: { paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: isDark ? '#1F1434' : '#FFFFFF' },
    optionActive: { backgroundColor: theme.colors.primaryLight },
    optionText: { color: theme.colors.ink, fontWeight: '900', fontSize: 15 },
    optionTextActive: { color: theme.mode === 'dark' ? '#FFFFFF' : theme.colors.primaryDark, fontWeight: '900' },
  });
}
