/**
 * Costanti dell'interfaccia (non regole del piano: quelle stanno in src/plan/rules.ts).
 */
export const APP = {
  /** Card "Attiva i promemoria": dopo "Non ora" sparisce per tot giorni. */
  NOTIF_CARD_SNOOZE_DAYS: 3,
  /** Dopo tot "Non ora" la card non compare più su Oggi (resta in Profilo). */
  NOTIF_CARD_MAX_SNOOZES: 3,

  /**
   * Blocco "senza abbonamento non si entra" (anche la prova gratuita conta come
   * abbonamento attivo). Acceso dalla versione inviata ad App Store.
   */
  PAYWALL_ENFORCED: true,

  /**
   * Acquisti attivi (prodotti creati sugli store). Con il blocco spento si può
   * comprare dal paywall o da Profilo → Abbonati, ma anche saltare ("Più tardi").
   */
  PURCHASES_ENABLED: true,

  /**
   * Identificativi dei prodotti in abbonamento, gruppo "Reset Premium" (uguali su
   * App Store e Google Play e in supabase/functions/_shared/stores.ts).
   * Il vecchio "it.acanfora.reset.mensile", creato per errore, NON va usato.
   */
  IAP_PRODUCTS: {
    mensile: 'it.acanfora.reset.premium.mensile',
    annuale: 'it.acanfora.reset.premium.annuale',
  },

  /**
   * Email del supporto e della privacy (Profilo → Aiuto, pagine web, store).
   */
  SUPPORT_EMAIL: 'morganacanfora5@gmail.com',

  /** Pagina per gestire o disdire gli abbonamenti. */
  MANAGE_SUBSCRIPTIONS_URL: {
    ios: 'https://apps.apple.com/account/subscriptions',
    android: 'https://play.google.com/store/account/subscriptions',
  },
} as const;
