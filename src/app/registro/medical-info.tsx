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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRegistrationStore } from '../../auth/registrationStore';
import { authService } from '../../api/authService';

export default function MedicalInfoScreen() {
  const { data, reset } = useRegistrationStore();
  const [loading, setLoading] = useState(false);

  const [obraSocial, setObraSocial] = useState('');
  const [obraSocialId, setObraSocialId] = useState('1');
  const [tipoSangre, setTipoSangre] = useState('O_POSITIVO');
  const [fechaNacimiento, setFechaNacimiento] = useState('1990-01-01');
  const [numAfiliado, setNumAfiliado] = useState('');
  const [clinicaCabecera, setClinicaCabecera] = useState('');
  const [doctorCabecera, setDoctorCabecera] = useState('');
  const [telefono, setTelefono] = useState('');

  const handleFinishRegistration = async () => {
    try {
      setLoading(true);

      const registrationData = {
        ...data,
        obraSocial,
        obraSocialId: Number(obraSocialId) || 1,
        tipoSangre,
        fechaNacimiento,
        numeroAfiliado: numAfiliado,
        numeroCarnet: numAfiliado,
        numeroHistoriaClinica: `HC-${data.dni || Date.now()}`,
        institucionCabecera: clinicaCabecera,
        hospitalClinicaCabecera: clinicaCabecera,
        medicoCabecera: doctorCabecera,
        doctorCabecera,
        telefono
      };

      await authService.register(registrationData);

      Alert.alert(
        "¡Registro exitoso!",
        "Tu cuenta ha sido creada correctamente. Ya podés iniciar sesión.",
        [{ text: "OK", onPress: () => {
          reset();
          router.replace('/login');
        }}]
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert("Error", error.response?.data?.message || error.response?.data?.error || "No se pudo completar el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Información médica</Text>
            <Text style={styles.subtitle}>Completá tus datos para finalizar</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Obra social</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de tu obra social"
                  value={obraSocial}
                  onChangeText={setObraSocial}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ID obra social</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="1 Particular · 2 IOMA · 4 OSDE"
                  value={obraSocialId}
                  onChangeText={setObraSocialId}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de nacimiento</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD"
                  value={fechaNacimiento}
                  onChangeText={setFechaNacimiento}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de sangre</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="O_POSITIVO"
                  value={tipoSangre}
                  onChangeText={setTipoSangre}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Número de carnet</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="N° de afiliado"
                  value={numAfiliado}
                  onChangeText={setNumAfiliado}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hospital o clínica de cabecera</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del hospital o clínica"
                  value={clinicaCabecera}
                  onChangeText={setClinicaCabecera}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Doctor de cabecera</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del doctor"
                  value={doctorCabecera}
                  onChangeText={setDoctorCabecera}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Tu número de teléfono"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleFinishRegistration}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Finalizar registro</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
  },
  form: {
    gap: 16,
    flex: 1,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  footer: {
    marginTop: 40,
    gap: 12,
  },
  button: {
    backgroundColor: '#0F766E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
