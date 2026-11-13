/**
 * Costanti dell'interfaccia (non regole del piano: quelle stanno in src/plan/rules.ts).
 */
export const APP = {
  /** Card "Attiva i promemoria": dopo "Non ora" sparisce per tot giorni. */
  NOTIF_CARD_SNOOZE_DAYS: 3,
  /** Dopo tot "Non ora" la card non compare più su Oggi (resta in Profilo). */
  NOTIF_CARD_MAX_SNOOZES: 3,

  /**
   * Blocco "senza abbonamento non si entra". Spento finché i prodotti non sono
   * configurati su App Store Connect e Google Play: altrimenti su TestFlight
   * l'app resterebbe bloccata.
   */
  PAYWALL_ENFORCED: false,

  /** Identificativi dei prodotti in abbonamento (uguali su App Store e Google Play). */
  IAP_PRODUCTS: {
    mensile: 'it.acanfora.reset.mensile',
    annuale: 'it.acanfora.reset.annuale',
  },

  /** Pagina per gestire o disdire gli abbonamenti. */
  MANAGE_SUBSCRIPTIONS_URL: {
    ios: 'https://apps.apple.com/account/subscriptions',
    android: 'https://play.google.com/store/account/subscriptions',
  },
} as const;
