import { addDays } from 'date-fns';

import { mainPlanForDay } from '@/plan/context';
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
  // Contano solo le azioni visibili e attive (non quelle in "Altri consigli").
  return streak(
    (iso) => {
      const items = mainPlanForDay(ctx, fromISODate(iso)).filter((i) => !i.tip);
      const done = items.filter((i) => ids.has(`${iso}_${i.key}`)).length;
      return { done, total: items.length };
    },
    today,
    STREAK_LOOKBACK_DAYS,
  );
}
