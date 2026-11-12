import { addDays } from 'date-fns';

import { computePlan } from '@/plan/engine';
import { resolveShift, toISODate } from '@/plan/cycle';
import { RULES } from '@/plan/rules';
import { toClock } from '@/plan/time';
import type { PlanItem, ShiftCode, ShiftHoursMap } from '@/plan/types';

import type { ProfileRow } from './database.types';
import {
  fetchActivePattern,
  fetchShiftTypes,
  fetchShifts,
  shiftHoursFromTypes,
  toCyclePattern,
} from './shifts';

/** Dati necessari per calcolare il piano di alcuni giorni. */
export interface PlanContext {
  shiftHours: ShiftHoursMap;
  commuteMin: number;
  preferredWake: string;
  sleepNeedMin: number;
  shiftOn: (d: Date) => ShiftCode | null;
}

/** Carica turni, schema e orari intorno al giorno indicato. */
export async function loadPlanContext(profile: ProfileRow, around: Date): Promise<PlanContext> {
  const [types, shifts, pattern] = await Promise.all([
    fetchShiftTypes(),
    fetchShifts(toISODate(addDays(around, -2)), toISODate(addDays(around, 3))),
    fetchActivePattern(),
  ]);
  const stored = new Map(shifts.map((s) => [s.data, s.codice]));
  const cycle = pattern ? toCyclePattern(pattern) : null;
  return {
    shiftHours: shiftHoursFromTypes(types),
    commuteMin: profile.tragitto_min,
    preferredWake: toClock(profile.sveglia_preferita, '08:00'),
    sleepNeedMin: profile.fabbisogno_sonno_min || RULES.DEFAULT_SLEEP_NEED_MIN,
    shiftOn: (d) => resolveShift(stored, cycle, d),
  };
}

export function planForDay(ctx: PlanContext, day: Date): PlanItem[] {
  return computePlan({
    date: day,
    prevShift: ctx.shiftOn(addDays(day, -1)),
    shift: ctx.shiftOn(day),
    nextShift: ctx.shiftOn(addDays(day, 1)),
    shiftHours: ctx.shiftHours,
    commuteMin: ctx.commuteMin,
    preferredWake: ctx.preferredWake,
    sleepNeedMin: ctx.sleepNeedMin,
  });
}
