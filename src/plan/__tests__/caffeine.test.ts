import { format } from 'date-fns';

import type { PlanContext } from '../context';
import { resolveShift } from '../cycle';
import { caffeineAt, caffeineCurve, caffeineVerdict, isAfterCaffeineStop, nextSleepStart } from '../caffeine';
import { DEFAULT_HOURS_8H } from '../shiftSetup';
import type { ShiftCode } from '../types';

const at = (d: number, h: number, m = 0) => new Date(2026, 2, d, h, m);
const ctxWith = (sequenza: ShiftCode[], dataInizio: string): PlanContext => ({
  shiftHours: DEFAULT_HOURS_8H,
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
  shiftOn: (d) => resolveShift(new Map(), { sequenza, dataInizio }, d),
});

describe('caffeineAt', () => {
  it('dimezza ogni 5 ore', () => {
    const doses = [{ at: at(10, 8), mg: 100 }];
    expect(caffeineAt(doses, at(10, 8))).toBeCloseTo(100);
    expect(caffeineAt(doses, at(10, 13))).toBeCloseTo(50);
    expect(caffeineAt(doses, at(10, 18))).toBeCloseTo(25);
  });

  it('ignora i caffè futuri e somma più dosi', () => {
    const doses = [{ at: at(10, 8), mg: 100 }, { at: at(10, 13), mg: 100 }];
    expect(caffeineAt(doses, at(10, 7))).toBe(0);
    expect(caffeineAt(doses, at(10, 13))).toBeCloseTo(150);
  });

  it('attraversa la mezzanotte e il cambio dell’ora legale (tempo reale trascorso)', () => {
    // In Italia 28 marzo 22:00 → 29 marzo 04:00 sono 5 ore reali (alle 02:00 si salta alle 03:00):
    // il calcolo usa il tempo reale trascorso, in qualsiasi fuso orario.
    const from = new Date(2026, 2, 28, 22, 0);
    const to = new Date(2026, 2, 29, 4, 0);
    const realHours = (to.getTime() - from.getTime()) / 3600000;
    expect(caffeineAt([{ at: from, mg: 80 }], to)).toBeCloseTo(80 * Math.pow(0.5, realHours / 5));
  });
});

describe('caffeineCurve', () => {
  it('copre 24 ore a passi di 15 minuti', () => {
    const c = caffeineCurve([{ at: at(10, 8), mg: 100 }], at(10, 8));
    expect(c).toHaveLength(24 * 4 + 1);
    expect(c[0]!.mg).toBeCloseTo(100);
  });
});

describe('verdetto per il sonno', () => {
  // 10 marzo Mattina, 11 Pomeriggio: a letto 00:30 del 11
  const ctx = ctxWith(['M', 'P', 'N', 'S', 'R'], '2026-03-10');

  it('il prossimo sonno è l’ora a letto del piano', () => {
    expect(format(nextSleepStart(ctx, at(10, 15))!, 'dd HH:mm')).toBe('11 00:30');
  });

  it('caffè presto: ok, sotto la soglia', () => {
    const v = caffeineVerdict(ctx, [{ at: at(10, 5), mg: 65 }], at(10, 9));
    expect(v.status).toBe('ok');
  });

  it('caffè tardi: ancora sopra la soglia, con la percentuale', () => {
    const v = caffeineVerdict(ctx, [{ at: at(10, 20), mg: 100 }], at(10, 21));
    expect(v.status).toBe('high');
    // 4h30 dopo: 0,5^(4,5/5) ≈ 54%
    expect(v.percentAtSleep).toBe(54);
  });

  it('nessun caffè nelle ultime 24 ore', () => {
    expect(caffeineVerdict(ctx, [], at(10, 9)).status).toBe('none');
  });

  it('avviso se il caffè è dopo lo stop caffeina', () => {
    // stop caffeina del 10 (Mattina, a letto 00:30) = 16:30
    expect(isAfterCaffeineStop(ctx, at(10, 15))).toBe(false);
    expect(isAfterCaffeineStop(ctx, at(10, 17))).toBe(true);
  });
});
