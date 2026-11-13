import { format } from 'date-fns';

import { computePlan } from '../engine';
import { DEFAULT_HOURS_8H } from '../shiftSetup';
import { formatDebt, recoveryPlan, sleepDebt } from '../sleepDebt';
import { baseline, isBaselineEligible, median, nextInterval, outcome } from '../vigilance';

describe('Test di vigilanza', () => {
  it('mediana', () => {
    expect(median([300, 250, 400])).toBe(300);
    expect(median([300, 250, 400, 350])).toBe(325);
    expect(median([])).toBe(0);
  });

  it('intervallo casuale tra 1 e 4 secondi', () => {
    expect(nextInterval(0)).toBe(1000);
    expect(nextInterval(0.9999)).toBe(4000);
  });

  it('riferimento: generico finché non ci sono 3 test validi, poi personale', () => {
    const t = (d: number, ms: number, eligible = true) => ({ doneAt: new Date(2026, 2, d, 11), medianMs: ms, eligible });
    expect(baseline([t(1, 280), t(2, 260)])).toEqual({ ms: 300, personal: false });
    expect(baseline([t(1, 280), t(2, 260), t(3, 900, false), t(4, 300), t(5, 500)])).toEqual({ ms: 280, personal: true });
  });

  it('validi: giorni di riposo o metà mattina', () => {
    expect(isBaselineEligible(new Date(2026, 2, 1, 11, 0), false)).toBe(true);
    expect(isBaselineEligible(new Date(2026, 2, 1, 6, 30), false)).toBe(false);
    expect(isBaselineEligible(new Date(2026, 2, 1, 6, 30), true)).toBe(true);
  });

  it('esito: verde, giallo (+20%), rosso (+40%)', () => {
    expect(outcome(310, 300)).toBe('green');
    expect(outcome(360, 300)).toBe('yellow');
    expect(outcome(420, 300)).toBe('red');
  });
});

describe('Debito di sonno', () => {
  const today = new Date(2026, 2, 10, 9);

  it('somma solo i valori positivi degli ultimi 7 giorni', () => {
    const d = sleepDebt(
      [
        { data: '2026-03-10', minutes: 360 }, // −90
        { data: '2026-03-09', minutes: 500 }, // nessun debito
        { data: '2026-03-08', minutes: 300 }, // −150
        { data: '2026-03-01', minutes: 100 }, // fuori finestra
      ],
      450,
      today,
    );
    expect(d.totalMin).toBe(240);
    expect(d.perDay).toHaveLength(7);
    expect(formatDebt(d.totalMin)).toBe('−4 h');
    expect(formatDebt(390)).toBe('−6 h 30');
  });

  it('il recupero si distribuisce sui riposi, al massimo 90 min a notte', () => {
    const shifts: Record<string, 'M' | 'R' | 'N'> = { '11': 'M', '12': 'R', '13': 'R', '14': 'N', '15': 'R' };
    const shiftOn = (d: Date) => shifts[format(d, 'dd')] ?? 'M';
    const plan = recoveryPlan(240, today, shiftOn);
    expect([...plan.entries()]).toEqual([
      ['2026-03-12', 90],
      ['2026-03-13', 90],
    ]); // il 15 viene dopo una notte: niente recupero
  });

  it('nel piano: sveglia più tardi ma non oltre le 10:00', () => {
    const base = {
      date: new Date(2026, 2, 12),
      prevShift: 'R' as const,
      shift: 'R' as const,
      nextShift: 'R' as const,
      shiftHours: DEFAULT_HOURS_8H,
      commuteMin: 30,
      preferredWake: '08:00',
      sleepNeedMin: 450,
    };
    const wake = (extra: number, preferredWake = '08:00') =>
      format(computePlan({ ...base, preferredWake, recoveryExtraMin: extra }).find((i) => i.key === 'wake_morning_light')!.time, 'HH:mm');
    expect(wake(0)).toBe('08:00');
    expect(wake(90)).toBe('09:30');
    expect(wake(200)).toBe('09:30'); // al massimo 90
    expect(wake(90, '09:00')).toBe('10:00'); // non oltre le 10:00
  });
});
