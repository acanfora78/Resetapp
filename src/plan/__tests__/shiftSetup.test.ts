import { availableCodes, presetsFor, sanitizeSequence, setupForMode } from '../shiftSetup';

describe('Configurazione dei turni', () => {
  it('turni da 8 ore: M, P, N attivi', () => {
    const s = setupForMode('8h');
    expect(availableCodes(s.enabled)).toEqual(['M', 'P', 'N', 'S', 'R']);
    expect(s.hours.N).toEqual({ start: '22:00', end: '06:00' });
  });

  it('turni da 12 ore: Giorno e Notte 07–19 / 19–07', () => {
    const s = setupForMode('12h');
    expect(availableCodes(s.enabled)).toEqual(['N', 'G', 'S', 'R']);
    expect(s.hours.G).toEqual({ start: '07:00', end: '19:00' });
    expect(s.hours.N).toEqual({ start: '19:00', end: '07:00' });
  });

  it('"Non faccio questo turno" toglie il turno da schemi e sequenza', () => {
    const available = availableCodes({ M: true, P: false, N: true, G: false });
    expect(presetsFor(available)).toEqual([]);
    expect(sanitizeSequence(['M', 'P', 'N', 'S', 'R'], available)).toEqual(['M', 'N', 'S', 'R']);
  });

  it('con i turni da 12 ore resta lo schema G-N-S-R-R', () => {
    expect(presetsFor(availableCodes(setupForMode('12h').enabled))).toEqual([['G', 'N', 'S', 'R', 'R']]);
  });
});
