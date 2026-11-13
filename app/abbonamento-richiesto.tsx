import { PaywallView } from '@/components/PaywallView';

/** Abbonamento scaduto o assente (solo con il blocco attivo): si sblocca con un acquisto o un ripristino. */
export default function SubscriptionRequired() {
  // Quando l'abbonamento risulta attivo, il navigatore riporta all'app da solo.
  return <PaywallView onUnlocked={async () => {}} />;
}
