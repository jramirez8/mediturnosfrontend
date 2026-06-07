import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '../api/authService';
import { MtButton, MtCard, MtInput, MtScreen } from '../components/mediturnos';
import { mt } from '../constants/mediturnosTheme';
import { readableError } from '../utils/errors';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ identifier?: string }>();
  const [identifier, setIdentifier] = useState(params.identifier ?? '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestReset = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Ingresá tu DNI o email para enviarte el código.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await authService.forgotPassword(identifier.trim());

      if (response?.emailEnviado === false) {
        setErrorMessage(response?.mensaje || response?.message || 'No pudimos enviar el correo de recuperación.');
        return;
      }

      router.push('/forgot-password-success');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setErrorMessage(readableError(error, 'No pudimos procesar la solicitud. Intentá nuevamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MtScreen scroll bottomSpace={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>@</Text>
          </View>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>Ingresá tu DNI o email para recibir un código de 6 dígitos.</Text>
        </View>

        <MtCard style={styles.card}>
          <MtInput
            label="DNI o email"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="DNI o email"
          />

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>No pudimos enviar el correo</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <MtButton title="Enviar código" onPress={handleRequestReset} loading={loading} style={{ marginTop: 18 }} />
          <MtButton title="Volver" variant="ghost" onPress={() => router.back()} style={{ marginTop: 10 }} />
        </MtCard>
      </KeyboardAvoidingView>
    </MtScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 16, paddingBottom: 24 },
  iconCircle: {
    width: 78, height: 78, backgroundColor: mt.colors.primary, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16, ...mt.shadow,
  },
  iconText: { color: 'white', fontSize: 32, fontWeight: '900' },
  title: { fontSize: 30, fontWeight: '900', color: mt.colors.ink, textAlign: 'center' },
  subtitle: { fontSize: 15, color: mt.colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  card: { padding: 22 },
  errorBox: {
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  errorTitle: { color: '#991b1b', fontWeight: '900', fontSize: 15, marginBottom: 6 },
  errorText: { color: '#7f1d1d', fontWeight: '600', fontSize: 14, lineHeight: 20 },
});
