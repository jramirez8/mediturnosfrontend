import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MtButton, MtCard, MtInput, MtNotice, MtScreen } from '../components/mediturnos';
import { mt } from '../constants/mediturnosTheme';
import { authService } from '../api/authService';
import { readableError } from '../utils/errors';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const initialToken = useMemo(() => Array.isArray(params.token) ? params.token[0] : params.token || '', [params.token]);
  const scrollRef = useRef<ScrollView | null>(null);

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const scrollTop = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 60);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!token.trim()) {
      setError('Pegá el código de 6 dígitos que recibiste por correo.');
      scrollTop();
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      scrollTop();
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.');
      scrollTop();
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token.trim(), password, confirmPassword);
      setSuccess('✅ Contraseña actualizada correctamente. Ya podés iniciar sesión con tu nueva clave.');
      setPassword('');
      setConfirmPassword('');
      scrollTop();
    } catch (err: unknown) {
      setError(readableError(err, 'No pudimos cambiar la contraseña. Revisá el código o pedí uno nuevo.'));
      scrollTop();
    } finally {
      setLoading(false);
    }
  }

  return (
    <MtScreen scroll bottomSpace={false} scrollRef={scrollRef}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.hero}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>↻</Text>
          </View>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Ingresá el código de 6 dígitos y elegí una contraseña nueva.</Text>
        </View>

        {!!success && <MtNotice type="success" title="Contraseña actualizada" message={success} style={{ marginBottom: 14 }} />}
        {!!error && <MtNotice type="danger" title="No pudimos actualizarla" message={error} style={{ marginBottom: 14 }} />}

        <MtCard style={styles.card}>
          <View style={styles.form}>
            <MtInput
              label="Código de recuperación"
              value={token}
              onChangeText={(value) => setToken(value.replace(/\D/g, '').slice(0, 6))}
              autoCapitalize="none"
              keyboardType="number-pad"
              placeholder="123456"
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

          <MtButton title="Actualizar contraseña" loading={loading} disabled={loading} onPress={handleSubmit} style={{ marginTop: 18 }} />
          <MtButton title="Ir al login" variant="ghost" onPress={() => router.replace('/login')} style={{ marginTop: 10 }} />
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
  subtitle: { color: mt.colors.muted, fontSize: 15, marginTop: 8, textAlign: 'center', paddingHorizontal: 12 },
  card: { padding: 22 },
  form: { gap: 14 },
});
