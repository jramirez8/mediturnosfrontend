import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../auth/authStore';

export default function PacienteLayout() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const loadToken = useAuthStore((state) => state.loadToken);

  useEffect(() => {
    if (!hydrated) loadToken();
  }, [hydrated, loadToken]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  if (!token) return <Redirect href="/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
