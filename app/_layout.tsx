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

import { initCrashReporting, withCrashReporting } from '@/lib/crashReporting';
import { NightModeProvider } from '@/lib/nightMode';
import { listenNotificationTaps } from '@/lib/notifications';
import { OnboardingDraftProvider } from '@/lib/onboardingDraft';
import { PlanDataProvider } from '@/lib/planData';
import { SessionProvider, useSession } from '@/lib/session';
import { SubscriptionProvider, useSubscription } from '@/lib/subscription';
import { APP } from '@/constants/app';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
initCrashReporting();

function RootNavigator() {
  const colors = useColors();
  const { loading, session, profile } = useSession();
  const signedIn = !!session;
  const onboarded = !!profile?.onboarding_completato_at;
  // Consenso ai dati sul sonno (GDPR): se revocato, si vede solo la schermata del consenso.
  const consented = !!profile?.consenso_dati_at;
  const sub = useSubscription();
  // Con il blocco attivo, senza abbonamento si vede solo il paywall.
  const unlocked = !APP.PAYWALL_ENFORCED || sub.active;

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
      <Stack.Protected guard={signedIn && !loading && onboarded && !consented}>
        <Stack.Screen name="consenso" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !loading && onboarded && consented && APP.PAYWALL_ENFORCED && !sub.loading && !sub.active}>
        <Stack.Screen name="abbonamento-richiesto" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !loading && onboarded && consented && unlocked}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="giorno/[data]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="schema-turni" />
        <Stack.Screen name="impostazioni/turni" />
        <Stack.Screen name="impostazioni/sonno" />
        <Stack.Screen name="caffeina" />
        <Stack.Screen name="transizione" />
        <Stack.Screen name="evento" />
        <Stack.Screen name="routine" />
        <Stack.Screen name="pisolino" />
        <Stack.Screen name="guida/[id]" />
        <Stack.Screen name="vigilanza" options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
    </ThemeProvider>
  );
}

function RootLayout() {
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
            <SubscriptionProvider>
            <PlanDataProvider>
              <NightModeProvider>
                <StatusBar style="light" />
                <RootNavigator />
              </NightModeProvider>
            </PlanDataProvider>
            </SubscriptionProvider>
          </OnboardingDraftProvider>
        </SessionProvider>
    </SafeAreaProvider>
  );
}

export default withCrashReporting(RootLayout);
