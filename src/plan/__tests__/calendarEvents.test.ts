import { format } from 'date-fns';

import { shiftEvents } from '../calendarEvents';
import { resolveShift } from '../cycle';
import { DEFAULT_HOURS_8H } from '../shiftSetup';

const ctx = {
  shiftHours: DEFAULT_HOURS_8H,
  commuteMin: 30,
  preferredWake: '08:00',
  sleepNeedMin: 450,
  shiftOn: (d: Date) => resolveShift(new Map(), { sequenza: ['M', 'N', 'S', 'R'], dataInizio: '2026-03-27' }, d),
};

describe('shiftEvents', () => {
  const ev = shiftEvents(ctx, new Date(2026, 2, 26), 5);

  it('niente evento nei giorni senza turno', () => {
    expect(ev[0]!.day).toBe('2026-03-27');
    expect(ev).toHaveLength(4);
  });

  it('turni di lavoro con gli orari, notte a cavallo di due giorni (anche col cambio dell’ora)', () => {
    expect([format(ev[0]!.start, 'dd HH:mm'), format(ev[0]!.end, 'dd HH:mm')]).toEqual(['27 06:00', '27 14:00']);
    // notte del 28 → 29 marzo (cambio dell'ora legale)
    expect([format(ev[1]!.start, 'dd HH:mm'), format(ev[1]!.end, 'dd HH:mm')]).toEqual(['28 22:00', '29 06:00']);
    expect(ev[1]!.allDay).toBe(false);
  });

  it('Smonto e Riposo come eventi di tutto il giorno', () => {
    expect(ev[2]!.code).toBe('S');
    expect(ev[2]!.allDay).toBe(true);
    expect(ev[3]!.code).toBe('R');
  });
});
