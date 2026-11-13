/** Test di vigilanza: statistiche ed esito. Funzioni pure. */
import { parseClock } from './time';
import { RULES } from './rules';

export type VigilanceOutcome = 'green' | 'yellow' | 'red';

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
}

/** Intervallo casuale tra due segnali (tra 1 e 4 secondi). `rand` in [0, 1). */
export const nextInterval = (rand: number) =>
  RULES.VIGILANCE_MIN_INTERVAL_MS + Math.floor(rand * (RULES.VIGILANCE_MAX_INTERVAL_MS - RULES.VIGILANCE_MIN_INTERVAL_MS + 1));

/** Un test vale per il riferimento se fatto in un giorno di riposo o a metà mattina. */
export function isBaselineEligible(doneAt: Date, isRestDay: boolean): boolean {
  if (isRestDay) return true;
  const mins = doneAt.getHours() * 60 + doneAt.getMinutes();
  const from = parseClock(RULES.VIGILANCE_BASELINE_FROM);
  const to = parseClock(RULES.VIGILANCE_BASELINE_TO);
  return mins >= from.h * 60 + from.m && mins <= to.h * 60 + to.m;
}

export interface PastTest {
  doneAt: Date;
  medianMs: number;
  eligible: boolean;
}

/** Riferimento personale: mediana dei primi 3 test validi; altrimenti quello generico. */
export function baseline(tests: PastTest[]): { ms: number; personal: boolean } {
  const first = tests
    .filter((t) => t.eligible)
    .sort((a, b) => a.doneAt.getTime() - b.doneAt.getTime())
    .slice(0, RULES.VIGILANCE_BASELINE_TESTS);
  if (first.length < RULES.VIGILANCE_BASELINE_TESTS) {
    return { ms: RULES.VIGILANCE_GENERIC_BASELINE_MS, personal: false };
  }
  return { ms: median(first.map((t) => t.medianMs)), personal: true };
}

export function outcome(medianMs: number, baselineMs: number): VigilanceOutcome {
  const pct = ((medianMs - baselineMs) / baselineMs) * 100;
  if (pct >= RULES.VIGILANCE_RED_PCT) return 'red';
  if (pct >= RULES.VIGILANCE_YELLOW_PCT) return 'yellow';
  return 'green';
}
