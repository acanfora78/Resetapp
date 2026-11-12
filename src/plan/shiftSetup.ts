/**
 * Configurazione dei tipi di turno scelta al passo 3: turni da 8 ore,
 * da 12 ore o personalizzati. Funzioni pure.
 */
import type { ShiftCode, ShiftHoursMap, ShiftMode, WorkShiftCode } from './types';
import { WORK_SHIFT_CODES } from './types';

export type EnabledMap = Record<WorkShiftCode, boolean>;

export interface ShiftSetup {
  mode: ShiftMode;
  hours: ShiftHoursMap;
  enabled: EnabledMap;
}

export const DEFAULT_HOURS_8H: ShiftHoursMap = {
  M: { start: '06:00', end: '14:00' },
  P: { start: '14:00', end: '22:00' },
  N: { start: '22:00', end: '06:00' },
  G: { start: '07:00', end: '19:00' },
};

export const DEFAULT_HOURS_12H: ShiftHoursMap = {
  ...DEFAULT_HOURS_8H,
  G: { start: '07:00', end: '19:00' },
  N: { start: '19:00', end: '07:00' },
};

/** Valori di partenza per ciascuna scelta. */
export function setupForMode(mode: ShiftMode): ShiftSetup {
  switch (mode) {
    case '8h':
      return { mode, hours: { ...DEFAULT_HOURS_8H }, enabled: { M: true, P: true, N: true, G: false } };
    case '12h':
      return { mode, hours: { ...DEFAULT_HOURS_12H }, enabled: { M: false, P: false, N: true, G: true } };
    case 'personalizzati':
      return { mode, hours: { ...DEFAULT_HOURS_8H }, enabled: { M: true, P: true, N: true, G: false } };
  }
}

/** Tipi di turno che l'utente fa davvero: quelli attivi più Smonto e Riposo. */
export function availableCodes(enabled: EnabledMap): ShiftCode[] {
  return [...WORK_SHIFT_CODES.filter((c) => enabled[c]), 'S', 'R'];
}

/** Toglie dalla sequenza i turni non più disponibili. */
export function sanitizeSequence(sequence: ShiftCode[], available: ShiftCode[]): ShiftCode[] {
  return sequence.filter((c) => available.includes(c));
}

export const PATTERN_PRESETS: ShiftCode[][] = [
  ['M', 'P', 'N', 'S', 'R'],
  ['M', 'M', 'P', 'P', 'N', 'N', 'S', 'R'],
  ['M', 'P', 'N', 'S', 'R', 'R'],
  ['G', 'N', 'S', 'R', 'R'],
];

/** Schemi comuni compatibili con i turni disponibili. */
export function presetsFor(available: ShiftCode[]): ShiftCode[][] {
  return PATTERN_PRESETS.filter((p) => p.every((c) => available.includes(c)));
}
