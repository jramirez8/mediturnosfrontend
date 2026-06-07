import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '../../api/authService';
import { MtButton, MtCard, MtInput, MtNotice, MtScreen } from '../../components/mediturnos';
import { useMtTheme } from '../../theme/themeStore';
import { readableError } from '../../utils/errors';

export default function VerifyAccountScreen() {
  const params = useLocalSearchParams<{ email?: string; dni?: string; codigo?: string; message?: string }>();
  const initialIdentifier = useMemo(() => {
    const email = Array.isArray(params.email) ? params.email[0] : params.email;
    const dni = Array.isArray(params.dni) ? params.dni[0] : params.dni;
    return email || dni || '';
  }, [params.email, params.dni]);
  const initialCode = useMemo(() => {
    const codigo = Array.isArray(params.codigo) ? params.codigo[0] : params.codigo;
    return codigo || '';
  }, [params.codigo]);
  const initialMessage = useMemo(() => {
    const message = Array.isArray(params.message) ? params.message[0] : params.message;
    return message || '✅ Cuenta creada. Verificá tu mail y cargá el código para activar el acceso.';
  }, [params.message]);
  const theme = useMtTheme();
  const scrollRef = useRef<ScrollView | null>(null);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(initialMessage);
  const [error, setError] = useState<string | null>(null);

  const scrollTop = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 60);

  const submit = async () => {
    setError(null);
    setSuccess(null);
    if (!identifier.trim()) {
      setError('Ingresá el email o DNI con el que te registraste.');
      scrollTop();
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError('El código debe tener 6 números.');
      scrollTop();
      return;
    }
    try {
      setLoading(true);
      const response = await authService.verifyAccount(identifier.trim(), code.trim());
      setSuccess(response?.message || response?.mensaje || '✅ Cuenta verificada correctamente. Ya podés iniciar sesión.');
      scrollTop();
    } catch (e: any) {
      setError(readableError(e, 'No pudimos verificar la cuenta. Revisá el código e intentá nuevamente.'));
      scrollTop();
    } finally {
      setLoading(false);
    }
  };

  return (
    <MtScreen scroll bottomSpace={false} scrollRef={scrollRef}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>VERIFICACIÓN</Text>
          <Text style={[styles.title, { color: theme.colors.ink }]}>Activá tu cuenta</Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Te mandamos un código de 6 dígitos al email. Cargalo una sola vez y después ya podés entrar normalmente.</Text>
        </View>

        {!!success && <MtNotice type="success" title="Cuenta lista" message={success} style={{ marginBottom: 14 }} />}
        {!!error && <MtNotice type="danger" title="Revisá el código" message={error} style={{ marginBottom: 14 }} />}

        <MtCard style={{ gap: 14 }}>
          <MtInput label="Email o DNI" value={identifier} onChangeText={setIdentifier} placeholder="tu@email.com o DNI" autoCapitalize="none" />
          <MtInput label="Código de verificación" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad" />
          <MtButton title="Verificar cuenta" onPress={submit} loading={loading} disabled={loading} />
          <MtButton title="Ir al login" variant="ghost" onPress={() => router.replace('/login')} />
        </MtCard>
      </KeyboardAvoidingView>
    </MtScreen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 16, paddingBottom: 22, gap: 8 },
  kicker: { color: '#7C3AED', fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
});
