import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { ProfileRow } from './database.types';
import { fetchProfile } from './profile';
import { supabase } from './supabase';

interface SessionState {
  /** true finché non sappiamo se c'è una sessione salvata. */
  loading: boolean;
  session: Session | null;
  userId: string | null;
  profile: ProfileRow | null;
  refreshProfile: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setProfileReady(true);
      return;
    }
    try {
      setProfile(await fetchProfile(userId));
    } catch (e) {
      console.warn('Profilo non caricato', e);
    } finally {
      setProfileReady(true);
    }
  }, [userId]);

  useEffect(() => {
    setProfileReady(false);
    refreshProfile();
  }, [refreshProfile]);

  const value = useMemo<SessionState>(
    () => ({
      loading: !authReady || !profileReady,
      session,
      userId,
      profile,
      refreshProfile,
    }),
    [authReady, profileReady, session, userId, profile, refreshProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession va usato dentro SessionProvider');
  return ctx;
}

/** userId garantito: usare solo nelle schermate protette. */
export function useUserId(): string {
  const { userId } = useSession();
  if (!userId) throw new Error('Utente non autenticato');
  return userId;
}
