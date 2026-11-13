/** Punteggio di recupero (0–100) e serie. Funzioni pure. */
import { addDays, startOfDay } from 'date-fns';

import { toISODate } from './cycle';
import { RULES } from './rules';

export interface ScoreInput {
  /** Minuti dormiti (null = non registrati). */
  sleptMin: number | null;
  needMin: number;
  /** Energia 1–5 (null = non registrata). */
  energy: number | null;
  /** Azioni del piano fatte e totali. */
  done: number;
  total: number;
}

/**
 * 50%: ore dormite rispetto al fabbisogno (al massimo 100%);
 * 30%: energia (1 = 0 punti, 5 = massimo);
 * 20%: percentuale di azioni completate.
 * Se manca il diario della notte il punteggio non si calcola (null).
 */
export function recoveryScore(i: ScoreInput): number | null {
  if (i.sleptMin === null || i.energy === null) return null;
  const sleep = Math.min(1, Math.max(0, i.sleptMin / i.needMin));
  const energy = Math.min(1, Math.max(0, (i.energy - 1) / 4));
  const plan = i.total > 0 ? Math.min(1, i.done / i.total) : 0;
  const score =
    sleep * RULES.SCORE_WEIGHT_SLEEP + energy * RULES.SCORE_WEIGHT_ENERGY + plan * RULES.SCORE_WEIGHT_PLAN;
  return Math.round(score);
}

/**
 * Serie: giorni consecutivi, fino a ieri (oggi conta se già raggiunto), con
 * almeno STREAK_MIN_DONE_PCT delle azioni fatte. `progress` va da data a {fatte, totali}.
 */
export function streak(progress: (dataISO: string) => { done: number; total: number }, today: Date, maxDays = 365): number {
  const ok = (d: Date) => {
    const p = progress(toISODate(d));
    return p.total > 0 && (p.done / p.total) * 100 >= RULES.STREAK_MIN_DONE_PCT;
  };
  let count = ok(startOfDay(today)) ? 1 : 0;
  for (let i = 1; i <= maxDays; i++) {
    if (!ok(addDays(startOfDay(today), -i))) break;
    count++;
  }
  return count;
}
