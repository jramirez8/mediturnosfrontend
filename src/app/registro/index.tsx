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

export default function RegisterStep1() {
  const { data, setStep1 } = useRegistrationStore();
  const [nombre, setNombre] = useState(data.nombre);
  const [apellido, setApellido] = useState(data.apellido);
  const [dni, setDni] = useState(data.dni);

  const handleContinue = () => {
    if (!nombre || !apellido || !dni) {
      Alert.alert("Error", "Por favor completá todos los campos.");
      return;
    }
    setStep1(nombre, apellido, dni);
    router.push('/registro/step2');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.progressContainer}>
            <View style={styles.stepCircleActive}>
              <Text style={styles.stepTextActive}>1</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: '50%' }]} />
            </View>
            <View style={styles.stepCircleInactive}>
              <Text style={styles.stepTextInactive}>2</Text>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta · Paso 1</Text>
            <Text style={styles.subtitle}>Contanos quién sos</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellido</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Tu apellido"
                  value={apellido}
                  onChangeText={setApellido}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DNI</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Tu DNI"
                  value={dni}
                  onChangeText={setDni}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.infoBox}>
               <Text style={{fontSize: 18}}>🛡️</Text>
              <Text style={styles.infoText}>Tus datos están protegidos</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Continuar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Volver al login</Text>
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
  stepCircleInactive: { width: 32, height: 32, backgroundColor: '#f3f4f6', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepTextActive: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  stepTextInactive: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  progressBarBackground: { flex: 1, height: 4, backgroundColor: '#f3f4f6', borderRadius: 2 },
  progressBarFill: { height: 4, backgroundColor: '#0F766E', borderRadius: 2 },
  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280' },
  form: { gap: 20, flex: 1 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#111827' },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 12, borderRadius: 12, gap: 10, marginTop: 8 },
  infoText: { color: '#6b21a8', fontSize: 13, fontWeight: '500' },
  footer: { marginTop: 40, gap: 12 },
  button: { backgroundColor: '#0F766E', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  backButton: { paddingVertical: 12, alignItems: 'center' },
  backButtonText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },
});
