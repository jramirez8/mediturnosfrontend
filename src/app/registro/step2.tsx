import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRegistrationStore } from '../../auth/registrationStore';
import { authService, RegistrationAvailability } from '../../api/authService';
import { readableError } from '../../utils/errors';

export default function RegisterStep2() {
  const { data, setStep2 } = useRegistrationStore();
  const [email, setEmail] = useState(data.email);
  const [telefono, setTelefono] = useState(data.telefono ?? '');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflicts, setConflicts] = useState<RegistrationAvailability | null>(null);

  const goForgotPassword = () => {
    const identifier = email.trim() || data.dni.trim();
    router.push({ pathname: '/forgot-password', params: identifier ? { identifier } : undefined });
  };

  const handleContinue = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanTelefono = telefono.trim();

    setError('');
    setFieldErrors({});
    setConflicts(null);

    const nextErrors: Record<string, string> = {};
    if (!cleanEmail) nextErrors.email = 'El email es obligatorio.';
    if (!cleanTelefono) nextErrors.telefono = 'El teléfono es obligatorio.';
    if (!password) nextErrors.password = 'La contraseña es obligatoria.';
    if (!repeatPassword) nextErrors.repeatPassword = 'Tenés que repetir la contraseña.';
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setError('Completá los campos obligatorios marcados.');
      return;
    }
    if (!data.dni.trim()) {
      setError('Falta el DNI del paso 1. Volvé al paso anterior y revisalo.');
      return;
    }
    if (password !== repeatPassword) {
      setFieldErrors({ repeatPassword: 'Las contraseñas no coinciden.' });
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setFieldErrors({ password: 'La contraseña debe tener al menos 8 caracteres.' });
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const availability = await authService.checkRegistrationAvailability({
        dni: data.dni,
        email: cleanEmail,
        telefono: cleanTelefono,
      });

      if (!availability.disponible) {
        setConflicts(availability);
        setError(availability.message || 'Ya existe una cuenta registrada con esos datos.');
        return;
      }

      setStep2(cleanEmail, cleanTelefono, password, repeatPassword);
      router.push('/registro/medical-info');
    } catch (err: unknown) {
      setError(readableError(err, 'No pudimos validar si tus datos ya están registrados. Intentá nuevamente.'));
    } finally {
      setLoading(false);
    }
  };

  const conflictText = conflicts?.conflictos?.length
    ? `Coincidencias detectadas: ${conflicts.conflictos.join(', ')}.`
    : 'El sistema detectó que ya podría existir una cuenta con esos datos.';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.progressContainer}>
            <View style={styles.stepCircleActive}><Text style={styles.stepTextActive}>1</Text></View>
            <View style={styles.progressBarActive} />
            <View style={styles.stepCircleActive}><Text style={styles.stepTextActive}>2</Text></View>
            <View style={styles.progressBarInactive} />
            <View style={styles.stepCircleInactive}><Text style={styles.stepTextInactive}>3</Text></View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta · Paso 2</Text>
            <Text style={styles.subtitle}>Datos de contacto y acceso</Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>No podemos continuar el registro</Text>
              <Text style={styles.errorText}>{error}</Text>
              {conflicts && <Text style={styles.errorDetail}>{conflictText}</Text>}
              {conflicts && (
                <TouchableOpacity style={styles.forgotButton} onPress={goForgotPassword}>
                  <Text style={styles.forgotButtonText}>Ir a “Olvidé mi contraseña”</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, fieldErrors.email && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="tu.email@ejemplo.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {!!fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <View style={[styles.inputContainer, fieldErrors.telefono && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 2284 123456"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                />
              </View>
              {!!fieldErrors.telefono && <Text style={styles.fieldError}>{fieldErrors.telefono}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputContainer, fieldErrors.password && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresá tu contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              {!!fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Repetir contraseña</Text>
              <View style={[styles.inputContainer, fieldErrors.repeatPassword && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Repetí tu contraseña"
                  value={repeatPassword}
                  onChangeText={setRepeatPassword}
                  secureTextEntry
                />
              </View>
              {!!fieldErrors.repeatPassword && <Text style={styles.fieldError}>{fieldErrors.repeatPassword}</Text>}
            </View>
            <Text style={styles.hintText}>Antes de avanzar verificamos que DNI, email y teléfono no estén registrados.</Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleContinue} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Continuar</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={loading}>
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 10 },
  stepCircleActive: { width: 32, height: 32, backgroundColor: '#7C3AED', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepCircleInactive: { width: 32, height: 32, backgroundColor: '#f3f4f6', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepTextActive: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  stepTextInactive: { color: '#9ca3af', fontSize: 14, fontWeight: '700' },
  progressBarActive: { flex: 1, height: 4, backgroundColor: '#7C3AED', borderRadius: 2 },
  progressBarInactive: { flex: 1, height: 4, backgroundColor: '#f3f4f6', borderRadius: 2 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280' },
  form: { gap: 20, flex: 1 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginLeft: 4 },
  inputContainer: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16 },
  input: { paddingVertical: 14, fontSize: 16, color: '#111827' },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FFF7F7' },
  fieldError: { color: '#B91C1C', fontSize: 12, fontWeight: '800', marginLeft: 4 },
  hintText: { fontSize: 13, color: '#6b7280', paddingHorizontal: 4, lineHeight: 19 },
  footer: { marginTop: 40, gap: 12 },
  button: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center', minHeight: 56, justifyContent: 'center' },
  disabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  backButton: { paddingVertical: 12, alignItems: 'center' },
  backButtonText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  errorBox: { borderWidth: 1, borderColor: '#EF4444', backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, marginBottom: 24 },
  errorTitle: { color: '#991B1B', fontWeight: '900', fontSize: 17, marginBottom: 8 },
  errorText: { color: '#7F1D1D', fontWeight: '700', fontSize: 15, lineHeight: 21 },
  errorDetail: { color: '#7F1D1D', fontSize: 14, lineHeight: 20, marginTop: 8 },
  forgotButton: { backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  forgotButtonText: { color: 'white', fontWeight: '800', fontSize: 14 },
});
