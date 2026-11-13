/** Debito di sonno e recupero nei giorni di riposo. Funzioni pure. */
import { addDays, startOfDay } from 'date-fns';

import { toISODate } from './cycle';
import { RULES } from './rules';
import type { ShiftCode } from './types';

export interface SleepEntry {
  /** "yyyy-MM-dd": giorno del risveglio. */
  data: string;
  minutes: number;
}

/** Debito degli ultimi giorni: somma di (fabbisogno − dormito), solo valori positivi. */
export function sleepDebt(
  entries: SleepEntry[],
  needMin: number,
  today: Date,
  days: number = RULES.SLEEP_DEBT_DAYS,
): { totalMin: number; perDay: { data: string; minutes: number | null; debtMin: number }[] } {
  const byDay = new Map<string, number>();
  for (const e of entries) byDay.set(e.data, (byDay.get(e.data) ?? 0) + e.minutes);
  const perDay = [];
  let totalMin = 0;
  for (let i = days - 1; i >= 0; i--) {
    const data = toISODate(addDays(startOfDay(today), -i));
    const minutes = byDay.get(data) ?? null;
    const debtMin = minutes === null ? 0 : Math.max(0, needMin - minutes);
    totalMin += debtMin;
    perDay.push({ data, minutes, debtMin });
  }
  return { totalMin, perDay };
}

/**
 * Distribuisce il debito sui prossimi giorni di riposo: al massimo
 * RECOVERY_MAX_EXTRA_MIN in più per notte. Restituisce minuti extra per data di risveglio.
 */
export function recoveryPlan(
  debtMin: number,
  today: Date,
  shiftOn: (d: Date) => ShiftCode | null,
  lookaheadDays = 7,
): Map<string, number> {
  const out = new Map<string, number>();
  let left = debtMin;
  for (let i = 1; i <= lookaheadDays && left > 0; i++) {
    const d = addDays(startOfDay(today), i);
    const code = shiftOn(d);
    const prev = shiftOn(addDays(d, -1));
    // Solo riposi veri (un riposo subito dopo la notte segue le regole dello smonto).
    if ((code === 'R' || code === null) && prev !== 'N') {
      const extra = Math.min(left, RULES.RECOVERY_MAX_EXTRA_MIN);
      out.set(toISODate(d), extra);
      left -= extra;
    }
  }
  return out;
}

/** Formato "−6 h 30". */
export function formatDebt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `−${h} h${m ? ` ${String(m).padStart(2, '0')}` : ''}`;
}
