import { Redirect } from 'expo-router';

import { PaywallView } from '@/components/PaywallView';
import { useOnboardingDraft } from '@/lib/onboardingDraft';
import { updateProfile } from '@/lib/profile';
import { useSession } from '@/lib/session';

/** Onboarding, passo 9: abbonamento. Alla fine l'onboarding è completato. */
export default function Paywall() {
  const { userId, refreshProfile } = useSession();
  const { reset } = useOnboardingDraft();
  if (!userId) return <Redirect href="/salva" />;
  return (
    <PaywallView
      step={9}
      onUnlocked={async () => {
        await updateProfile(userId, { onboarding_completato_at: new Date().toISOString() });
        await reset();
        await refreshProfile(); // il navigatore passa automaticamente all'app
      }}
    />
  );
}
