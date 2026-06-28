import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from './authStore';
import { AppRole, isAllowedRole } from './roles';

export function RoleGuard({ allowed }: Readonly<{ allowed: AppRole[] }>) {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const hydrated = useAuthStore((state) => state.hydrated);
  const loadToken = useAuthStore((state) => state.loadToken);

  useEffect(() => {
    if (!hydrated) loadToken();
  }, [hydrated, loadToken]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!token) return <Redirect href="/login" />;
  if (!isAllowedRole(role, allowed)) return <Redirect href="/no-autorizado" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
