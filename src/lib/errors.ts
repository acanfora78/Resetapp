import it from '@/i18n/it';

/**
 * Testo d'errore da mostrare all'utente, con il dettaglio tecnico tra parentesi
 * (utile durante i test su TestFlight per capire cosa non ha funzionato).
 */
export function errorText(e: unknown): string {
  const detail =
    e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' ? e.message : '';
  return detail ? `${it.common.retry}\n\n(${detail})` : it.common.retry;
}
