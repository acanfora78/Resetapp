export const SHIFT_CODES = ['M', 'P', 'N', 'G', 'S', 'R'] as const;
export type ShiftCode = (typeof SHIFT_CODES)[number];

/** Codici dei turni che hanno un orario di lavoro. G = Giorno (turni da 12 ore). */
export const WORK_SHIFT_CODES = ['M', 'P', 'N', 'G'] as const;
export type WorkShiftCode = (typeof WORK_SHIFT_CODES)[number];

export const isWorkShift = (c: ShiftCode | null): c is WorkShiftCode =>
  c === 'M' || c === 'P' || c === 'N' || c === 'G';

/** Tipo di organizzazione dei turni scelto al passo 3. */
export type ShiftMode = '8h' | '12h' | 'personalizzati';

/** Orario nel formato "HH:mm". */
export type ClockTime = string;

export interface ShiftHours {
  start: ClockTime;
  end: ClockTime;
}

export type ShiftHoursMap = Record<WorkShiftCode, ShiftHours>;

export type PlanItemKey =
  | 'wake'
  | 'wake_bright_light'
  | 'wake_morning_light'
  | 'bedtime'
  | 'low_light'
  | 'caffeine_stop'
  | 'nap_short'
  | 'shift_break'
  | 'nap_pre_night'
  | 'night_bright_light'
  | 'night_caffeine_stop'
  | 'night_light_meal'
  | 'drive_alert'
  | 'post_night_routine'
  | 'day_sleep'
  | 'short_sleep'
  | 'natural_light'
  | 'light_activity';

/**
 * Tipo di giornata, usato per scegliere la spiegazione ("perché") di ogni azione.
 * "first_night" vale anche per una notte singola.
 */
export type DayContext = 'M' | 'P' | 'N' | 'G' | 'S' | 'R' | 'first_night' | 'last_night' | 'first_rest';

export interface PlanItem {
  /** Chiave stabile, usata per spunte e notifiche. */
  key: PlanItemKey;
  /** Contesto per il testo della spiegazione. */
  context: DayContext;
  /** Orario assoluto (fuso del dispositivo). */
  time: Date;
  /** Se l'azione va notificata. */
  notify: boolean;
}

export interface PlanInput {
  /** Giorno del piano (qualsiasi ora: conta solo la data locale). */
  date: Date;
  prevShift: ShiftCode | null;
  shift: ShiftCode | null;
  nextShift: ShiftCode | null;
  shiftHours: ShiftHoursMap;
  commuteMin: number;
  preferredWake: ClockTime;
  sleepNeedMin: number;
  /** Minuti dormiti la notte prima, se registrati nel diario. */
  lastNightSleepMin?: number | null;
}
