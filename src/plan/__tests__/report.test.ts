import { monthlySummary } from '../report';

describe('Riepilogo mensile', () => {
  it('considera solo il mese scelto', () => {
    const s = monthlySummary({
      month: new Date(2026, 10, 15),
      needMin: 450,
      sleep: [
        { data: '2026-10-31', minutes: 100, energy: 1 },
        { data: '2026-11-01', minutes: 420, energy: 3 },
        { data: '2026-11-30', minutes: 480, energy: 5 },
      ],
      scores: [
        { data: '2026-11-01', score: 60 },
        { data: '2026-11-02', score: 81 },
        { data: '2026-12-01', score: 99 },
      ],
      streak: 4,
    });
    expect(s).toEqual({
      from: '2026-11-01',
      to: '2026-11-30',
      nightsLogged: 2,
      avgSleepMin: 450,
      avgEnergy: 4,
      nightsUnderNeed: 1,
      avgScore: 71,
      bestScore: 81,
      streak: 4,
    });
  });

  it('mese senza dati', () => {
    const s = monthlySummary({ month: new Date(2026, 1, 1), needMin: 450, sleep: [], scores: [], streak: 0 });
    expect(s.avgSleepMin).toBeNull();
    expect(s.to).toBe('2026-02-28');
  });
});
