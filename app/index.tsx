import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSession } from '@/lib/session';
import { colors } from '@/theme';

/** Smista l'utente: accesso, onboarding o app. */
export default function Index() {
  const { loading, session, profile } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!session) return <Redirect href="/benvenuto" />;
  if (!profile?.onboarding_completato_at) {
    const consentDone = !!profile?.consenso_dati_at && !!profile?.termini_accettati_at;
    return <Redirect href={consentDone ? '/lavoro' : '/consenso'} />;
  }
  return <Redirect href="/oggi" />;
}
