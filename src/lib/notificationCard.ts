/** Quando mostrare la card "Attiva i promemoria" su Oggi. Funzioni pure. */
import { addDays } from 'date-fns';

import { APP } from '@/constants/app';

/** Preferenze salvate in profiles.notifiche. */
export interface NotificationPrefs {
  /** undefined = l'utente non ha ancora scelto. */
  abilitate?: boolean;
  /** Quante volte ha toccato "Non ora". */
  rimandi?: number;
  /** Ultimo "Non ora" (ISO). */
  rimandato_at?: string;
}

export type NotificationCardState = 'full' | 'compact' | 'hidden';

export function notificationCardState(prefs: NotificationPrefs, now: Date): NotificationCardState {
  if (prefs.abilitate === true) return 'hidden';
  // Vecchie installazioni: "Non ora" salvava solo abilitate = false.
  const snoozes = prefs.rimandi ?? (prefs.abilitate === false ? 1 : 0);
  if (snoozes >= APP.NOTIF_CARD_MAX_SNOOZES) return 'hidden';
  if (prefs.rimandato_at && now < addDays(new Date(prefs.rimandato_at), APP.NOTIF_CARD_SNOOZE_DAYS)) {
    return 'hidden';
  }
  return snoozes >= 1 ? 'compact' : 'full';
}

/** Nuove preferenze dopo un "Non ora". */
export function snoozeNotificationCard(prefs: NotificationPrefs, now: Date): NotificationPrefs {
  const snoozes = prefs.rimandi ?? (prefs.abilitate === false ? 1 : 0);
  return { ...prefs, rimandi: snoozes + 1, rimandato_at: now.toISOString() };
}
