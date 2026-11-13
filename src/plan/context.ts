import { addDays, addMinutes, startOfDay } from 'date-fns';

import { computePlan, dayContext, isCategoryOn } from './engine';
import { RULES } from './rules';
import { applyVisibility, showsAlcoholTip, visibleItems } from './visibility';
import type { ClockTime, Interval, PlanItem, PlanPrefs, ShiftCode, ShiftHoursMap } from './types';

/** Dati necessari per calcolare il piano di alcuni giorni. */
export interface PlanContext {
  shiftHours: ShiftHoursMap;
  commuteMin: number;
  preferredWake: ClockTime;
  sleepNeedMin: number;
  shiftOn: (d: Date) => ShiftCode | null;
  /** Minuti di recupero del debito per giorno (solo riposi). */
  recoveryOn?: (d: Date) => number;
  /** Azioni aggiuntive per giorno (es. eventi pianificati e i loro accorgimenti). */
  extraItems?: (d: Date) => PlanItem[];
  /** Categorie facoltative accese o spente (Profilo → "Cosa vuoi nel tuo piano"). */
  prefs?: PlanPrefs;
}

/**
 * Tutte le azioni del giorno, ordinate per orario. Quelle con `extra` vanno in
 * "Altri consigli": non si notificano e non contano per punteggio e serie.
 */
export function planForDay(ctx: PlanContext, day: Date): PlanItem[] {
  const extra = ctx.extraItems?.(day) ?? [];
  const busy: Interval[] = extra
    .filter((i) => i.key === 'event' && i.end)
    .map((i) => ({ start: i.time, end: i.end! }));
  const extraNaps: Interval[] = extra
    .filter((i) => i.key === 'event_nap')
    .map((i) => ({ start: i.time, end: i.end ?? addMinutes(i.time, RULES.EVENT_NAP_MIN) }));

  const prev = ctx.shiftOn(addDays(day, -1));
  const shift = ctx.shiftOn(day);
  const next = ctx.shiftOn(addDays(day, 1));
  const base = computePlan({
    date: day,
    prevShift: prev,
    shift,
    nextShift: next,
    shiftAfterNext: ctx.shiftOn(addDays(day, 2)),
    shiftHours: ctx.shiftHours,
    commuteMin: ctx.commuteMin,
    preferredWake: ctx.preferredWake,
    sleepNeedMin: ctx.sleepNeedMin,
    recoveryExtraMin: ctx.recoveryOn?.(day) ?? 0,
    prefs: ctx.prefs,
    busy,
    extraNaps,
  });
  const items = [...base, ...extra].sort((a, b) => a.time.getTime() - b.time.getTime());

  // Consiglio senza orario: dopo l'ultima notte, al massimo una volta a settimana.
  if (isCategoryOn(ctx.prefs, 'habits') && showsAlcoholTip(ctx.shiftOn, day)) {
    items.push({
      key: 'alcohol_tip',
      time: items[0]?.time ?? startOfDay(day),
      notify: false,
      tip: true,
      context: dayContext(prev, shift, next),
    });
    items.sort((a, b) => a.time.getTime() - b.time.getTime());
  }
  return applyVisibility(items);
}

/** Solo le azioni della lista principale (punteggio, serie, anteprime). */
export const mainPlanForDay = (ctx: PlanContext, day: Date) => visibleItems(planForDay(ctx, day));

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
    tomorrow: mainPlanForDay(ctx, tomorrowDay).filter((i) => i.key !== 'bedtime'),
  };
}
