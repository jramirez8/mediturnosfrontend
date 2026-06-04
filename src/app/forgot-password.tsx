import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../api/authService';
import { MtButton, MtCard, MtInput, MtScreen } from '../components/mediturnos';
import { mt } from '../constants/mediturnosTheme';
import { readableError } from '../utils/errors';

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!identifier.trim()) {
      Alert.alert('Dato faltante', 'Ingresá tu DNI o email.');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.forgotPassword(identifier.trim());
      const resetToken = response?.resetToken || response?.token || null;

      if (resetToken) {
        Alert.alert(
          'Token generado',
          'Modo demo activo: ya podemos cargar la nueva contraseña sin esperar el correo.',
          [
            {
              text: 'Continuar',
              onPress: () => router.push({ pathname: '/reset-password', params: { token: resetToken } }),
            },
          ]
        );
        return;
      }

      router.push('/forgot-password-success');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      Alert.alert('No se pudo procesar', readableError(error, 'Revisá el backend o intentá nuevamente.'));
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
          <Text style={styles.subtitle}>Ingresá tu DNI o email para recibir instrucciones.</Text>
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

          <MtButton title="Solicitar recuperación" onPress={handleRequestReset} loading={loading} style={{ marginTop: 18 }} />
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
});
