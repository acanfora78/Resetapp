import { addDays } from 'date-fns';

import type { PlanContext } from '@/plan/context';
import { PLAN_CATEGORIES } from '@/plan/rules';
import type { PlanPrefs } from '@/plan/types';
import { resolveShift, toISODate } from '@/plan/cycle';
import { RULES } from '@/plan/rules';
import { eventPlanItems } from '@/plan/events';
import { recoveryPlan, sleepDebt } from '@/plan/sleepDebt';
import { toClock } from '@/plan/time';

import type { ProfileRow } from './database.types';
import {
  fetchActivePattern,
  fetchShiftTypes,
  fetchShifts,
  shiftHoursFromTypes,
  toCyclePattern,
} from './shifts';
import { fetchEvents, fetchSleepLogs } from './userData';

export { planForDay } from '@/plan/context';
export type { PlanContext } from '@/plan/context';

/** Categorie facoltative del piano salvate nel profilo (mancante = accesa). */
export function planPrefs(profile: Pick<ProfileRow, 'preferenze_piano'> | null): PlanPrefs {
  const raw = (profile?.preferenze_piano ?? {}) as Record<string, unknown>;
  const out: PlanPrefs = {};
  for (const c of PLAN_CATEGORIES) if (raw[c] === false) out[c] = false;
  return out;
}

/** Carica turni, schema e orari da due giorni prima fino ai giorni coperti dalle notifiche. */
export async function loadPlanContext(
  profile: ProfileRow,
  around: Date,
  daysAhead: number = RULES.NOTIFICATION_DAYS_AHEAD + 2,
  daysBack = 2,
): Promise<PlanContext> {
  const [types, shifts, pattern] = await Promise.all([
    fetchShiftTypes(),
    fetchShifts(toISODate(addDays(around, -daysBack)), toISODate(addDays(around, daysAhead))),
    fetchActivePattern(),
  ]);
  const stored = new Map(shifts.map((s) => [s.data, s.codice]));
  const cycle = pattern ? toCyclePattern(pattern) : null;
  const sleepNeedMin = profile.fabbisogno_sonno_min || RULES.DEFAULT_SLEEP_NEED_MIN;
  const base: PlanContext = {
    shiftHours: shiftHoursFromTypes(types),
    commuteMin: profile.tragitto_min,
    preferredWake: toClock(profile.sveglia_preferita, '08:00'),
    sleepNeedMin,
    shiftOn: (d) => resolveShift(stored, cycle, d),
    prefs: planPrefs(profile),
  };

  // Diario ed eventi: se non si caricano, il piano resta quello di base.
  const [logs, events] = await Promise.all([
    fetchSleepLogs(toISODate(addDays(around, -RULES.SLEEP_DEBT_DAYS))).catch(() => []),
    fetchEvents(addDays(around, -2), addDays(around, daysAhead)).catch(() => []),
  ]);
  const debt = sleepDebt(logs.map((l) => ({ data: l.data, minutes: l.minuti_dormiti })), sleepNeedMin, around);
  const recovery = recoveryPlan(debt.totalMin, around, base.shiftOn);
  const eventItems = eventPlanItems(
    base,
    events.map((e) => ({ title: e.titolo, start: new Date(e.inizio), end: new Date(e.fine) })),
  );
  return {
    ...base,
    recoveryOn: (d) => recovery.get(toISODate(d)) ?? 0,
    extraItems: (d) => eventItems.get(toISODate(d)) ?? [],
  };
}
