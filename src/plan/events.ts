/**
 * "Posso andarci?": valuta un evento (cena, compleanno…) rispetto a turni e sonno.
 * Funzioni pure.
 */
import { addDays, addMinutes, differenceInMinutes, startOfDay } from 'date-fns';

import { planForDay } from './context';
import type { PlanContext } from './context';
import { dayContext } from './engine';
import { NOTIFY, RULES } from './rules';
import { toISODate } from './cycle';
import { atClock, shiftWindow } from './time';
import type { PlanItem, ShiftCode } from './types';
import { isWorkShift } from './types';

export interface PlannedEvent {
  title: string;
  start: Date;
  end: Date;
}

export type EventVerdict = 'yes' | 'yes_tips' | 'no' | 'on_shift';

export type EventReason =
  | { key: 'on_shift'; shift: ShiftCode }
  | { key: 'free' }
  | { key: 'before_early'; end: Date; shift: ShiftCode; shiftStart: Date; sleepMin: number }
  | { key: 'during_day_sleep' }
  | { key: 'during_short_sleep' }
  | { key: 'pre_night_nap'; departure: Date }
  | { key: 'late_free'; wake: Date }
  | { key: 'cuts_sleep'; sleepMin: number };

export type EventTip =
  | { key: 'nap'; time: Date; durationMin: number }
  | { key: 'wake'; time: Date }
  | { key: 'bed'; time: Date }
  | { key: 'caffeine'; time: Date }
  | { key: 'sleep_after'; time: Date }
  | { key: 'next_day'; napTime: Date };

export interface EventAssessment {
  verdict: EventVerdict;
  reason: EventReason;
  tips: EventTip[];
}

const overlaps = (a0: Date, a1: Date, b0: Date, b1: Date) => a0 < b1 && b0 < a1;
const isEarly = (c: ShiftCode | null) => c === 'M' || c === 'G';

interface SleepSpan {
  kind: 'night' | 'day_sleep' | 'short_sleep' | 'nap_pre_night';
  start: Date;
  end: Date;
  /** Giorno in cui ci si sveglia (per le notti). */
  wakeDay: Date;
}

function sleepSpans(ctx: PlanContext, around: Date): SleepSpan[] {
  const spans: SleepSpan[] = [];
  const first = startOfDay(around);
  for (let i = -1; i <= 1; i++) {
    const d = addDays(first, i);
    const items = planForDay(ctx, d);
    for (const it of items) {
      if (it.key === 'day_sleep') {
        spans.push({ kind: 'day_sleep', start: it.time, end: addMinutes(it.time, ctx.sleepNeedMin), wakeDay: d });
      } else if (it.key === 'short_sleep') {
        spans.push({ kind: 'short_sleep', start: it.time, end: addMinutes(it.time, RULES.SMONTO_SLEEP_MIN), wakeDay: d });
      } else if (it.key === 'nap_pre_night') {
        spans.push({ kind: 'nap_pre_night', start: it.time, end: addMinutes(it.time, RULES.NAP_PRE_NIGHT_DURATION_MIN), wakeDay: d });
      } else if (it.key === 'bedtime') {
        const next = addDays(d, 1);
        const wake = planForDay(ctx, next).find((x) => x.key.startsWith('wake'));
        if (wake) spans.push({ kind: 'night', start: it.time, end: wake.time, wakeDay: next });
      }
    }
  }
  return spans;
}

