import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MtButton, MtCard, MtInput, MtScreen } from '../components/mediturnos';
import { mt } from '../constants/mediturnosTheme';
import { authService } from '../api/authService';
import { readableError } from '../utils/errors';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const initialToken = useMemo(() => Array.isArray(params.token) ? params.token[0] : params.token || '', [params.token]);

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!token.trim()) {
      Alert.alert('Falta token', 'Pegá el token recibido por correo o por el modo demo.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Contraseña inválida', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('No coinciden', 'Las contraseñas ingresadas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token.trim(), password, confirmPassword);
      Alert.alert('Contraseña actualizada', 'Ya podés iniciar sesión con tu nueva contraseña.', [
        { text: 'Ir al login', onPress: () => router.replace('/login') },
      ]);
    } catch (error: any) {
      Alert.alert('No se pudo cambiar', readableError(error, 'Revisá el token o intentá pedir uno nuevo.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <MtScreen scroll bottomSpace={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.hero}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>↻</Text>
          </View>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Ingresá el token y elegí una contraseña nueva.</Text>
        </View>

        <MtCard style={styles.card}>
          <View style={styles.form}>
            <MtInput
              label="Token de recuperación"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              placeholder="Pegá el token"
            />
            <MtInput
              label="Nueva contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Mínimo 8 caracteres"
            />
            <MtInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Repetí la contraseña"
            />
          </View>

          <MtButton title="Actualizar contraseña" loading={loading} onPress={handleSubmit} style={{ marginTop: 18 }} />
          <MtButton title="Volver" variant="ghost" onPress={() => router.back()} style={{ marginTop: 10 }} />
        </MtCard>
      </KeyboardAvoidingView>
    </MtScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 14, paddingBottom: 24 },
  icon: {
    width: 76, height: 76, borderRadius: 28, backgroundColor: mt.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14, ...mt.shadow,
  },
  iconText: { color: 'white', fontSize: 34, fontWeight: '900' },
  title: { color: mt.colors.ink, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: mt.colors.muted, fontSize: 15, marginTop: 8, textAlign: 'center' },
  card: { padding: 22 },
  form: { gap: 14 },
});
