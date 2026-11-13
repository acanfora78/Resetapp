/**
 * "Movimento al momento giusto": prima finestra libera della giornata. Funzione pura.
 */
import { addMinutes } from 'date-fns';

import { RULES } from './rules';
import type { Interval } from './types';

export interface MovementInput {
  /** Da quando cercare (di solito la sveglia del giorno). */
  from: Date;
  /** Entro quando deve finire il movimento. */
  until: Date;
  /** Sonni principali e pisolini: niente movimento da tot ore prima fino a 60 min dopo il risveglio. */
  sleeps: Interval[];
  /** Turno con il tragitto, pasti, eventi: il movimento non si sovrappone. */
  busy: Interval[];
}

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/**
 * Inizio della prima finestra di almeno MOVEMENT_DURATION_MIN che:
 * - inizia almeno MOVEMENT_MIN_AFTER_WAKE_MIN dopo una sveglia;
 * - finisce almeno MOVEMENT_MIN_BEFORE_SLEEP_H prima di un sonno o di un pisolino;
 * - non si sovrappone a turno, tragitto, pisolini, pasti o eventi.
 * Null se non c'è una finestra valida.
 */
export function findMovementWindow(input: MovementInput): Date | null {
  const blocks: Interval[] = [
    ...input.busy,
    ...input.sleeps.map((s) => ({
      start: addMinutes(s.start, -RULES.MOVEMENT_MIN_BEFORE_SLEEP_H * 60),
      end: addMinutes(s.end, RULES.MOVEMENT_MIN_AFTER_WAKE_MIN),
    })),
  ];
  // Gli inizi possibili: l'inizio della ricerca e la fine di ogni blocco.
  const candidates = [input.from, ...blocks.map((b) => b.end)]
    .filter((t) => t >= input.from)
    .sort((a, b) => a.getTime() - b.getTime());
  for (const start of candidates) {
    const slot = { start, end: addMinutes(start, RULES.MOVEMENT_DURATION_MIN) };
    if (slot.end > input.until) continue;
    if (!blocks.some((b) => overlaps(slot, b))) return start;
  }
  return null;
}
