/**
 * Lettura delle offerte di prova gratuita dai prodotti dello store. Funzioni pure.
 * La durata della prova si configura su App Store Connect / Play Console
 * (offerta introduttiva "gratuita"): l'app la mostra solo se lo store la propone.
 */

interface OfferLike {
  type?: string | null;
  paymentMode?: string | null;
  period?: { unit?: string | null; value?: number | null } | null;
  periodCount?: number | null;
  offerTokenAndroid?: string | null;
}

const UNIT_DAYS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

/** Giorni di prova gratuita di un'offerta, o null se non è una prova gratuita. */
export function freeTrialDays(offer: OfferLike | null | undefined): number | null {
  if (!offer || offer.paymentMode !== 'free-trial') return null;
  const unit = UNIT_DAYS[offer.period?.unit ?? ''];
  const value = offer.period?.value ?? 0;
  if (!unit || value <= 0) return null;
  return unit * value * Math.max(1, offer.periodCount ?? 1);
}

/** La prima offerta di prova gratuita tra quelle del prodotto. */
export function findFreeTrial<T extends OfferLike>(offers: readonly T[] | null | undefined): T | null {
  return (offers ?? []).find((o) => freeTrialDays(o) !== null) ?? null;
}
