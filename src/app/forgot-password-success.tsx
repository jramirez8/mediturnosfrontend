import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MtButton, MtCard, MtScreen } from '../components/mediturnos';
import { useMtTheme } from '../theme/themeStore';

export default function ForgotPasswordSuccessScreen() {
  const theme = useMtTheme();
  return (
    <MtScreen scroll bottomSpace={false}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.success }]}>
          <Text style={styles.icon}>✓</Text>
        </View>
        <Text style={[styles.title, { color: theme.colors.ink }]}>Solicitud enviada</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Si los datos son correctos, te enviamos un código de 6 dígitos. Revisá entrada y spam/no deseado.</Text>

        <MtCard style={{ width: '100%', gap: 12 }}>
          <MtButton title="Ingresar código" onPress={() => router.replace('/reset-password')} />
          <MtButton title="Abrir correo" variant="secondary" onPress={() => Linking.openURL('mailto:')} />
          <MtButton title="Volver al login" variant="ghost" onPress={() => router.replace('/login')} />
        </MtCard>
      </View>
    </MtScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 28, gap: 16 },
  iconCircle: { width: 92, height: 92, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  icon: { color: 'white', fontSize: 44, fontWeight: '900' },
  title: { fontSize: 30, fontWeight: '900', textAlign: 'center', letterSpacing: -0.6 },
  subtitle: { fontSize: 15, fontWeight: '700', lineHeight: 22, textAlign: 'center', marginBottom: 14 },
});
