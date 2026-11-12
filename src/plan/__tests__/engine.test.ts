import { format } from 'date-fns';

import { computePlan, nightSleep } from '../engine';
import { DEFAULT_HOURS_12H, DEFAULT_HOURS_8H } from '../shiftSetup';
import type { PlanInput, PlanItemKey, ShiftCode } from '../types';

const base: Omit<PlanInput, 'date' | 'prevShift' | 'shift' | 'nextShift'> = {
  shiftHours: DEFAULT_HOURS_8H,
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
};
const base12 = { ...base, shiftHours: DEFAULT_HOURS_12H };

const DAY = new Date(2026, 2, 10); // 10 marzo 2026

function plan(
  prev: ShiftCode | null,
  shift: ShiftCode | null,
  next: ShiftCode | null,
  extra: Partial<PlanInput> = {},
) {
  const items = computePlan({ ...base, date: DAY, prevShift: prev, shift, nextShift: next, ...extra });
  const map = new Map<PlanItemKey, string>();
  for (const i of items) map.set(i.key, format(i.time, 'dd HH:mm'));
  return { items, map };
}

function expectNoDuplicateTimes(items: { time: Date }[]) {
  const times = items.map((i) => i.time.getTime());
  expect(new Set(times).size).toBe(times.length);
}

describe('Mattina (M)', () => {
  it('sveglia + luce forte, stop caffeina e ora di andare a letto', () => {
    const { map } = plan('R', 'M', 'M');
    // partenza = 06:00 − 30 − 30 = 05:00 → sveglia 04:30
    expect(map.get('wake_bright_light')).toBe('10 04:30');
    expect(map.has('wake')).toBe(false);
    // a letto (per il turno M di domani) = 04:30 − 7h30 − 15 = 20:45
    expect(map.get('bedtime')).toBe('10 20:45');
    expect(map.get('caffeine_stop')).toBe('10 12:45');
    expect(map.has('nap_short')).toBe(false);
  });

  it('pisolino di 20 minuti se si è dormito meno di 6 ore', () => {
    expect(plan('R', 'M', 'R', { lastNightSleepMin: 300 }).map.get('nap_short')).toBe('10 14:00');
    expect(plan('R', 'M', 'R', { lastNightSleepMin: 360 }).map.has('nap_short')).toBe(false);
  });

  it("la sera prima di un turno M si va a letto all'orario giusto", () => {
    expect(plan('R', 'R', 'M').map.get('bedtime')).toBe('10 20:45');
  });
});

describe('Pomeriggio (P)', () => {
  it('a letto = rientro + 60 min, stop caffeina 8 ore prima, luce bassa dal rientro', () => {
    const { map } = plan('P', 'P', 'P');
    expect(map.get('low_light')).toBe('10 22:30');
    expect(map.get('bedtime')).toBe('10 23:30');
    expect(map.get('caffeine_stop')).toBe('10 15:30');
    expect(map.get('wake')).toBe('10 07:00');
  });

  it('dopo un P, se il giorno dopo è M, la sveglia non può essere dopo quella del turno M', () => {
    const w = nightSleep(DAY, 'P', 'M', base)!;
    expect(format(w.bed, 'dd HH:mm')).toBe('10 23:30');
    expect(format(w.wake, 'dd HH:mm')).toBe('11 04:30');
  });
});

