import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'soft';
  dark?: boolean;
  style?: ViewStyle;
};

export default function MedButton({ title, onPress, variant = 'primary', dark = false, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && (dark ? styles.secondaryDark : styles.secondaryLight),
        variant === 'outline' && (dark ? styles.outlineDark : styles.outlineLight),
        variant === 'danger' && styles.danger,
        variant === 'soft' && (dark ? styles.softDark : styles.softLight),
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' && styles.primaryText,
          variant === 'secondary' && { color: dark ? '#EAE1FF' : '#6D28D9' },
          variant === 'outline' && { color: dark ? '#D9C8FF' : '#6D28D9' },
          variant === 'danger' && styles.dangerText,
          variant === 'soft' && { color: dark ? '#FFFFFF' : '#6D28D9' },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    paddingHorizontal: 20,
    shadowColor: '#2B145D',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  text: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  primary: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryLight: {
    backgroundColor: '#F3ECFF',
    borderColor: 'rgba(124,58,237,0.24)',
  },
  secondaryDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(216,200,255,0.18)',
  },
  outlineLight: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(124,58,237,0.45)',
  },
  outlineDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(216,200,255,0.22)',
  },
  danger: {
    backgroundColor: 'rgba(201,58,70,0.06)',
    borderColor: 'rgba(201,58,70,0.25)',
  },
  dangerText: {
    color: '#C93A46',
  },
  softLight: {
    backgroundColor: 'rgba(124,58,237,0.10)',
    borderColor: 'rgba(124,58,237,0.12)',
  },
  softDark: {
    backgroundColor: 'rgba(216,200,255,0.18)',
    borderColor: 'rgba(216,200,255,0.20)',
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.88,
  },
});
