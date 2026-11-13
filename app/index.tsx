import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { isDraftComplete, useOnboardingDraft } from '@/lib/onboardingDraft';
import { useSession } from '@/lib/session';
import { useSubscription } from '@/lib/subscription';
import { APP } from '@/constants/app';
import { useColors } from '@/theme';

/** Smista l'utente: accesso, onboarding o app. */
export default function Index() {
  const colors = useColors();
  const { loading, session, profile } = useSession();
  const { ready, draft } = useOnboardingDraft();
  const sub = useSubscription();

  if (loading || !ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!session) return <Redirect href="/benvenuto" />;
  if (!profile?.onboarding_completato_at) {
    // Account senza onboarding: se i passi sono già compilati sul telefono si va a "Salva il tuo piano".
    return <Redirect href={isDraftComplete(draft) ? '/salva' : '/lavoro'} />;
  }
  if (APP.PAYWALL_ENFORCED) {
    if (sub.loading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
    if (!sub.active) return <Redirect href="/abbonamento-richiesto" />;
  }
  return <Redirect href="/oggi" />;
}
