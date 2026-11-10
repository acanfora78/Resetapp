import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';
import { env, isSupabaseConfigured } from './env';

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase non configurato: imposta EXPO_PUBLIC_SUPABASE_URL ed EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient<Database>(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'placeholder',
  {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Aggiorna il token solo quando l'app è in primo piano.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
