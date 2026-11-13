import { addDays } from 'date-fns';

import { computePlan } from './engine';
import type { ClockTime, PlanItem, ShiftCode, ShiftHoursMap } from './types';

/** Dati necessari per calcolare il piano di alcuni giorni. */
export interface PlanContext {
  shiftHours: ShiftHoursMap;
  commuteMin: number;
  preferredWake: ClockTime;
  sleepNeedMin: number;
  shiftOn: (d: Date) => ShiftCode | null;
}

export function planForDay(ctx: PlanContext, day: Date): PlanItem[] {
  return computePlan({
    date: day,
    prevShift: ctx.shiftOn(addDays(day, -1)),
    shift: ctx.shiftOn(day),
    nextShift: ctx.shiftOn(addDays(day, 1)),
    shiftAfterNext: ctx.shiftOn(addDays(day, 2)),
    shiftHours: ctx.shiftHours,
    commuteMin: ctx.commuteMin,
    preferredWake: ctx.preferredWake,
    sleepNeedMin: ctx.sleepNeedMin,
  });
}

export interface PlanPreview {
  tomorrowShift: ShiftCode | null;
  /** Solo l'ora di andare a letto di stasera. */
  tonight: PlanItem | null;
  /** Il piano di domani, senza l'ora di andare a letto di domani sera. */
  tomorrow: PlanItem[];
}

/** Anteprima del piano di domani (passo 7 dell'onboarding). */
export function buildPreview(ctx: PlanContext, now: Date): PlanPreview {
  const tomorrowDay = addDays(now, 1);
  return {
    tomorrowShift: ctx.shiftOn(tomorrowDay),
    tonight: planForDay(ctx, now).find((i) => i.key === 'bedtime') ?? null,
    tomorrow: planForDay(ctx, tomorrowDay).filter((i) => i.key !== 'bedtime'),
  };
}
