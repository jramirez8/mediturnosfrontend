import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { purgeLegacyCache } from '../db/cache';
import { DEMO_MODE } from '../demo/demoApi';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initializeApp() {
      try {
        await purgeLegacyCache();
      } finally {
        if (mounted) setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    void initializeApp();
    return () => {
      mounted = false;
    };
  }, []);

  if (!appReady) {
    return <View style={{ flex: 1, backgroundColor: '#0D2B44' }} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        {DEMO_MODE ? <View style={{ minHeight: 30, backgroundColor: '#24104F', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}><Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 }}>MEDITURNOS · DEMO INTERACTIVA · DATOS 100% FICTICIOS</Text></View> : null}
        <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', animationDuration: 180 }} />
      </View>
    </>
  );
}
