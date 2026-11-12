import { planText } from '@/i18n/planText';
import strings from '@/i18n/it';

import { computePlan, dayContext } from '../engine';
import { DEFAULT_HOURS_8H } from '../shiftSetup';
import type { PlanItemKey, ShiftCode } from '../types';

describe('dayContext', () => {
  it.each([
    [['R', 'N', 'N'], 'first_night'],
    [['P', 'N', 'S'], 'first_night'], // notte singola
    [['N', 'N', 'N'], 'N'],
    [['N', 'N', 'S'], 'last_night'],
    [['N', 'S', 'R'], 'S'],
    [['N', 'R', 'R'], 'S'], // riposo subito dopo la notte = smonto
    [['S', 'R', 'R'], 'first_rest'],
    [['M', 'R', 'M'], 'first_rest'],
    [['R', 'R', 'M'], 'R'],
    [[null, null, null], 'R'],
    [['R', 'M', 'P'], 'M'],
    [['R', 'G', 'N'], 'G'],
    [['M', 'P', 'N'], 'P'],
  ] as [(ShiftCode | null)[], string][])('%j → %s', ([prev, shift, next], expected) => {
    expect(dayContext(prev!, shift!, next!)).toBe(expected);
  });
});

const base = {
  shiftHours: DEFAULT_HOURS_8H,
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
  date: new Date(2026, 2, 10),
};

const textOf = (prev: ShiftCode | null, shift: ShiftCode | null, next: ShiftCode | null, key: PlanItemKey) => {
  const item = computePlan({ ...base, prevShift: prev, shift, nextShift: next }).find((i) => i.key === key);
  return item ? planText(item).why : undefined;
};

describe('Spiegazioni secondo il tipo di giornata', () => {
  it('giorno con la prima notte: la sveglia parla del pisolino, non del ritmo generico', () => {
    expect(textOf('R', 'N', 'N', 'wake')).toBe(
      'Ti alzi a orario normale: il pisolino del pomeriggio ti ricarica per stanotte.',
    );
  });

  it('nei giorni liberi nessuna frase che parli di turno', () => {
    for (const key of ['wake_morning_light', 'bedtime', 'light_activity'] as PlanItemKey[]) {
      const t = textOf('R', 'R', 'R', key);
      expect(t).toBeDefined();
      expect(t).not.toMatch(/turno/i);
    }
  });

  it('"A letto" si spiega con il turno di domani', () => {
    expect(textOf('R', 'R', 'M', 'bedtime')).toMatch(/Domani si parte presto/);
    expect(textOf('R', 'R', 'N', 'bedtime')).toMatch(/prima notte/);
  });

  it('ultima notte e prima notte hanno testi diversi per il pisolino', () => {
    expect(textOf('R', 'N', 'N', 'nap_pre_night')).not.toBe(textOf('N', 'N', 'S', 'nap_pre_night'));
  });

  it('ogni azione ha titolo e spiegazione predefinita', () => {
    for (const [key, t] of Object.entries(strings.plan.items)) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.why.length).toBeGreaterThan(0);
      expect(key).toBeTruthy();
    }
  });
});
