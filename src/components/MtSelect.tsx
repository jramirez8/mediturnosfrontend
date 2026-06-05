import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMtTheme } from '../theme/themeStore';
import { MediturnosTheme } from '../constants/mediturnosTheme';

export type MtSelectOption = {
  label: string;
  value: string;
};

export function MtSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: MtSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const theme = useMtTheme();
  const styles = useMemo(() => createStyles(theme), [theme.mode]);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable disabled={disabled} onPress={() => setOpen((current) => !current)} style={[styles.button, disabled && { opacity: 0.55 }]}> 
        <Text style={[styles.value, !selected && styles.placeholder]}>{selected?.label ?? placeholder}</Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
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
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

function createStyles(theme: MediturnosTheme) {
  return StyleSheet.create({
    wrap: { gap: 8 },
    label: { color: theme.colors.ink, fontWeight: '900', fontSize: 13 },
    button: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    value: { flex: 1, color: theme.colors.ink, fontWeight: '800', fontSize: 15 },
    placeholder: { color: theme.colors.soft, fontWeight: '700' },
    chevron: { color: theme.colors.primary, fontWeight: '900' },
    options: {
      maxHeight: 230,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    option: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    optionActive: { backgroundColor: theme.colors.primaryLight },
    optionText: { color: theme.colors.ink, fontWeight: '800' },
    optionTextActive: { color: theme.colors.primaryDark, fontWeight: '900' },
  });
}
