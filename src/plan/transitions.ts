/**
 * Transizioni tra turni: rilevamento e finestra di giorni da mostrare. Funzioni pure.
 */
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

import type { PlanContext } from './context';
import { toISODate } from './cycle';
import { RULES } from './rules';
import { atClock } from './time';
import type { ShiftCode } from './types';

export type TransitionType = 'to_nights' | 'from_nights' | 'to_mornings';

export interface Transition {
  type: TransitionType;
  /** Giorno del cambio: prima notte, primo giorno dopo le notti, primo turno del mattino. */
  date: Date;
  from: ShiftCode | null;
  to: ShiftCode | null;
  /** I 3 giorni da mostrare nella vista "Prossimi 3 giorni". */
  days: Date[];
}

const isEarly = (c: ShiftCode | null) => c === 'M' || c === 'G';
const isOff = (c: ShiftCode | null) => c === 'R' || c === 'S' || c === null;

/** Transizioni dei prossimi giorni, a partire da oggi (incluso). */
export function detectTransitions(
  ctx: PlanContext,
  now: Date,
  days: number = RULES.TRANSITION_LOOKAHEAD_DAYS,
): Transition[] {
  const today = startOfDay(now);
  const out: Transition[] = [];
  for (let i = 0; i <= days; i++) {
    const d = addDays(today, i);
    const prev = ctx.shiftOn(addDays(d, -1));
    const cur = ctx.shiftOn(d);
    if (cur === 'N' && prev !== 'N') {
      out.push({ type: 'to_nights', date: d, from: prev, to: cur, days: [addDays(d, -1), d, addDays(d, 1)] });
    } else if (prev === 'N' && cur !== 'N') {
      out.push({ type: 'from_nights', date: d, from: prev, to: cur, days: [addDays(d, -1), d, addDays(d, 1)] });
    } else if (isEarly(cur) && (prev === 'R' || prev === 'S') && isOff(ctx.shiftOn(addDays(d, -2)))) {
      out.push({ type: 'to_mornings', date: d, from: prev, to: cur, days: [addDays(d, -2), addDays(d, -1), d] });
    }
  }
  return out;
}

/** La prossima transizione da mostrare nella card su Oggi (entro TRANSITION_CARD_DAYS). */
export function upcomingTransition(ctx: PlanContext, now: Date): Transition | null {
  const today = startOfDay(now);
  return (
    detectTransitions(ctx, now).find((t) => {
      const diff = differenceInCalendarDays(t.date, today);
      return diff >= 0 && diff <= RULES.TRANSITION_CARD_DAYS;
    }) ?? null
  );
}

export interface TransitionReminder {
  id: string;
  type: TransitionType;
  date: Date;
}

/** Promemoria della sera prima: alle TRANSITION_NOTIFY_TIME del primo giorno della finestra. */
export function transitionReminders(ctx: PlanContext, now: Date): TransitionReminder[] {
  return detectTransitions(ctx, now)
    .map((t) => ({
      id: `transizione_${toISODate(t.date)}_${t.type}`,
      type: t.type,
      date: atClock(t.days[0]!, RULES.TRANSITION_NOTIFY_TIME),
    }))
    .filter((r) => r.date > now);
}
