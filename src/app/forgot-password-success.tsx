import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function ForgotPasswordSuccessScreen() {
  const handleOpenEmail = () => {
    Linking.openURL('mailto:');
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={{color: 'white', fontSize: 40}}>✅</Text>
        </View>

        <Text style={styles.title}>¡Solicitud enviada!</Text>
        <Text style={styles.subtitle}>
          Te enviamos un enlace para crear una nueva contraseña. Revisá la bandeja de entrada y también spam/no deseado.
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleOpenEmail}
          >
            <Text style={styles.buttonText}>Ir al correo</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.backButtonText}>Volver al login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconCircle: { width: 100, height: 100, backgroundColor: '#22c55e', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  footer: { width: '100%', gap: 12 },
  button: { backgroundColor: '#0F766E', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  backButton: { paddingVertical: 12, alignItems: 'center' },
  backButtonText: { color: '#0F766E', fontSize: 15, fontWeight: '600' },
});
