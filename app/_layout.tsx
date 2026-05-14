import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { hydrateSession } from '@/lib/auth/session';

export const unstable_settings = {
  anchor: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Restore persisted session from secure storage on app start (SEC-04)
  useEffect(() => {
    hydrateSession();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Auth */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        {/* 4E Global Admin */}
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        {/* 4E Learn & Play */}
        <Stack.Screen name="(learn)" options={{ headerShown: false }} />
        {/* 4E In-Action (Teachers) */}
        <Stack.Screen name="(inaction)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
