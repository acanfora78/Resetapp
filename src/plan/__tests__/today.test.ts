import { format } from 'date-fns';

import type { PlanContext } from '../context';
import { resolveShift } from '../cycle';
import { DEFAULT_HOURS_8H } from '../shiftSetup';
import { currentPlanDay, isNightShiftTime, nextPendingItem, notificationSchedule } from '../today';
import { planForDay } from '../context';

const ctxWith = (sequenza: ('M' | 'P' | 'N' | 'S' | 'R')[], dataInizio: string): PlanContext => ({
  shiftHours: DEFAULT_HOURS_8H,
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
  shiftOn: (d) => resolveShift(new Map(), { sequenza, dataInizio }, d),
});

// Schema M-P-N-S-R dal 9/3/2026: 9 M, 10 P, 11 N, 12 S, 13 R, 14 M...
const ctx = ctxWith(['M', 'P', 'N', 'S', 'R'], '2026-03-09');
const at = (d: number, h: number, m = 0) => new Date(2026, 2, d, h, m);
const day = (d: Date) => format(d, 'dd/MM');

describe('currentPlanDay', () => {
  it('di giorno è oggi', () => {
    expect(day(currentPlanDay(ctx, at(10, 15)))).toBe('10/03');
  });

  it('durante il turno di notte, dopo mezzanotte, resta il piano della notte', () => {
    // Notte dell'11: alle 03:00 del 12 il piano è ancora quello dell'11
    expect(day(currentPlanDay(ctx, at(12, 3)))).toBe('11/03');
    // fino a un'ora dopo la routine post-notte (06:30 → 07:30), ma il piano del 12 parte alle 07:00
    expect(day(currentPlanDay(ctx, at(12, 6, 45)))).toBe('11/03');
    expect(day(currentPlanDay(ctx, at(12, 7, 5)))).toBe('12/03');
  });

  it('se si va a letto dopo mezzanotte, il piano di ieri resta fino all’ora di andare a letto', () => {
    // 12 S → 13 R: a letto alle 00:30 del 13
    expect(day(currentPlanDay(ctx, at(13, 0, 10)))).toBe('12/03');
    expect(day(currentPlanDay(ctx, at(13, 3)))).toBe('13/03');
  });
});

describe('nextPendingItem', () => {
  it('salta le azioni già fatte', () => {
    const items = planForDay(ctx, at(10, 0));
    const first = items[0]!;
    const next = nextPendingItem(items, new Set([first.key]), first.time);
    expect(next?.key).toBe(items[1]!.key);
  });
});

describe('isNightShiftTime', () => {
  it('attiva dall’inizio del turno di notte fino a rientro + routine + 30 min', () => {
    expect(isNightShiftTime(ctx, at(11, 21, 59))).toBe(false);
    expect(isNightShiftTime(ctx, at(11, 22))).toBe(true);
    expect(isNightShiftTime(ctx, at(12, 3))).toBe(true);
    expect(isNightShiftTime(ctx, at(12, 7, 30))).toBe(true); // 06:00 + 30 + 30 + 30
    expect(isNightShiftTime(ctx, at(12, 7, 31))).toBe(false);
  });

  it('non si attiva negli altri turni', () => {
    expect(isNightShiftTime(ctx, at(10, 23))).toBe(false);
    expect(isNightShiftTime(ctx, at(13, 2))).toBe(false);
  });
});

describe('notificationSchedule', () => {
  const now = at(10, 15);

  it('solo azioni future da notificare, ordinate', () => {
    const list = notificationSchedule(ctx, now);
    expect(list.length).toBeGreaterThan(0);
    for (const r of list) expect(r.date.getTime()).toBeGreaterThan(now.getTime());
    for (let i = 1; i < list.length; i++) {
      expect(list[i]!.date.getTime()).toBeGreaterThanOrEqual(list[i - 1]!.date.getTime());
    }
    expect(list.some((r) => r.key === 'light_activity')).toBe(false); // non notificata
  });

  it('copre i prossimi 7 giorni e rispetta il limite', () => {
    const list = notificationSchedule(ctx, now);
    expect(list[list.length - 1]!.date.getTime()).toBeLessThan(at(17, 23, 59).getTime() + 86400000);
    expect(notificationSchedule(ctx, now, new Set(), 7, 5)).toHaveLength(5);
  });

  it('esclude le azioni già spuntate', () => {
    const all = notificationSchedule(ctx, now);
    const first = all[0]!;
    const without = notificationSchedule(ctx, now, new Set([first.id]));
    expect(without.some((r) => r.id === first.id)).toBe(false);
  });

  it('identificativi unici', () => {
    const ids = notificationSchedule(ctx, now).map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
