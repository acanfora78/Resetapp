import { format } from 'date-fns';

import { buildPreview } from '../context';
import type { PlanContext } from '../context';
import { resolveShift } from '../cycle';
import { DEFAULT_HOURS_8H } from '../shiftSetup';

/**
 * Caso segnalato su TestFlight: schema M-P-N-S-R con partenza venerdì 13 novembre,
 * onboarding fatto giovedì 12 novembre alle 20:22. L'anteprima diceva
 * "Domani non hai turni inseriti".
 */
describe('Anteprima del piano di domani', () => {
  const now = new Date(2026, 10, 12, 20, 22); // giovedì 12/11/2026 20:22, ora locale
  const ctx: PlanContext = {
    shiftHours: DEFAULT_HOURS_8H,
    commuteMin: 30,
    preferredWake: '08:00',
    sleepNeedMin: 450,
    shiftOn: (d) =>
      resolveShift(new Map(), { sequenza: ['M', 'P', 'N', 'S', 'R'], dataInizio: '2026-11-13' }, d),
  };

  it('domani è Mattina, calcolato dallo schema anche senza turni salvati', () => {
    expect(buildPreview(ctx, now).tomorrowShift).toBe('M');
  });

  it('funziona a qualsiasi ora del giorno, anche a ridosso della mezzanotte', () => {
    for (const [h, m] of [[0, 0], [0, 30], [12, 0], [23, 59]] as const) {
      expect(buildPreview(ctx, new Date(2026, 10, 12, h, m)).tomorrowShift).toBe('M');
    }
  });

  it('"Stasera" mostra solo l’ora di andare a letto di stasera', () => {
    const p = buildPreview(ctx, now);
    expect(p.tonight?.key).toBe('bedtime');
    expect(format(p.tonight!.time, 'dd/MM HH:mm')).toBe('12/11 20:45');
  });

  it('"Domani" non ripete l’ora di andare a letto e non ha orari doppi', () => {
    const p = buildPreview(ctx, now);
    expect(p.tomorrow.some((i) => i.key === 'bedtime')).toBe(false);
    expect(p.tomorrow[0]?.key).toBe('wake_bright_light');
    expect(format(p.tomorrow[0]!.time, 'dd/MM HH:mm')).toBe('13/11 04:30');
    const times = p.tomorrow.map((i) => i.time.getTime());
    expect(new Set(times).size).toBe(times.length);
  });
});
