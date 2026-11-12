/**
 * Regole del piano automatico.
 *
 * Tutti gli orari e le durate stanno qui, così si possono correggere
 * dopo la validazione di un esperto senza toccare il resto del codice.
 * Le durate sono in minuti, gli orari nel formato "HH:mm".
 */
import type { PlanItemKey } from './types';

export const RULES = {
  /** Fabbisogno di sonno predefinito (7,5 h). */
  DEFAULT_SLEEP_NEED_MIN: 450,

  /** partenza = inizio_turno − tragitto − PREPARATION_MIN */
  PREPARATION_MIN: 30,

  /** Mattina e Giorno (12 h): sveglia = partenza − WAKE_BEFORE_DEPARTURE_MIN */
  WAKE_BEFORE_DEPARTURE_MIN: 30,
  /** Prima di Mattina e Giorno: a letto = sveglia − fabbisogno − FALL_ASLEEP_BUFFER_MIN */
  FALL_ASLEEP_BUFFER_MIN: 15,

  /** Stop caffeina = ora a letto − CAFFEINE_CUTOFF_BEFORE_BED_MIN */
  CAFFEINE_CUTOFF_BEFORE_BED_MIN: 8 * 60,

  /** Mattina e Giorno: pisolino breve se la notte prima si è dormito meno di questa soglia. */
  SHORT_SLEEP_THRESHOLD_MIN: 6 * 60,
  NAP_SHORT_DURATION_MIN: 20,
  /** Orario del pisolino breve ("primo pomeriggio"). */
  NAP_SHORT_TIME: '14:00',

  /**
   * Pomeriggio: a letto = rientro + DECOMPRESSION_MIN.
   * Giorno (12 h): a letto = il più tardi tra (sveglia del giorno dopo − fabbisogno)
   * e (rientro + DECOMPRESSION_MIN).
   */
  DECOMPRESSION_MIN: 60,

  /** Giorno (12 h): "Pausa + pasto leggero" a metà turno (frazione della durata). */
  SHIFT_BREAK_FRACTION: 0.5,

  /** Notte: promemoria pasto leggero a mezzanotte, se cade nel turno; altrimenti tot minuti dopo l'inizio. */
  NIGHT_MEAL_FALLBACK_AFTER_START_MIN: 60,

  /** Notte: pisolino che finisce NAP_PRE_NIGHT_END_BEFORE_DEPARTURE_MIN prima della partenza. */
  NAP_PRE_NIGHT_DURATION_MIN: 90,
  NAP_PRE_NIGHT_END_BEFORE_DEPARTURE_MIN: 60,

  /** Dopo la notte: durata della routine post-notte prima di dormire. */
  POST_NIGHT_ROUTINE_MIN: 30,
  /** Smonto: sonno breve dopo il rientro (3–4 h). */
  SMONTO_SLEEP_MIN: 210,
  /** Smonto: luce naturale nel pomeriggio. */
  NATURAL_LIGHT_TIME: '15:00',

  /** Riposo: attività fisica leggera, minuti dopo la sveglia. */
  LIGHT_ACTIVITY_AFTER_WAKE_MIN: 120,

  /** Se due azioni cadono alla stessa ora, la seconda viene spostata di tot minuti. */
  COLLISION_SHIFT_MIN: 15,
} as const;

/** Quali azioni vanno notificate. */
export const NOTIFY: Record<PlanItemKey, boolean> = {
  wake: true,
  wake_bright_light: true,
  wake_morning_light: true,
  bedtime: true,
  low_light: true,
  caffeine_stop: true,
  nap_short: true,
  shift_break: true,
  nap_pre_night: true,
  night_bright_light: false,
  night_caffeine_stop: true,
  night_light_meal: false,
  drive_alert: true,
  post_night_routine: true,
  day_sleep: true,
  short_sleep: true,
  natural_light: true,
  light_activity: false,
};
