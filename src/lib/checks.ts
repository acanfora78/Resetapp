import type { PlanItemKey } from '@/plan/types';

import { supabase } from './supabase';

export interface CheckRow {
  data: string;
  item_key: string;
}

/** Azioni spuntate tra due date (incluse), come id "yyyy-MM-dd_chiave". */
export async function fetchCheckIds(fromISO: string, toISO: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('plan_checks')
    .select('data, item_key')
    .gte('data', fromISO)
    .lte('data', toISO);
  if (error) throw error;
  return new Set((data ?? []).map((r) => `${r.data}_${r.item_key}`));
}

export async function setCheck(userId: string, dataISO: string, key: PlanItemKey, done: boolean) {
  if (done) {
    const { error } = await supabase
      .from('plan_checks')
      .upsert(
        { user_id: userId, data: dataISO, item_key: key, fatto_at: new Date().toISOString() },
        { onConflict: 'user_id,data,item_key' },
      );
    if (error) throw error;
  } else {
    const { error } = await supabase.from('plan_checks').delete().eq('data', dataISO).eq('item_key', key);
    if (error) throw error;
  }
}
