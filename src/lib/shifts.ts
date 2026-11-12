import { addMonths, endOfMonth, max as maxDate, min as minDate, startOfDay, subDays } from 'date-fns';

import { fromISODate, generateShifts, shiftsToWrite, toISODate } from '@/plan/cycle';
import type { CyclePattern } from '@/plan/cycle';
import it from '@/i18n/it';
import { toClock } from '@/plan/time';
import { availableCodes, DEFAULT_HOURS_8H } from '@/plan/shiftSetup';
import type { EnabledMap } from '@/plan/shiftSetup';
import { isWorkShift, SHIFT_CODES, WORK_SHIFT_CODES } from '@/plan/types';
import type { ShiftCode, ShiftHoursMap, WorkShiftCode } from '@/plan/types';

import type { ShiftPatternRow, ShiftRow, ShiftTypeRow } from './database.types';
import { supabase } from './supabase';

/** Mesi generati in avanti quando si salva lo schema. */
export const GENERATION_MONTHS_AHEAD = 6;
/** Quanto si torna indietro al massimo quando lo schema parte nel passato. */
export const GENERATION_DAYS_BACK = 60;

export const DEFAULT_SHIFT_HOURS: ShiftHoursMap = DEFAULT_HOURS_8H;

// ---------------------------------------------------------------------------
// Tipi di turno
// ---------------------------------------------------------------------------

export async function fetchShiftTypes(): Promise<ShiftTypeRow[]> {
  const { data, error } = await supabase.from('shift_types').select('*');
  if (error) throw error;
  return data ?? [];
}

export function shiftHoursFromTypes(types: ShiftTypeRow[]): ShiftHoursMap {
  const get = (code: WorkShiftCode) => {
    const t = types.find((x) => x.codice === code);
    return {
      start: toClock(t?.inizio, DEFAULT_SHIFT_HOURS[code].start),
      end: toClock(t?.fine, DEFAULT_SHIFT_HOURS[code].end),
    };
  };
  return { M: get('M'), P: get('P'), N: get('N'), G: get('G') };
}

/** Turni che l'utente fa davvero (attivi), più Smonto e Riposo. */
export function availableCodesFromTypes(types: ShiftTypeRow[]): ShiftCode[] {
  if (types.length === 0) return ['M', 'P', 'N', 'S', 'R'];
  const enabled = Object.fromEntries(
    WORK_SHIFT_CODES.map((c) => [c, !!types.find((t) => t.codice === c && t.attivo !== false)]),
  ) as EnabledMap;
  return availableCodes(enabled);
}

export async function saveShiftTypes(userId: string, hours: ShiftHoursMap, enabled: EnabledMap) {
  const rows = SHIFT_CODES.map((codice) => {
    const work = isWorkShift(codice);
    return {
      user_id: userId,
      codice,
      nome: it.shifts.names[codice],
      inizio: work ? hours[codice].start : null,
      fine: work ? hours[codice].end : null,
      attivo: work ? enabled[codice] : true,
    };
  });
  const { error } = await supabase.from('shift_types').upsert(rows, { onConflict: 'user_id,codice' });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Schema ciclico
// ---------------------------------------------------------------------------

export async function fetchActivePattern(): Promise<ShiftPatternRow | null> {
  const { data, error } = await supabase
    .from('shift_patterns')
    .select('*')
    .eq('attivo', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const toCyclePattern = (p: ShiftPatternRow): CyclePattern => ({
  sequenza: p.sequenza,
  dataInizio: p.data_inizio,
});

/** Scrive i turni automatici nell'intervallo, senza toccare quelli modificati a mano. */
export async function generateRange(pattern: CyclePattern, from: Date, to: Date) {
  const generated = generateShifts(pattern, from, to);
  if (generated.length === 0) return;
  const stored = await fetchShifts(generated[0]!.data, generated[generated.length - 1]!.data);
  const toWrite = shiftsToWrite(generated, stored);
  if (toWrite.length === 0) return;
  const { error } = await supabase.rpc('upsert_turni_automatici', { p_turni: toWrite });
  if (error) throw error;
}

/**
 * Salva un nuovo schema (disattivando il precedente) e rigenera i turni
 * automatici dei prossimi mesi. Le modifiche manuali restano.
 */
export async function savePattern(userId: string, sequenza: ShiftCode[], dataInizio: string) {
  const { error: offErr } = await supabase
    .from('shift_patterns')
    .update({ attivo: false })
    .eq('attivo', true);
  if (offErr) throw offErr;

  const { error } = await supabase
    .from('shift_patterns')
    .insert({ user_id: userId, sequenza, data_inizio: dataInizio, attivo: true });
  if (error) throw error;

  const pattern: CyclePattern = { sequenza, dataInizio };
  const today = startOfDay(new Date());
  const from = maxDate([fromISODate(dataInizio), subDays(today, GENERATION_DAYS_BACK)]);
  const to = endOfMonth(addMonths(today, GENERATION_MONTHS_AHEAD));

  // Togli i turni automatici del vecchio schema (da oggi o dall'inizio, se prima), poi rigenera.
  const { error: delErr } = await supabase
    .from('shifts')
    .delete()
    .eq('manuale', false)
    .gte('data', toISODate(minDate([from, today])));
  if (delErr) throw delErr;

  await generateRange(pattern, from, to);
}

/** Disattiva lo schema e toglie i turni automatici da oggi in poi. */
export async function disablePattern() {
  const { error } = await supabase.from('shift_patterns').update({ attivo: false }).eq('attivo', true);
  if (error) throw error;
  const { error: delErr } = await supabase
    .from('shifts')
    .delete()
    .eq('manuale', false)
    .gte('data', toISODate(new Date()));
  if (delErr) throw delErr;
}

// ---------------------------------------------------------------------------
// Turni
// ---------------------------------------------------------------------------

export async function fetchShifts(fromISO: string, toISO: string): Promise<ShiftRow[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .gte('data', fromISO)
    .lte('data', toISO)
    .order('data');
  if (error) throw error;
  return data ?? [];
}

/** Modifica manuale di un giorno: non verrà più toccato dallo schema. */
export async function setManualShift(userId: string, dataISO: string, codice: ShiftCode) {
  const { error } = await supabase
    .from('shifts')
    .upsert({ user_id: userId, data: dataISO, codice, manuale: true }, { onConflict: 'user_id,data' });
  if (error) throw error;
}

/** Riporta il giorno al turno previsto dallo schema. */
export async function restoreFromPattern(userId: string, dataISO: string, codice: ShiftCode) {
  const { error } = await supabase
    .from('shifts')
    .upsert({ user_id: userId, data: dataISO, codice, manuale: false }, { onConflict: 'user_id,data' });
  if (error) throw error;
}

export async function deleteShift(dataISO: string) {
  const { error } = await supabase.from('shifts').delete().eq('data', dataISO);
  if (error) throw error;
}
