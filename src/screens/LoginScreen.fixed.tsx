import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BrandMark from '../../components/mediturnos/BrandMark';
import MedInput from '../../components/mediturnos/MedInput';
import MedButton from '../../components/mediturnos/MedButton';

export default function LoginScreen() {
  const router = useRouter();
  const [dniOrEmail, setDniOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const secureHint = useMemo(() => {
    const value = dniOrEmail.trim();
    if (!value) return '';
    return `Ingreso seguro activado para ${value}.`;
  }, [dniOrEmail]);

  const goHome = () => {
    try {
      router.replace('/(tabs)');
    } catch {
      router.replace('/');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.bgCircleA} />
        <View style={styles.bgCircleB} />

        <View style={styles.brandWrap}>
          <BrandMark withText size={44} />
        </View>

        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Bienvenido de nuevo</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email o DNI</Text>
          <MedInput
            value={dniOrEmail}
            onChangeText={setDniOrEmail}
            placeholder="41147663"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, styles.passwordLabel]}>Contraseña</Text>
          <MedInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            password
            passwordVisible={showPassword}
            onTogglePassword={() => setShowPassword(v => !v)}
          />

          <Pressable style={styles.forgot} onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          {secureHint ? <Text style={styles.secureText}>{secureHint}</Text> : null}

          <MedButton title="Ingresar" onPress={goHome} />

          <MedButton
            title="Ingresar con biometría / PIN"
            variant="secondary"
            onPress={goHome}
          />

          <MedButton
            title="Crear cuenta"
            variant="outline"
            onPress={() => router.push('/register')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 28,
  },
  bgCircleA: {
    position: 'absolute',
    top: -160,
    right: -135,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  bgCircleB: {
    position: 'absolute',
    top: 210,
    left: -170,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(124,58,237,0.055)',
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 46,
  },
  title: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '500',
    color: '#241042',
    letterSpacing: -1.4,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 29,
    color: '#7D748F',
    marginBottom: 54,
    letterSpacing: 0.3,
  },
  form: {
    gap: 18,
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    color: '#28164D',
    letterSpacing: 0.5,
    marginBottom: -8,
  },
  passwordLabel: {
    marginTop: 10,
  },
  forgot: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  forgotText: {
    fontSize: 21,
    fontWeight: '700',
    color: '#5B259F',
  },
  secureText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7D748F',
    marginTop: 2,
    marginBottom: 8,
  },
});
