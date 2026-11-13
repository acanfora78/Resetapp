import { CAFFEINE_DOSES_MG } from '@/plan/rules';
import type { CaffeineType } from '@/plan/rules';
import type { CaffeineDose } from '@/plan/caffeine';

import type { CaffeineLogRow } from './database.types';
import { supabase } from './supabase';

/** Caffè registrati dalle `hours` ore precedenti in poi. */
export async function fetchCaffeine(since: Date): Promise<CaffeineLogRow[]> {
  const { data, error } = await supabase
    .from('caffeine_logs')
    .select('*')
    .gte('consumato_at', since.toISOString())
    .order('consumato_at');
  if (error) throw error;
  return data ?? [];
}

export const toDoses = (rows: CaffeineLogRow[]): CaffeineDose[] =>
  rows.map((r) => ({ at: new Date(r.consumato_at), mg: r.quantita_mg }));

export async function logCaffeine(userId: string, tipo: CaffeineType, at: Date = new Date()) {
  const { error } = await supabase
    .from('caffeine_logs')
    .insert({ user_id: userId, tipo, quantita_mg: CAFFEINE_DOSES_MG[tipo], consumato_at: at.toISOString() });
  if (error) throw error;
}

export async function deleteCaffeine(id: string) {
  const { error } = await supabase.from('caffeine_logs').delete().eq('id', id);
  if (error) throw error;
}
