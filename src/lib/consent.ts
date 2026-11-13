import { updateProfile } from './profile';
import { syncNotifications } from './notifications';
import { supabase } from './supabase';

/**
 * Dati sul sonno e sull'energia coperti dal consenso (art. 9 GDPR):
 * vengono cancellati quando il consenso viene revocato.
 * Turni, orari e impostazioni restano: servono all'account, non sono dati sul sonno.
 */
export const SLEEP_DATA_TABLES = ['sleep_logs', 'daily_scores', 'caffeine_logs', 'vigilance_tests'] as const;

/** Revoca il consenso: cancella i dati sul sonno e toglie il consenso dal profilo. */
export async function revokeSleepConsent(userId: string) {
  for (const table of SLEEP_DATA_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) throw error;
  }
  await updateProfile(userId, { consenso_dati_at: null });
  // Senza consenso l'app non mostra il piano: niente promemoria.
  await syncNotifications(null, null).catch(() => {});
}

/** Dà di nuovo il consenso. */
export async function giveSleepConsent(userId: string) {
  await updateProfile(userId, { consenso_dati_at: new Date().toISOString() });
}
