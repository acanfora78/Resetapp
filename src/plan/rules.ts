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

  /**
   * Schermata Oggi: il piano di ieri resta visibile fino a tot minuti dopo la sua
   * ultima azione (es. turno di notte in corso dopo mezzanotte), se il piano di oggi
   * non è ancora cominciato.
   */
  PLAN_DAY_GRACE_MIN: 60,

  /** Modalità notte automatica: da inizio turno di notte fino a rientro + routine + tot minuti. */
  NIGHT_MODE_AFTER_HOMECOMING_MIN: 30,

  /** Notifiche: giorni programmati in avanti e massimo di notifiche in attesa (limite iOS: 64). */
  NOTIFICATION_DAYS_AHEAD: 7,
  NOTIFICATION_MAX_PENDING: 60,

  // --- Transizioni tra turni -------------------------------------------------
  /** Spostamento massimo del sonno in un giorno durante una transizione. */
  TRANSITION_MAX_SHIFT_MIN: 90,
  /** Giorni in avanti in cui cercare transizioni. */
  TRANSITION_LOOKAHEAD_DAYS: 7,
  /** La card "Cambio turno in arrivo" compare quando la transizione è entro tot giorni. */
  TRANSITION_CARD_DAYS: 3,
  /** Promemoria della transizione: la sera prima, a quest'ora. */
  TRANSITION_NOTIFY_TIME: '19:00',

  // --- Caffeina (stime educative) ---------------------------------------------
  /** Emivita della caffeina, in ore. */
  CAFFEINE_HALF_LIFE_H: 5,
  /** Sotto questa quantità stimata (mg) la caffeina non dovrebbe disturbare il sonno. */
  CAFFEINE_SLEEP_THRESHOLD_MG: 50,
  /** Ore mostrate nel grafico. */
  CAFFEINE_CHART_HOURS: 24,

  // --- "Posso andarci?" -------------------------------------------------------
  /** Sotto queste ore di sonno prima di un turno l'evento è sconsigliato. */
  EVENT_MIN_SLEEP_MIN: 5 * 60,
  /** Nei giorni liberi la sveglia si può spostare al massimo di tot minuti. */
  EVENT_MAX_WAKE_SHIFT_MIN: 90,
  /** Pisolino suggerito prima di un evento serale che accorcia il sonno. */
  EVENT_NAP_MIN: 20,
  /** Il pisolino suggerito finisce tot minuti prima dell'inizio dell'evento. */
  EVENT_NAP_END_BEFORE_MIN: 120,

  // --- Test di vigilanza --------------------------------------------------------
  VIGILANCE_DURATION_S: 30,
  VIGILANCE_MIN_INTERVAL_MS: 1000,
  VIGILANCE_MAX_INTERVAL_MS: 4000,
  /** Riferimento generico finché non ci sono 3 test validi. */
  VIGILANCE_GENERIC_BASELINE_MS: 300,
  /** Test validi per il riferimento personale: nei giorni di riposo o a metà mattina. */
  VIGILANCE_BASELINE_TESTS: 3,
  VIGILANCE_BASELINE_FROM: '10:00',
  VIGILANCE_BASELINE_TO: '12:00',
  /** Soglie rispetto al riferimento: +20% giallo, +40% rosso. */
  VIGILANCE_YELLOW_PCT: 20,
  VIGILANCE_RED_PCT: 40,
  /** Promemoria del test: tot minuti prima della fine del turno di notte. */
  VIGILANCE_NOTIFY_BEFORE_END_MIN: 10,

  // --- Debito di sonno e recupero ---------------------------------------------
  SLEEP_DEBT_DAYS: 7,
  /** Recupero nei giorni di riposo: al massimo tot minuti in più a notte… */
  RECOVERY_MAX_EXTRA_MIN: 90,
  /** …e sveglia non oltre quest'ora. */
  RECOVERY_LATEST_WAKE: '10:00',
} as const;

/** Porzioni di caffeina (mg) per tipo di bevanda: valori indicativi, modificabili. */
export const CAFFEINE_DOSES_MG = {
  espresso: 65,
  moka: 100,
  energy: 80,
  te_cola: 40,
} as const;
export type CaffeineType = keyof typeof CAFFEINE_DOSES_MG;

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
  event: false,
  event_nap: true,
  event_caffeine: true,
};
