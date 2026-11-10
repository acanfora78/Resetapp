import { addDays, addMinutes, startOfDay } from 'date-fns';

import type { ClockTime } from './types';

export function parseClock(value: ClockTime): { h: number; m: number } {
  const [h, m] = value.split(':').map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

/** Restituisce la data `day` all'orario `clock` (ora locale). */
export function atClock(day: Date, clock: ClockTime): Date {
  const { h, m } = parseClock(clock);
  return addMinutes(startOfDay(day), h * 60 + m);
}

/** Inizio e fine di un turno che comincia il giorno `day`. Se la fine è prima dell'inizio, il turno finisce il giorno dopo. */
export function shiftWindow(day: Date, start: ClockTime, end: ClockTime): { start: Date; end: Date } {
  const s = atClock(day, start);
  let e = atClock(day, end);
  if (e <= s) e = addDays(e, 1);
  return { start: s, end: e };
}

export function formatClock(date: Date): ClockTime {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** "HH:mm:ss" (Postgres time) → "HH:mm" */
export function toClock(value: string | null | undefined, fallback: ClockTime): ClockTime {
  if (!value) return fallback;
  return value.slice(0, 5);
}

/** Maiuscola solo sulla prima lettera ("giovedì 12 novembre" → "Giovedì 12 novembre"). */
export const capitalizeFirst = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
