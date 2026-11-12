import { addDays } from 'date-fns';

import type { PlanContext } from '@/plan/context';
import { resolveShift, toISODate } from '@/plan/cycle';
import { RULES } from '@/plan/rules';
import { toClock } from '@/plan/time';

import type { ProfileRow } from './database.types';
import {
  fetchActivePattern,
  fetchShiftTypes,
  fetchShifts,
  shiftHoursFromTypes,
  toCyclePattern,
} from './shifts';

export { planForDay } from '@/plan/context';
export type { PlanContext } from '@/plan/context';

/** Carica turni, schema e orari da due giorni prima fino ai giorni coperti dalle notifiche. */
export async function loadPlanContext(profile: ProfileRow, around: Date): Promise<PlanContext> {
  const [types, shifts, pattern] = await Promise.all([
    fetchShiftTypes(),
    fetchShifts(toISODate(addDays(around, -2)), toISODate(addDays(around, RULES.NOTIFICATION_DAYS_AHEAD + 2))),
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
