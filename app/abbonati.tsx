import { router } from 'expo-router';

import { PaywallView } from '@/components/PaywallView';

/** Abbonamento dal Profilo (quando non è ancora attivo). */
export default function Subscribe() {
  return <PaywallView onUnlocked={async () => router.back()} />;
}
