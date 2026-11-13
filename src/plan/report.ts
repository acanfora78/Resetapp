/** Riepilogo mensile per il report PDF. Funzioni pure. */
import { endOfMonth, format, startOfMonth } from 'date-fns';

export interface MonthlyInput {
  month: Date;
  needMin: number;
  sleep: { data: string; minutes: number; energy: number }[];
  scores: { data: string; score: number }[];
  streak: number;
}

export interface MonthlySummary {
  from: string;
  to: string;
  nightsLogged: number;
  avgSleepMin: number | null;
  avgEnergy: number | null;
  nightsUnderNeed: number;
  avgScore: number | null;
  bestScore: number | null;
  streak: number;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function monthlySummary(i: MonthlyInput): MonthlySummary {
  const from = format(startOfMonth(i.month), 'yyyy-MM-dd');
  const to = format(endOfMonth(i.month), 'yyyy-MM-dd');
  const inMonth = <T extends { data: string }>(xs: T[]) => xs.filter((x) => x.data >= from && x.data <= to);
  const sleep = inMonth(i.sleep);
  const scores = inMonth(i.scores);
  const avgSleep = avg(sleep.map((s) => s.minutes));
  const avgEnergy = avg(sleep.map((s) => s.energy));
  const avgScore = avg(scores.map((s) => s.score));
  return {
    from,
    to,
    nightsLogged: sleep.length,
    avgSleepMin: avgSleep === null ? null : Math.round(avgSleep),
    avgEnergy: avgEnergy === null ? null : Math.round(avgEnergy * 10) / 10,
    nightsUnderNeed: sleep.filter((s) => s.minutes < i.needMin).length,
    avgScore: avgScore === null ? null : Math.round(avgScore),
    bestScore: scores.length ? Math.max(...scores.map((s) => s.score)) : null,
    streak: i.streak,
  };
}
