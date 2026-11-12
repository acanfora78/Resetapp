/**
 * Turni ciclici: funzioni pure.
 */
import { addDays, differenceInCalendarDays, format, max as maxDate, parseISO, startOfDay } from 'date-fns';

import type { ShiftCode } from './types';

export interface CyclePattern {
  sequenza: ShiftCode[];
  /** "yyyy-MM-dd" */
  dataInizio: string;
}

export const toISODate = (d: Date): string => format(d, 'yyyy-MM-dd');
export const fromISODate = (s: string): Date => startOfDay(parseISO(s));

/** Turno previsto dallo schema per una data, oppure null se la data è prima dell'inizio. */
export function shiftFromPattern(pattern: CyclePattern, date: Date): ShiftCode | null {
  const len = pattern.sequenza.length;
  if (len === 0) return null;
  const diff = differenceInCalendarDays(startOfDay(date), fromISODate(pattern.dataInizio));
  if (diff < 0) return null;
  return pattern.sequenza[diff % len] ?? null;
}

export interface GeneratedShift {
  data: string;
  codice: ShiftCode;
}

/** Genera i turni dello schema tra `from` e `to` inclusi (mai prima della data di inizio). */
export function generateShifts(pattern: CyclePattern, from: Date, to: Date): GeneratedShift[] {
  const out: GeneratedShift[] = [];
  let d = maxDate([startOfDay(from), fromISODate(pattern.dataInizio)]);
  const end = startOfDay(to);
  while (d <= end) {
    const codice = shiftFromPattern(pattern, d);
    if (codice) out.push({ data: toISODate(d), codice });
    d = addDays(d, 1);
  }
  return out;
}

export interface StoredShift {
  data: string;
  codice: ShiftCode;
  manuale: boolean;
}

/**
 * Unisce turni generati e turni salvati: i turni modificati a mano vincono sempre.
 * Restituisce solo i turni automatici da scrivere (nuovi o cambiati).
 */
export function shiftsToWrite(generated: GeneratedShift[], stored: StoredShift[]): GeneratedShift[] {
  const byDate = new Map(stored.map((s) => [s.data, s]));
  return generated.filter((g) => {
    const s = byDate.get(g.data);
    if (!s) return true;
    if (s.manuale) return false;
    return s.codice !== g.codice;
  });
}

/**
 * Turno di un giorno: vince quello salvato (manuale o generato);
 * se manca, si usa quello previsto dallo schema attivo.
 */
export function resolveShift(
  stored: ReadonlyMap<string, ShiftCode>,
  pattern: CyclePattern | null,
  date: Date,
): ShiftCode | null {
  return stored.get(toISODate(date)) ?? (pattern ? shiftFromPattern(pattern, date) : null);
}
