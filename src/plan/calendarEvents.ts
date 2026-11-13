/** Eventi da scrivere nel calendario del telefono, dai turni. Funzioni pure. */
import { addDays, startOfDay } from 'date-fns';

import type { PlanContext } from './context';
import { toISODate } from './cycle';
import { shiftWindow } from './time';
import type { ShiftCode } from './types';
import { isWorkShift } from './types';

export interface ShiftEvent {
  /** "yyyy-MM-dd": serve per riconoscere l'evento. */
  day: string;
  code: ShiftCode;
  start: Date;
  end: Date;
  allDay: boolean;
}

/** Un evento per ogni giorno con turno: orari veri per i turni di lavoro, tutto il giorno per S e R. */
export function shiftEvents(ctx: PlanContext, from: Date, days: number): ShiftEvent[] {
  const out: ShiftEvent[] = [];
  const first = startOfDay(from);
  for (let i = 0; i < days; i++) {
    const d = addDays(first, i);
    const code = ctx.shiftOn(d);
    if (!code) continue;
    if (isWorkShift(code)) {
      const w = shiftWindow(d, ctx.shiftHours[code].start, ctx.shiftHours[code].end);
      out.push({ day: toISODate(d), code, start: w.start, end: w.end, allDay: false });
    } else {
      out.push({ day: toISODate(d), code, start: d, end: addDays(d, 1), allDay: true });
    }
  }
  return out;
}