describe('Notte (N)', () => {
  it('pisolino pre-notte, caffeina fino a metà turno, pasto leggero a mezzanotte, allerta guida alla fine', () => {
    const { map, items } = plan('R', 'N', 'S');
    expect(map.get('nap_pre_night')).toBe('10 18:30');
    expect(map.get('night_bright_light')).toBe('10 22:00');
    expect(map.get('night_light_meal')).toBe('11 00:00');
    expect(map.get('night_caffeine_stop')).toBe('11 02:00');
    expect(map.get('drive_alert')).toBe('11 06:00');
    expect(map.get('post_night_routine')).toBe('11 06:30');
    expect(map.has('bedtime')).toBe(false);
    expectNoDuplicateTimes(items);
  });

  it('se il giorno dopo è di nuovo N, dopo il rientro si fa un sonno pieno', () => {
    const { map } = plan('N', 'N', 'N');
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
  it('sveglia + luce naturale in un’unica azione, attività leggera', () => {
    const { map } = plan('R', 'R', 'R');
    expect(map.get('wake_morning_light')).toBe('10 08:00');
    expect(map.has('wake')).toBe(false);
    expect(map.get('light_activity')).toBe('10 10:00');
    expect(map.get('bedtime')).toBe('11 00:30');
  });

  it('senza turni inseriti si comporta come un riposo', () => {
    expect(plan(null, null, null).map.get('wake_morning_light')).toBe('10 08:00');
  });
});

describe('Turni da 12 ore: Giorno (G)', () => {
  const plan12 = (prev: ShiftCode | null, shift: ShiftCode | null, next: ShiftCode | null, extra: Partial<PlanInput> = {}) =>
    plan(prev, shift, next, { ...base12, ...extra });

  it('regole della mattina: sveglia + luce forte, stop caffeina, a letto la sera prima', () => {
    const { map } = plan12('R', 'G', 'G');
    // partenza = 07:00 − 30 − 30 = 06:00 → sveglia 05:30
    expect(map.get('wake_bright_light')).toBe('10 05:30');
    // il giorno prima (R) si va a letto per il G: 05:30 − 7h30 − 15 = 21:45
    expect(plan12('R', 'R', 'G').map.get('bedtime')).toBe('10 21:45');
  });

  it('pausa + pasto leggero a metà turno', () => {
    expect(plan12('R', 'G', 'R').map.get('shift_break')).toBe('10 13:00');
  });

  it('a letto = il più tardi tra (sveglia di domani − fabbisogno) e (rientro + 60 min)', () => {
    // G → G: 05:30 − 7h30 − 15 = 21:45; rientro 19:30 + 60 = 20:30 → 21:45
    expect(plan12('R', 'G', 'G').map.get('bedtime')).toBe('10 21:45');
    // G → R: 08:00 − 7h30 = 00:30 → 00:30
    expect(plan12('R', 'G', 'R').map.get('bedtime')).toBe('11 00:30');
    // G 10–22 seguito da M alle 06:00: 04:30 − 7h30 − 15 = 20:45, ma rientro 22:30 + 60 = 23:30
    const late = { ...DEFAULT_HOURS_8H, G: { start: '10:00', end: '22:00' } };
    const w = nightSleep(DAY, 'G', 'M', { ...base12, shiftHours: late })!;
    expect(format(w.bed, 'dd HH:mm')).toBe('10 23:30');
  });

  it('stop caffeina 8 ore prima di andare a letto e pisolino se ha dormito poco', () => {
    const { map } = plan12('R', 'G', 'G', { lastNightSleepMin: 300 });
    expect(map.get('caffeine_stop')).toBe('10 13:45');
    expect(map.get('nap_short')).toBe('10 14:00');
  });
});

describe('Turni da 12 ore: Notte (N 19–07)', () => {
  it('pisolino, caffeina a metà turno, pasto a mezzanotte, smonto dopo il rientro', () => {
    const { map, items } = plan('G', 'N', 'S', base12);
    // partenza 18:00 → pisolino finisce 17:00 → inizia 15:30
    expect(map.get('nap_pre_night')).toBe('10 15:30');
    expect(map.get('night_caffeine_stop')).toBe('11 01:00');
    expect(map.get('night_light_meal')).toBe('11 00:00');
    expect(map.get('drive_alert')).toBe('11 07:00');
    expectNoDuplicateTimes(items);

    const s = plan('N', 'S', 'R', base12).map;
    expect(s.get('short_sleep')).toBe('10 08:00');
    expect(s.get('wake')).toBe('10 11:30');
  });
});

describe('Nessun orario ripetuto', () => {
  const codes: (ShiftCode | null)[] = ['M', 'P', 'N', 'G', 'S', 'R', null];
  it.each([base, base12])('in tutte le combinazioni di turni', (b) => {
    for (const prev of codes) for (const shift of codes) for (const next of codes) {
      const items = computePlan({ ...b, date: DAY, prevShift: prev, shift, nextShift: next, lastNightSleepMin: 300 });
      expectNoDuplicateTimes(items);
      for (let i = 1; i < items.length; i++) {
        expect(items[i]!.time.getTime()).toBeGreaterThan(items[i - 1]!.time.getTime());
      }
    }
  });

  it('anche quando metà notte coincide con mezzanotte (turno 20–04)', () => {
    const hours = { ...DEFAULT_HOURS_8H, N: { start: '20:00', end: '04:00' } };
    const { items } = plan('R', 'N', 'S', { shiftHours: hours });
    expectNoDuplicateTimes(items);
  });
});
