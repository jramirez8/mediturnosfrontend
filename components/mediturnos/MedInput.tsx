import React from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = TextInputProps & {
  value: string;
  onChangeText: (value: string) => void;
  password?: boolean;
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
  dark?: boolean;
};

export default function MedInput({
  value,
  onChangeText,
  password,
  passwordVisible,
  onTogglePassword,
  dark = false,
  style,
  ...props
}: Props) {
  return (
    <View style={[styles.wrap, dark ? styles.wrapDark : styles.wrapLight]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={dark ? 'rgba(238,232,255,0.52)' : '#9D94AD'}
        secureTextEntry={password && !passwordVisible}
        style={[styles.input, { color: dark ? '#FFFFFF' : '#28164D' }, style]}
        {...props}
      />
      {password ? (
        <Pressable onPress={onTogglePassword} hitSlop={12} style={styles.eye}>
          <Ionicons
            name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
            size={24}
            color={dark ? '#D9C8FF' : '#7C3AED'}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 64,
    borderRadius: 22,
    borderWidth: 1.4,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2B145D',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  wrapLight: {
    backgroundColor: 'rgba(124,58,237,0.055)',
    borderColor: 'rgba(124,58,237,0.18)',
  },
  wrapDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(216,200,255,0.18)',
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 1.5,
    paddingVertical: 0,
  },
  eye: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
