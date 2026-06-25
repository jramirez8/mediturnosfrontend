import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native';
import { purgeLegacyCache } from '../db/cache';

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
      <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}
