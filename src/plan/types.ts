export const SHIFT_CODES = ['M', 'P', 'N', 'S', 'R'] as const;
export type ShiftCode = (typeof SHIFT_CODES)[number];

/** Codici dei turni che hanno un orario di lavoro. */
export type WorkShiftCode = 'M' | 'P' | 'N';

/** Orario nel formato "HH:mm". */
export type ClockTime = string;

export interface ShiftHours {
  start: ClockTime;
  end: ClockTime;
}

export type ShiftHoursMap = Record<WorkShiftCode, ShiftHours>;

export type PlanItemKey =
  | 'wake'
  | 'bedtime'
  | 'bright_light'
  | 'morning_light'
  | 'low_light'
  | 'caffeine_stop'
  | 'nap_short'
  | 'nap_pre_night'
  | 'night_bright_light'
  | 'night_caffeine_stop'
  | 'night_light_meal'
  | 'dark_glasses'
  | 'drive_alert'
  | 'post_night_routine'
  | 'day_sleep'
  | 'short_sleep'
  | 'natural_light'
  | 'light_activity';

export interface PlanItem {
  /** Chiave stabile, usata per spunte e notifiche. */
  key: PlanItemKey;
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
