import { format } from 'date-fns';

import { planForDay } from '../context';
import type { PlanContext } from '../context';
import { resolveShift } from '../cycle';
import { DEFAULT_HOURS_12H, DEFAULT_HOURS_8H } from '../shiftSetup';
import { detectTransitions, transitionReminders, upcomingTransition } from '../transitions';
import type { ShiftCode, ShiftHoursMap } from '../types';

const ctxWith = (sequenza: ShiftCode[], dataInizio: string, hours: ShiftHoursMap = DEFAULT_HOURS_8H): PlanContext => ({
  shiftHours: hours,
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
  shiftOn: (d) => resolveShift(new Map(), { sequenza, dataInizio }, d),
});
const at = (d: number, h = 9, m = 0) => new Date(2026, 2, d, h, m);
const hm = (d: Date) => format(d, 'dd HH:mm');
const bedtime = (ctx: PlanContext, d: number) => planForDay(ctx, at(d)).find((i) => i.key === 'bedtime');
const firstWake = (ctx: PlanContext, d: number) =>
  planForDay(ctx, at(d)).find((i) => i.key.startsWith('wake'));

// R R P N N S R R M ... dal 9 marzo: 9 R, 10 R, 11 P, 12 N, 13 N, 14 S, 15 R, 16 R, 17 M
const seq: ShiftCode[] = ['R', 'R', 'P', 'N', 'N', 'S', 'R', 'R', 'M'];
const ctx = ctxWith(seq, '2026-03-09');

describe('detectTransitions', () => {
  it('trova verso le notti, uscita dalle notti e rientro alla mattina', () => {
    const list = detectTransitions(ctx, at(9), 8).map((t) => [t.type, format(t.date, 'dd')]);
    expect(list).toEqual([
      ['to_nights', '12'],
      ['from_nights', '14'],
      ['to_mornings', '17'],
    ]);
  });

  it('la vista mostra 3 giorni', () => {
    const t = detectTransitions(ctx, at(9), 8);
    expect(t[0]!.days.map((d) => format(d, 'dd'))).toEqual(['11', '12', '13']);
    expect(t[2]!.days.map((d) => format(d, 'dd'))).toEqual(['15', '16', '17']);
  });

  it('card su Oggi solo se la transizione è entro 3 giorni', () => {
    expect(upcomingTransition(ctx, at(9))?.type).toBe('to_nights'); // 12 è a 3 giorni
    expect(upcomingTransition(ctxWith(['R', 'R', 'R', 'R', 'R', 'N'], '2026-03-09'), at(9))).toBeNull();
  });

  it('turni da 12 ore: Giorno dopo i riposi e notti 19–07', () => {
    const c12 = ctxWith(['G', 'N', 'S', 'R', 'R'], '2026-03-09', DEFAULT_HOURS_12H);
    const types = detectTransitions(c12, at(9), 5).map((t) => `${t.type}@${format(t.date, 'dd')}`);
    expect(types).toEqual(['to_nights@10', 'from_nights@11', 'to_mornings@14']);
  });
});

describe('Piano graduale', () => {
  it('verso le notti: dopo il pomeriggio a letto e sveglia 90 minuti più tardi', () => {
    // 11 P → a letto 23:30 + 90 = 01:00; sveglia del 12 (prima notte) = 07:00 + 90 = 08:30
    expect(hm(bedtime(ctx, 11)!.time)).toBe('12 01:00');
    expect(hm(firstWake(ctx, 12)!.time)).toBe('12 08:30');
  });

  it('verso le notti da un riposo: 90 minuti più tardi del solito', () => {
    const c = ctxWith(['R', 'R', 'N', 'S'], '2026-03-09');
    // 10 R → 11 N: normalmente a letto 00:30, ora 02:00; sveglia 09:30
    expect(hm(bedtime(c, 10)!.time)).toBe('11 02:00');
    expect(hm(firstWake(c, 11)!.time)).toBe('11 09:30');
  });

  it('rientro alla mattina: due notti prima si anticipa di 90 minuti, la sera prima vale la mattina', () => {
    // 15 R → 16 R → 17 M: notte del 15 a letto 00:30 − 90 = 23:00, sveglia 06:30
    expect(hm(bedtime(ctx, 15)!.time)).toBe('15 23:00');
    expect(hm(firstWake(ctx, 16)!.time)).toBe('16 06:30');
    // notte del 16: orario per la mattina, 04:30 − 7h30 − 15 = 20:45
    expect(hm(bedtime(ctx, 16)!.time)).toBe('16 20:45');
  });

  it('senza transizioni il piano non cambia', () => {
    const c = ctxWith(['R'], '2026-03-01');
    expect(hm(bedtime(c, 10)!.time)).toBe('11 00:30');
  });

  it('a cavallo del cambio dell’ora legale (29 marzo)', () => {
    // 27 R, 28 R, 29 M: anticipo nella notte del 27, orario mattina nella notte del 28
    const c = ctxWith(['R', 'R', 'M'], '2026-03-27');
    expect(hm(bedtime(c, 27)!.time)).toBe('27 23:00');
    expect(hm(bedtime(c, 28)!.time)).toBe('28 20:45');
  });
});

describe('transitionReminders', () => {
  it('la sera prima alle 19:00 del primo giorno della finestra, solo nel futuro', () => {
    const r = transitionReminders(ctx, at(9));
    expect(r.map((x) => hm(x.date))).toEqual(['11 19:00', '13 19:00']); // il 17 è oltre i 7 giorni
    expect(transitionReminders(ctx, at(11, 20)).map((x) => x.type)).toEqual(['from_nights', 'to_mornings']);
  });
});
