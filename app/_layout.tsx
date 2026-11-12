import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingDraftProvider } from '@/lib/onboardingDraft';
import { SessionProvider, useSession } from '@/lib/session';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

function RootNavigator() {
  const { loading, session, profile } = useSession();
  const signedIn = !!session;
  const onboarded = !!profile?.onboarding_completato_at;

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      {/* L'onboarding si fa anche senza account: la registrazione è al passo 8. */}
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !loading && onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="giorno/[data]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="schema-turni" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <SessionProvider>
          <OnboardingDraftProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </OnboardingDraftProvider>
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
