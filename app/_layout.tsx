import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DarkTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NightModeProvider } from '@/lib/nightMode';
import { listenNotificationTaps } from '@/lib/notifications';
import { OnboardingDraftProvider } from '@/lib/onboardingDraft';
import { PlanDataProvider } from '@/lib/planData';
import { SessionProvider, useSession } from '@/lib/session';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const colors = useColors();
  const { loading, session, profile } = useSession();
  const signedIn = !!session;
  const onboarded = !!profile?.onboarding_completato_at;

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  // Tocco su una notifica: apre la schermata collegata (solo se l'app è pronta).
  useEffect(() => {
    if (!signedIn || !onboarded) return;
    return listenNotificationTaps((url) => router.push(url as never));
  }, [signedIn, onboarded]);

  // Il tema della navigazione segue la palette attiva (giorno o modalità notte).
  const navTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
      },
    }),
    [colors],
  );

  return (
    <ThemeProvider value={navTheme}>
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
        <Stack.Screen name="impostazioni/turni" />
        <Stack.Screen name="impostazioni/sonno" />
        <Stack.Screen name="caffeina" />
        <Stack.Screen name="transizione" />
        <Stack.Screen name="evento" />
        <Stack.Screen name="vigilanza" options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
    </ThemeProvider>
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
        <SessionProvider>
          <OnboardingDraftProvider>
            <PlanDataProvider>
              <NightModeProvider>
                <StatusBar style="light" />
                <RootNavigator />
              </NightModeProvider>
            </PlanDataProvider>
          </OnboardingDraftProvider>
        </SessionProvider>
    </SafeAreaProvider>
  );
}
