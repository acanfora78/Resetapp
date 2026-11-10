import { format } from 'date-fns';

import { computePlan, nightSleep } from '../engine';
import type { PlanInput, PlanItemKey, ShiftCode } from '../types';

const base: Omit<PlanInput, 'date' | 'prevShift' | 'shift' | 'nextShift'> = {
  shiftHours: {
    M: { start: '06:00', end: '14:00' },
    P: { start: '14:00', end: '22:00' },
    N: { start: '22:00', end: '06:00' },
  },
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
};

const DAY = new Date(2026, 2, 10); // 10 marzo 2026

function plan(prev: ShiftCode | null, shift: ShiftCode | null, next: ShiftCode | null, extra: Partial<PlanInput> = {}) {
  const items = computePlan({ ...base, date: DAY, prevShift: prev, shift, nextShift: next, ...extra });
  const map = new Map<PlanItemKey, string>();
  for (const i of items) map.set(i.key, format(i.time, 'dd HH:mm'));
  return { items, map };
}

describe('Mattina (M)', () => {
  it('calcola sveglia, luce, stop caffeina e ora di andare a letto', () => {
    const { map } = plan('R', 'M', 'M');
    // partenza = 06:00 − 30 − 30 = 05:00 → sveglia 04:30
    expect(map.get('wake')).toBe('10 04:30');
    expect(map.get('bright_light')).toBe('10 04:30');
    // a letto (per il turno M di domani) = 04:30 − 7h30 − 15 = 20:45
    expect(map.get('bedtime')).toBe('10 20:45');
    expect(map.get('caffeine_stop')).toBe('10 12:45');
    expect(map.has('nap_short')).toBe(false);
  });

  it('aggiunge il pisolino di 20 minuti se si è dormito meno di 6 ore', () => {
    const { map } = plan('R', 'M', 'R', { lastNightSleepMin: 300 });
    expect(map.get('nap_short')).toBe('10 14:00');
  });

  it('non aggiunge il pisolino con 6 ore o più', () => {
    const { map } = plan('R', 'M', 'R', { lastNightSleepMin: 360 });
    expect(map.has('nap_short')).toBe(false);
  });

  it("la sera prima di un turno M si va a letto all'orario giusto", () => {
    const { map } = plan('R', 'R', 'M');
    expect(map.get('bedtime')).toBe('10 20:45');
  });
});

describe('Pomeriggio (P)', () => {
  it('a letto = rientro + 60 min, stop caffeina 8 ore prima, luce bassa dal rientro', () => {
    const { map } = plan('P', 'P', 'P');
    // rientro = 22:00 + 30 = 22:30 → a letto 23:30
    expect(map.get('low_light')).toBe('10 22:30');
    expect(map.get('bedtime')).toBe('10 23:30');
    expect(map.get('caffeine_stop')).toBe('10 15:30');
    // sveglia dopo il P del giorno prima = 23:30 + 7h30 = 07:00
    expect(map.get('wake')).toBe('10 07:00');
  });

  it('dopo un P, se il giorno dopo è M, la sveglia non può essere dopo quella del turno M', () => {
    const w = nightSleep(DAY, 'P', 'M', base);
    expect(format(w!.bed, 'dd HH:mm')).toBe('10 23:30');
    expect(format(w!.wake, 'dd HH:mm')).toBe('11 04:30');
  });
});

describe('Notte (N)', () => {
  it('pisolino pre-notte, caffeina fino a metà turno, occhiali e allerta guida alla fine', () => {
    const { map } = plan('R', 'N', 'S');
    // partenza = 22:00 − 60 = 21:00 → pisolino finisce alle 20:00 → inizia alle 18:30
    expect(map.get('nap_pre_night')).toBe('10 18:30');
    expect(map.get('night_bright_light')).toBe('10 22:00');
    expect(map.get('night_caffeine_stop')).toBe('11 02:00');
    expect(map.get('dark_glasses')).toBe('11 06:00');
    expect(map.get('drive_alert')).toBe('11 06:00');
    expect(map.get('post_night_routine')).toBe('11 06:30');
    expect(map.has('bedtime')).toBe(false);
  });

  it('se il giorno dopo è di nuovo N, dopo il rientro si fa un sonno pieno', () => {
    const { map } = plan('N', 'N', 'N');
    // rientro 06:30 + routine 30 = 07:00 → sveglia 14:30
    expect(map.get('day_sleep')).toBe('10 07:00');
    expect(map.get('wake')).toBe('10 14:30');
  });
});

describe('Smonto (S)', () => {
  it('sonno breve dopo il rientro, luce naturale, a letto presto', () => {
    const { map } = plan('N', 'S', 'R');
    expect(map.get('short_sleep')).toBe('10 07:00');
    expect(map.get('wake')).toBe('10 10:30');
    expect(map.get('natural_light')).toBe('10 15:00');
    // a letto = sveglia preferita (08:00) − 7h30 = 00:30
    expect(map.get('bedtime')).toBe('11 00:30');
    expect(map.has('caffeine_stop')).toBe(false);
  });

  it('un riposo subito dopo la notte segue le regole dello smonto', () => {
    const { map } = plan('N', 'R', 'R');
    expect(map.has('short_sleep')).toBe(true);
    expect(map.has('natural_light')).toBe(true);
  });
});

describe('Riposo (R)', () => {
  it('sveglia preferita, luce al mattino, attività leggera', () => {
    const { map } = plan('R', 'R', 'R');
    expect(map.get('wake')).toBe('10 08:00');
    expect(map.get('morning_light')).toBe('10 08:00');
    expect(map.get('light_activity')).toBe('10 10:00');
    expect(map.get('bedtime')).toBe('11 00:30');
  });

  it('senza turni inseriti si comporta come un riposo', () => {
    const { map } = plan(null, null, null);
    expect(map.get('wake')).toBe('10 08:00');
  });
});

it('le azioni sono ordinate per orario e hanno il flag notifica', () => {
  const { items } = plan('R', 'N', 'S');
  for (let i = 1; i < items.length; i++) {
    expect(items[i]!.time.getTime()).toBeGreaterThanOrEqual(items[i - 1]!.time.getTime());
  }
  expect(items.find((i) => i.key === 'drive_alert')?.notify).toBe(true);
});