export function evaluateEvent(ctx: PlanContext, ev: PlannedEvent): EventAssessment {
  const day = startOfDay(ev.start);

  // 1. Si sovrappone a un turno (compreso il tragitto)?
  for (let i = -1; i <= 1; i++) {
    const d = addDays(day, i);
    const code = ctx.shiftOn(d);
    if (!isWorkShift(code)) continue;
    const w = shiftWindow(d, ctx.shiftHours[code].start, ctx.shiftHours[code].end);
    if (overlaps(ev.start, ev.end, addMinutes(w.start, -ctx.commuteMin), addMinutes(w.end, ctx.commuteMin))) {
      return { verdict: 'on_shift', reason: { key: 'on_shift', shift: code }, tips: [] };
    }
  }

  const spans = sleepSpans(ctx, ev.start);
  const hit = (kind: SleepSpan['kind']) => spans.find((s) => s.kind === kind && overlaps(ev.start, ev.end, s.start, s.end));

  // 2. Sonno principale dopo una notte, prima di un'altra notte.
  if (hit('day_sleep')) return { verdict: 'no', reason: { key: 'during_day_sleep' }, tips: [] };

  // 3. Sonno breve dello smonto: si può spostare dopo l'evento.
  if (hit('short_sleep')) {
    return {
      verdict: 'yes_tips',
      reason: { key: 'during_short_sleep' },
      tips: [{ key: 'sleep_after', time: ev.end }],
    };
  }

  // 4. Pisolino prima della notte.
  const nap = hit('nap_pre_night');
  if (nap) {
    const departure = addMinutes(nap.end, RULES.NAP_PRE_NIGHT_END_BEFORE_DEPARTURE_MIN);
    const shortNapStart = addMinutes(nap.end, -RULES.EVENT_NAP_MIN);
    if (shortNapStart >= ev.end) {
      return {
        verdict: 'yes_tips',
        reason: { key: 'pre_night_nap', departure },
        tips: [{ key: 'nap', time: shortNapStart, durationMin: RULES.EVENT_NAP_MIN }],
      };
    }
    return { verdict: 'no', reason: { key: 'pre_night_nap', departure }, tips: [] };
  }

  // 5. Il sonno notturno.
  const night = hit('night');
  if (!night) return { verdict: 'yes', reason: { key: 'free' }, tips: [] };

  const nextShift = ctx.shiftOn(night.wakeDay);
  const tips: EventTip[] = [];

  // Evento che finisce dopo l'ora di andare a letto.
  if (ev.end > night.start) {
    if (isEarly(nextShift)) {
      const shiftStart = atClock(night.wakeDay, ctx.shiftHours[nextShift as 'M' | 'G'].start);
      const sleepMin = differenceInMinutes(night.end, ev.end);
      const napEnd = addMinutes(ev.start, -RULES.EVENT_NAP_END_BEFORE_MIN);
      tips.push({ key: 'nap', time: addMinutes(napEnd, -RULES.EVENT_NAP_MIN), durationMin: RULES.EVENT_NAP_MIN });
      tips.push({ key: 'caffeine', time: addMinutes(ev.end, -RULES.CAFFEINE_CUTOFF_BEFORE_BED_MIN) });
      tips.push({ key: 'bed', time: ev.end });
      tips.push({ key: 'next_day', napTime: atClock(night.wakeDay, RULES.NAP_SHORT_TIME) });
      const reason: EventReason = { key: 'before_early', end: ev.end, shift: nextShift!, shiftStart, sleepMin };
      if (sleepMin >= ctx.sleepNeedMin) return { verdict: 'yes', reason, tips: [] };
      return { verdict: sleepMin >= RULES.EVENT_MIN_SLEEP_MIN ? 'yes_tips' : 'no', reason, tips };
    }

    // Domani c'è margine: si sposta la sveglia, al massimo di EVENT_MAX_WAKE_SHIFT_MIN.
    const lost = differenceInMinutes(ev.end, night.start);
    const shift = Math.min(lost, RULES.EVENT_MAX_WAKE_SHIFT_MIN);
    const wake = addMinutes(night.end, shift);
    const sleepMin = differenceInMinutes(wake, ev.end);
    tips.push({ key: 'wake', time: wake });
    if (lost > RULES.EVENT_MAX_WAKE_SHIFT_MIN) {
      tips.push({ key: 'next_day', napTime: atClock(night.wakeDay, RULES.NAP_SHORT_TIME) });
    }
    if (sleepMin >= RULES.EVENT_MIN_SLEEP_MIN) return { verdict: 'yes_tips', reason: { key: 'late_free', wake }, tips };
    return { verdict: 'no', reason: { key: 'cuts_sleep', sleepMin }, tips };
  }

  // Evento la mattina presto, mentre si dovrebbe dormire.
  const sleepMin = differenceInMinutes(ev.start, night.start);
  const bed = addMinutes(ev.start, -ctx.sleepNeedMin);
  tips.push({ key: 'bed', time: bed });
  return {
    verdict: sleepMin >= RULES.EVENT_MIN_SLEEP_MIN ? 'yes_tips' : 'no',
    reason: { key: 'cuts_sleep', sleepMin },
    tips,
  };
}

/**
 * Azioni da aggiungere al piano per gli eventi salvati: l'evento stesso e gli
 * accorgimenti (pisolino, stop caffeina). `base` è il contesto senza eventi.
 */
export function eventPlanItems(base: PlanContext, events: PlannedEvent[]): Map<string, PlanItem[]> {
  const out = new Map<string, PlanItem[]>();
  const push = (d: Date, item: PlanItem) => {
    const k = toISODate(d);
    out.set(k, [...(out.get(k) ?? []), item]);
  };
  for (const ev of events) {
    const day = startOfDay(ev.start);
    const context = dayContext(base.shiftOn(addDays(day, -1)), base.shiftOn(day), base.shiftOn(addDays(day, 1)));
    push(day, { key: 'event', time: ev.start, notify: NOTIFY.event, context, label: ev.title });
    const { tips } = evaluateEvent(base, ev);
    for (const t of tips) {
      if (t.key === 'nap') push(day, { key: 'event_nap', time: t.time, notify: NOTIFY.event_nap, context });
      if (t.key === 'caffeine') push(day, { key: 'event_caffeine', time: t.time, notify: NOTIFY.event_caffeine, context });
    }
  }
  return out;
}
