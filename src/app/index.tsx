import { Redirect } from 'expo-router';
import { useAuthStore } from '../auth/authStore';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { routeForRole } from '../auth/roles';

export default function Index() {
  const { loadToken, token, role } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      await loadToken();
      setReady(true);
    }
    prepare();
  }, [loadToken]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return token ? <Redirect href={routeForRole(role)} /> : <Redirect href="/login" />;
}
