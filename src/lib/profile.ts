import type { ProfileRow } from './database.types';
import { supabase } from './supabase';

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, patch: Partial<Omit<ProfileRow, 'id' | 'created_at'>>) {
  // upsert: se il trigger non avesse creato il profilo, lo creiamo qui.
  const { error } = await supabase.from('profiles').upsert({ id: userId, ...patch });
  if (error) throw error;
}
