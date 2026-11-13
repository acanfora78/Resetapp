import { format } from 'date-fns';

import type { PlanContext } from '../context';
import { resolveShift } from '../cycle';
import { evaluateEvent } from '../events';
import { DEFAULT_HOURS_8H } from '../shiftSetup';
import type { ShiftCode } from '../types';

const ctxWith = (sequenza: ShiftCode[], dataInizio: string): PlanContext => ({
  shiftHours: DEFAULT_HOURS_8H,
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
  shiftOn: (d) => resolveShift(new Map(), { sequenza, dataInizio }, d),
});
const at = (d: number, h: number, m = 0) => new Date(2026, 2, d, h, m);
const ev = (d: number, h: number, durH: number) => ({ title: 'Cena', start: at(d, h), end: at(d, h + durH) });

describe('Posso andarci?', () => {
  it('durante il turno: "Sei in turno"', () => {
    const c = ctxWith(['M'], '2026-03-01');
    const r = evaluateEvent(c, ev(10, 12, 2));
    expect(r.verdict).toBe('on_shift');
  });

  it('sera prima della Mattina: finisce a mezzanotte, dormiresti 4 ore e mezza → sconsigliato', () => {
    // 14 R, 15 M (06:00, sveglia 04:30)
    const c = ctxWith(['R', 'M'], '2026-03-14');
    const r = evaluateEvent(c, ev(14, 21, 3));
    expect(r.verdict).toBe('no');
    expect(r.reason).toMatchObject({ key: 'before_early', sleepMin: 270 });
    expect(r.tips.map((t) => t.key)).toEqual(['nap', 'caffeine', 'bed', 'next_day']);
  });

  it('sera prima della Mattina, evento breve: sì con accorgimenti', () => {
    const c = ctxWith(['R', 'M'], '2026-03-14');
    const r = evaluateEvent(c, ev(14, 19, 3)); // finisce alle 22:00 → 6h30 di sonno
    expect(r.verdict).toBe('yes_tips');
    const nap = r.tips.find((t) => t.key === 'nap');
    expect(nap && format(nap.time, 'HH:mm')).toBe('16:40'); // finisce 2 h prima dell'evento
  });

  it('nel sonno principale dopo una notte (prima di un’altra notte): sconsigliato', () => {
    // 9 N, 10 N: il 10 si dorme 07:00–14:30
    const c = ctxWith(['N', 'N', 'S', 'R'], '2026-03-09');
    expect(evaluateEvent(c, ev(10, 10, 2)).verdict).toBe('no');
  });

  it('nel sonno breve dello smonto: si sposta dopo l’evento', () => {
    const c = ctxWith(['N', 'S', 'R'], '2026-03-09');
    const r = evaluateEvent(c, ev(10, 8, 1));
    expect(r.verdict).toBe('yes_tips');
    expect(r.tips[0]).toMatchObject({ key: 'sleep_after' });
  });

  it('giorno di riposo, cena che finisce tardi: si sposta la sveglia', () => {
    // 14 R, 15 R: a letto 00:30, sveglia 08:00. Cena 22–01 → sveglia 08:30
    const c = ctxWith(['R'], '2026-03-01');
    const r = evaluateEvent(c, ev(14, 22, 3));
    expect(r.verdict).toBe('yes_tips');
    const wake = r.tips.find((t) => t.key === 'wake');
    expect(wake && format(wake.time, 'dd HH:mm')).toBe('15 08:30');
  });

  it('pomeriggio libero: sì', () => {
    const c = ctxWith(['R'], '2026-03-01');
    expect(evaluateEvent(c, ev(14, 15, 2))).toMatchObject({ verdict: 'yes', reason: { key: 'free' } });
  });

  it('sul pisolino prima della notte: pisolino breve dopo l’evento se c’è tempo', () => {
    // 14 R, 15 N: pisolino 18:30–20:00, partenza 21:00
    const c = ctxWith(['R', 'N', 'S'], '2026-03-14');
    const r = evaluateEvent(c, { title: 'Aperitivo', start: at(15, 18), end: at(15, 19) });
    expect(r.verdict).toBe('yes_tips');
    expect(r.tips[0]).toMatchObject({ key: 'nap', durationMin: 20 });
    expect(evaluateEvent(c, { title: 'Cena', start: at(15, 18), end: at(15, 20) }).verdict).toBe('no');
  });
});

describe('Accorgimenti nel piano del giorno', () => {
  it('l’evento e il pisolino suggerito entrano nel piano', () => {
    const { eventPlanItems } = require('../events') as typeof import('../events');
    const c = ctxWith(['R', 'M'], '2026-03-14');
    const items = eventPlanItems(c, [{ title: 'Cena da Luca', start: at(14, 19), end: at(14, 22) }]).get('2026-03-14')!;
    expect(items.map((i) => i.key)).toEqual(['event', 'event_nap', 'event_caffeine']);
    expect(items[0]!.label).toBe('Cena da Luca');
  });
});
