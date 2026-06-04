import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore, useResolvedThemeMode } from '../theme/themeStore';
import { useLanguageStore } from '../i18n/languageStore';

function AppBoot() {
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const loadLanguage = useLanguageStore((state) => state.loadLanguage);

  useEffect(() => {
    loadTheme();
    loadLanguage();
  }, [loadTheme, loadLanguage]);

  return null;
}

export default function RootLayout() {
  const resolvedMode = useResolvedThemeMode();

  return (
    <>
      <AppBoot />
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: resolvedMode === 'dark' ? '#071312' : '#F6FAF9' },
        }}
      />
    </>
  );
}
