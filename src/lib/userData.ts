/** Accesso a eventi, test di vigilanza e diario del sonno. */
import type { EventRow, SleepLogRow, VigilanceTestRow } from './database.types';
import { supabase } from './supabase';

// --- Eventi ("Posso andarci?") -------------------------------------------------

export async function fetchEvents(from: Date, to: Date): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .lt('inizio', to.toISOString())
    .gt('fine', from.toISOString())
    .order('inizio');
  if (error) throw error;
  return data ?? [];
}

export async function saveEvent(userId: string, titolo: string, inizio: Date, fine: Date) {
  const { error } = await supabase
    .from('events')
    .insert({ user_id: userId, titolo, inizio: inizio.toISOString(), fine: fine.toISOString() });
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

// --- Test di vigilanza ------------------------------------------------------------

export async function fetchVigilanceTests(): Promise<VigilanceTestRow[]> {
  const { data, error } = await supabase.from('vigilance_tests').select('*').order('fatto_at');
  if (error) throw error;
  return data ?? [];
}

export async function saveVigilanceTest(row: Omit<VigilanceTestRow, 'id'>) {
  const { error } = await supabase.from('vigilance_tests').insert(row);
  if (error) throw error;
}

// --- Diario del sonno ---------------------------------------------------------------

export async function fetchSleepLogs(fromISO: string): Promise<SleepLogRow[]> {
  const { data, error } = await supabase.from('sleep_logs').select('*').gte('data', fromISO).order('data');
  if (error) throw error;
  return data ?? [];
}

export async function saveSleepLog(
  userId: string,
  entry: { data: string; a_letto: Date; sveglia: Date; energia: number; note: string | null },
) {
  const minuti = Math.round((entry.sveglia.getTime() - entry.a_letto.getTime()) / 60000);
  const { error } = await supabase.from('sleep_logs').upsert(
    {
      user_id: userId,
      data: entry.data,
      a_letto: entry.a_letto.toISOString(),
      sveglia: entry.sveglia.toISOString(),
      minuti_dormiti: minuti,
      energia: entry.energia,
      note: entry.note,
    },
    { onConflict: 'user_id,data' },
  );
  if (error) throw error;
}
