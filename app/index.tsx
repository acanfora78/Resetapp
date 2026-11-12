import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { isDraftComplete, useOnboardingDraft } from '@/lib/onboardingDraft';
import { useSession } from '@/lib/session';
import { colors } from '@/theme';

/** Smista l'utente: accesso, onboarding o app. */
export default function Index() {
  const { loading, session, profile } = useSession();
  const { ready, draft } = useOnboardingDraft();

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
  return <Redirect href="/oggi" />;
}
