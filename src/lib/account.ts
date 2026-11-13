import AsyncStorage from '@react-native-async-storage/async-storage';

import { signOut } from './auth';
import { disablePhoneCalendar } from './phoneCalendar';
import { syncNotifications } from './notifications';
import { supabase } from './supabase';

/** Elimina l'account e tutti i dati (Edge Function "elimina-account"), poi pulisce il telefono. */
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('elimina-account', { method: 'POST' });
  if (error) throw error;
  await syncNotifications(null, null);
  await disablePhoneCalendar().catch(() => {});
  await AsyncStorage.clear().catch(() => {});
  await signOut();
}
