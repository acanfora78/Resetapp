import { addDays } from 'date-fns';

import { planForDay } from '@/plan/context';
import { fromISODate, toISODate } from '@/plan/cycle';
import { streak } from '@/plan/score';

import { fetchCheckIds } from './checks';
import type { ProfileRow } from './database.types';
import { loadPlanContext } from './plan';

export const STREAK_LOOKBACK_DAYS = 60;

/** Serie attuale: giorni di fila con almeno il 70% delle azioni del piano fatte. */
export async function loadStreak(profile: ProfileRow, today = new Date()): Promise<number> {
  const [ctx, ids] = await Promise.all([
    loadPlanContext(profile, today, 1, STREAK_LOOKBACK_DAYS + 2),
    fetchCheckIds(toISODate(addDays(today, -STREAK_LOOKBACK_DAYS)), toISODate(today)),
  ]);
  const doneByDay = new Map<string, number>();
  for (const id of ids) doneByDay.set(id.slice(0, 10), (doneByDay.get(id.slice(0, 10)) ?? 0) + 1);
  return streak(
    (iso) => ({ done: doneByDay.get(iso) ?? 0, total: planForDay(ctx, fromISODate(iso)).length }),
    today,
    STREAK_LOOKBACK_DAYS,
  );
}
