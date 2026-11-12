import { generateShifts, resolveShift, shiftFromPattern, shiftsToWrite } from '../cycle';
import type { CyclePattern } from '../cycle';

const pattern: CyclePattern = { sequenza: ['M', 'P', 'N', 'S', 'R'], dataInizio: '2026-03-01' };

describe('shiftFromPattern', () => {
  it('segue la sequenza a partire dalla data di inizio', () => {
    expect(shiftFromPattern(pattern, new Date(2026, 2, 1))).toBe('M');
    expect(shiftFromPattern(pattern, new Date(2026, 2, 3))).toBe('N');
    expect(shiftFromPattern(pattern, new Date(2026, 2, 6))).toBe('M');
    expect(shiftFromPattern(pattern, new Date(2026, 2, 10))).toBe('R');
  });

  it('prima della data di inizio non c’è turno', () => {
    expect(shiftFromPattern(pattern, new Date(2026, 1, 28))).toBeNull();
  });

  it('funziona attraverso il cambio dell’ora legale', () => {
    // 29 marzo 2026: passaggio all'ora legale in Italia
    expect(shiftFromPattern(pattern, new Date(2026, 2, 30))).toBe('R');
    expect(shiftFromPattern(pattern, new Date(2026, 2, 31))).toBe('M');
  });
});

describe('generateShifts', () => {
  it('genera un turno per ogni giorno, mai prima dell’inizio', () => {
    const out = generateShifts(pattern, new Date(2026, 1, 27), new Date(2026, 2, 3));
    expect(out).toEqual([
      { data: '2026-03-01', codice: 'M' },
      { data: '2026-03-02', codice: 'P' },
      { data: '2026-03-03', codice: 'N' },
    ]);
  });

  it('copre più mesi', () => {
    const out = generateShifts(pattern, new Date(2026, 2, 1), new Date(2026, 5, 30));
    expect(out).toHaveLength(122);
  });
});

describe('shiftsToWrite', () => {
  const generated = generateShifts(pattern, new Date(2026, 2, 1), new Date(2026, 2, 4));

  it('non sovrascrive mai le modifiche manuali', () => {
    const out = shiftsToWrite(generated, [{ data: '2026-03-02', codice: 'R', manuale: true }]);
    expect(out.map((s) => s.data)).toEqual(['2026-03-01', '2026-03-03', '2026-03-04']);
  });

  it('salta i turni automatici già corretti e aggiorna quelli cambiati', () => {
    const out = shiftsToWrite(generated, [
      { data: '2026-03-01', codice: 'M', manuale: false },
      { data: '2026-03-03', codice: 'R', manuale: false },
    ]);
    expect(out).toEqual([
      { data: '2026-03-02', codice: 'P' },
      { data: '2026-03-03', codice: 'N' },
      { data: '2026-03-04', codice: 'S' },
    ]);
  });
});

describe('resolveShift', () => {
  const stored = new Map([['2026-03-02', 'R' as const]]);

  it('usa il turno salvato quando c’è', () => {
    expect(resolveShift(stored, pattern, new Date(2026, 2, 2))).toBe('R');
  });

  it('altrimenti usa lo schema', () => {
    expect(resolveShift(stored, pattern, new Date(2026, 2, 3))).toBe('N');
  });

  it('senza schema e senza turno salvato restituisce null', () => {
    expect(resolveShift(stored, null, new Date(2026, 2, 3))).toBeNull();
  });
});
