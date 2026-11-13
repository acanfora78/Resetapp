/**
 * Caffeina residua: stima educativa con decadimento esponenziale. Funzioni pure.
 * quantità(t) = Σ dose · 0,5^((t − assunzione) / emivita)
 */
import { addHours, addMinutes } from 'date-fns';

import { planForDay } from './context';
import type { PlanContext } from './context';
import { RULES } from './rules';
import { currentPlanDay } from './today';
import type { PlanItem } from './types';

export interface CaffeineDose {
  at: Date;
  mg: number;
}

const HOUR_MS = 3600_000;

/** Caffeina stimata in circolo (mg) all'istante `t`. */
export function caffeineAt(doses: CaffeineDose[], t: Date, halfLifeH: number = RULES.CAFFEINE_HALF_LIFE_H): number {
  let total = 0;
  for (const d of doses) {
    const dt = (t.getTime() - d.at.getTime()) / HOUR_MS;
    if (dt < 0) continue;
    total += d.mg * Math.pow(0.5, dt / halfLifeH);
  }
  return total;
}

/** Punti della curva da `from` per `hours` ore, ogni `stepMin` minuti. */
export function caffeineCurve(
  doses: CaffeineDose[],
  from: Date,
  hours: number = RULES.CAFFEINE_CHART_HOURS,
  stepMin = 15,
): { t: Date; mg: number }[] {
  const out: { t: Date; mg: number }[] = [];
  for (let m = 0; m <= hours * 60; m += stepMin) {
    const t = addMinutes(from, m);
    out.push({ t, mg: caffeineAt(doses, t) });
  }
  return out;
}

const SLEEP_KEYS: PlanItem['key'][] = ['bedtime', 'day_sleep', 'short_sleep'];

/** Il prossimo momento in cui il piano prevede di andare a dormire (entro 36 ore). */
export function nextSleepStart(ctx: PlanContext, now: Date): Date | null {
  const day = currentPlanDay(ctx, now);
  for (let i = 0; i <= 2; i++) {
    const items = planForDay(ctx, addHours(day, 24 * i));
    const sleep = items.find((it) => SLEEP_KEYS.includes(it.key) && it.time > now);
    if (sleep) return sleep.time;
  }
  return null;
}

/** L'orario "stop caffeina" ancora rilevante adesso (oggi), se c'è. */
export function caffeineStopTime(ctx: PlanContext, now: Date): Date | null {
  const items = planForDay(ctx, currentPlanDay(ctx, now));
  return items.find((i) => i.key === 'caffeine_stop' || i.key === 'night_caffeine_stop')?.time ?? null;
}

export interface CaffeineVerdict {
  /** 'ok' = sotto la soglia quando vai a letto; 'high' = ancora sopra. */
  status: 'ok' | 'high' | 'none';
  sleepAt: Date | null;
  mgAtSleep: number;
  /** Percentuale della caffeina presa nelle ultime 24 ore ancora in circolo a quell'ora. */
  percentAtSleep: number;
}

export function caffeineVerdict(ctx: PlanContext, doses: CaffeineDose[], now: Date): CaffeineVerdict {
  const recent = doses.filter((d) => now.getTime() - d.at.getTime() <= 24 * HOUR_MS);
  const sleepAt = nextSleepStart(ctx, now);
  if (recent.length === 0 || !sleepAt) return { status: 'none', sleepAt, mgAtSleep: 0, percentAtSleep: 0 };
  const mgAtSleep = caffeineAt(doses, sleepAt);
  const taken = recent.reduce((s, d) => s + d.mg, 0);
  return {
    status: mgAtSleep <= RULES.CAFFEINE_SLEEP_THRESHOLD_MG ? 'ok' : 'high',
    sleepAt,
    mgAtSleep,
    percentAtSleep: Math.round((mgAtSleep / taken) * 100),
  };
}

/** true se un caffè preso a `at` è dopo lo stop caffeina del piano. */
export function isAfterCaffeineStop(ctx: PlanContext, at: Date): boolean {
  const stop = caffeineStopTime(ctx, at);
  const sleep = nextSleepStart(ctx, at);
  return !!stop && at > stop && (!sleep || at < sleep);
}
