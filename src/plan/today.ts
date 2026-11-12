/**
 * Logica della schermata Oggi, della modalità notte e delle notifiche. Funzioni pure.
 */
import { addDays, addMinutes, startOfDay } from 'date-fns';

import { planForDay } from './context';
import type { PlanContext } from './context';
import { toISODate } from './cycle';
import { RULES } from './rules';
import { shiftWindow } from './time';
import type { DayContext, PlanItem, PlanItemKey } from './types';

/**
 * Il giorno del piano da mostrare adesso. Di solito è oggi; resta "ieri" finché
 * il piano di ieri non è finito (es. turno di notte dopo mezzanotte, ora di andare
 * a letto dopo mezzanotte) e quello di oggi non è ancora cominciato.
 */
export function currentPlanDay(ctx: PlanContext, now: Date): Date {
  const today = startOfDay(now);
  const yesterday = addDays(today, -1);
  const yItems = planForDay(ctx, yesterday);
  const tItems = planForDay(ctx, today);
  const yLast = yItems[yItems.length - 1]?.time;
  const tFirst = tItems[0]?.time;
  if (yLast && now <= addMinutes(yLast, RULES.PLAN_DAY_GRACE_MIN) && (!tFirst || now < tFirst)) {
    return yesterday;
  }
  return today;
}

/** La prossima azione non ancora fatta, a partire da adesso. */
export function nextPendingItem(items: PlanItem[], done: ReadonlySet<PlanItemKey>, now: Date): PlanItem | null {
  return items.find((i) => !done.has(i.key) && i.time >= addMinutes(now, -30)) ?? null;
}

/** true durante un turno di notte, fino al rientro a casa e alla routine post-notte. */
export function isNightShiftTime(ctx: PlanContext, now: Date): boolean {
  const today = startOfDay(now);
  for (const day of [addDays(today, -1), today]) {
    if (ctx.shiftOn(day) !== 'N') continue;
    const w = shiftWindow(day, ctx.shiftHours.N.start, ctx.shiftHours.N.end);
    const until = addMinutes(
      w.end,
      ctx.commuteMin + RULES.POST_NIGHT_ROUTINE_MIN + RULES.NIGHT_MODE_AFTER_HOMECOMING_MIN,
    );
    if (now >= w.start && now <= until) return true;
  }
  return false;
}

export interface ScheduledReminder {
  /** Identificativo stabile: "yyyy-MM-dd_chiave" (giorno del piano). */
  id: string;
  planDay: string;
  key: PlanItemKey;
  context: DayContext;
  date: Date;
}

/**
 * Promemoria da programmare: azioni da notificare dei prossimi giorni, solo nel
 * futuro, escluse quelle già spuntate. Ordinate per orario, al massimo `max`.
 */
export function notificationSchedule(
  ctx: PlanContext,
  now: Date,
  doneIds: ReadonlySet<string> = new Set(),
  daysAhead: number = RULES.NOTIFICATION_DAYS_AHEAD,
  max: number = RULES.NOTIFICATION_MAX_PENDING,
): ScheduledReminder[] {
  const today = startOfDay(now);
  const out: ScheduledReminder[] = [];
  for (let i = -1; i < daysAhead; i++) {
    const day = addDays(today, i);
    const planDay = toISODate(day);
    for (const item of planForDay(ctx, day)) {
      const id = `${planDay}_${item.key}`;
      if (!item.notify || item.time <= now || doneIds.has(id)) continue;
      out.push({ id, planDay, key: item.key, context: item.context, date: item.time });
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, max);
}

/**
 * Ordine della lista di Oggi: in cima la prossima azione da fare, poi le altre
 * da fare in ordine di orario; le azioni fatte vanno nel gruppo "Fatte".
 */
export function splitChecklist(
  items: PlanItem[],
  done: ReadonlySet<PlanItemKey>,
  now: Date,
): { next: PlanItem | null; pending: PlanItem[]; completed: PlanItem[] } {
  const next = nextPendingItem(items, done, now);
  const rest = items.filter((i) => !done.has(i.key) && i !== next);
  return {
    next,
    pending: next ? [next, ...rest] : rest,
    completed: items.filter((i) => done.has(i.key)),
  };
}
