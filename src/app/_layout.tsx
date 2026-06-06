import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

// Evita que Expo esconda el splash nativo antes de que la app esté lista.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        // Acá podés cargar lo importante antes de mostrar la app:
        // - fuentes
        // - idioma guardado
        // - token de SecureStore
        // - sesión de usuario
        // - SQLite inicial
        await new Promise((resolve) => setTimeout(resolve, 900));
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepareApp();
  }, []);

  if (!appReady) {
    // No renderizamos nada: mientras tanto se ve el splash nativo.
    return <View style={{ flex: 1, backgroundColor: "#0D2B44" }} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
