import { recoveryScore, streak } from '../score';

describe('Punteggio di recupero', () => {
  it('pieno: sonno completo, energia 5, tutte le azioni', () => {
    expect(recoveryScore({ sleptMin: 450, needMin: 450, energy: 5, done: 6, total: 6 })).toBe(100);
  });

  it('pesi 50/30/20', () => {
    // metà sonno = 25, energia 3 = 15, metà azioni = 10
    expect(recoveryScore({ sleptMin: 225, needMin: 450, energy: 3, done: 3, total: 6 })).toBe(50);
  });

  it('il sonno oltre il fabbisogno non dà più del 100%', () => {
    expect(recoveryScore({ sleptMin: 600, needMin: 450, energy: 1, done: 0, total: 5 })).toBe(50);
  });

  it('energia 1 vale zero; senza diario niente punteggio', () => {
    expect(recoveryScore({ sleptMin: 0, needMin: 450, energy: 1, done: 0, total: 5 })).toBe(0);
    expect(recoveryScore({ sleptMin: null, needMin: 450, energy: 4, done: 2, total: 5 })).toBeNull();
  });
});

describe('Serie', () => {
  const today = new Date(2026, 2, 10, 12);
  const data: Record<string, { done: number; total: number }> = {
    '2026-03-10': { done: 2, total: 6 }, // oggi non ancora al 70%
    '2026-03-09': { done: 5, total: 7 }, // 71%
    '2026-03-08': { done: 7, total: 10 }, // 70% esatto
    '2026-03-07': { done: 1, total: 5 },
  };
  const progress = (d: string) => data[d] ?? { done: 0, total: 0 };

  it('conta i giorni consecutivi con almeno il 70%', () => {
    expect(streak(progress, today)).toBe(2);
  });

  it('oggi conta se il 70% è già raggiunto', () => {
    data['2026-03-10'] = { done: 5, total: 6 };
    expect(streak(progress, today)).toBe(3);
  });

  it('a cavallo del cambio dell’ora legale', () => {
    const p = (d: string) => (['2026-03-28', '2026-03-29', '2026-03-30'].includes(d) ? { done: 1, total: 1 } : { done: 0, total: 1 });
    expect(streak(p, new Date(2026, 2, 30, 9))).toBe(3);
  });
});
