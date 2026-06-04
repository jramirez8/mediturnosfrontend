import { Redirect } from "expo-router";
import { useAuthStore } from "../auth/authStore";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { loadToken, token } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      await loadToken();
      setReady(true);
    }
    prepare();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  // Si ya tenemos token, vamos a la home del paciente, si no al login
  return token ? <Redirect href="/paciente" /> : <Redirect href="/login" />;
}
