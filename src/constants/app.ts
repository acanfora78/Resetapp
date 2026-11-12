/**
 * Costanti dell'interfaccia (non regole del piano: quelle stanno in src/plan/rules.ts).
 */
export const APP = {
  /** Card "Attiva i promemoria": dopo "Non ora" sparisce per tot giorni. */
  NOTIF_CARD_SNOOZE_DAYS: 3,
  /** Dopo tot "Non ora" la card non compare più su Oggi (resta in Profilo). */
  NOTIF_CARD_MAX_SNOOZES: 3,
} as const;
