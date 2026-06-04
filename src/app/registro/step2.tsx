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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRegistrationStore } from '../../auth/registrationStore';

export default function RegisterStep2() {
  const { data, setStep2 } = useRegistrationStore();
  const [email, setEmail] = useState(data.email);
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const handleContinue = () => {
    if (!email || !password || !repeatPassword) {
      Alert.alert("Error", "Por favor completá todos los campos.");
      return;
    }
    if (password !== repeatPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setStep2(email, password, repeatPassword);
    router.push('/registro/medical-info');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.progressContainer}>
            <View style={styles.stepCircleActive}><Text style={styles.stepTextActive}>1</Text></View>
            <View style={styles.progressBarActive} />
            <View style={styles.stepCircleActive}><Text style={styles.stepTextActive}>2</Text></View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta · Paso 2</Text>
            <Text style={styles.subtitle}>Creá tu acceso</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="tu.email@ejemplo.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresá tu contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Repetir contraseña</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Repetí tu contraseña"
                  value={repeatPassword}
                  onChangeText={setRepeatPassword}
                  secureTextEntry
                />
              </View>
            </View>
            <Text style={styles.hintText}>La clave debe tener al menos 8 caracteres</Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continuar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 12 },
  stepCircleActive: { width: 32, height: 32, backgroundColor: '#0F766E', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepTextActive: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  progressBarActive: { flex: 1, height: 4, backgroundColor: '#0F766E', borderRadius: 2 },
  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280' },
  form: { gap: 20, flex: 1 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginLeft: 4 },
  inputContainer: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16 },
  input: { paddingVertical: 14, fontSize: 16, color: '#111827' },
  hintText: { fontSize: 13, color: '#6b7280', paddingHorizontal: 4 },
  footer: { marginTop: 40, gap: 12 },
  button: { backgroundColor: '#0F766E', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  backButton: { paddingVertical: 12, alignItems: 'center' },
  backButtonText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },
});
