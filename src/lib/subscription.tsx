import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { SubscriptionRow } from './database.types';
import { useSession } from './session';
import { supabase } from './supabase';

interface SubscriptionState {
  loading: boolean;
  row: SubscriptionRow | null;
  active: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SubscriptionState | null>(null);

/** Stato dell'abbonamento dell'utente (tabella subscriptions, scritta solo dal server). */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { userId } = useSession();
  const [row, setRow] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setRow(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('subscriptions').select('*').maybeSingle();
    setRow(data ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const active = !!row && row.stato === 'attivo' && (!row.scadenza || new Date(row.scadenza) > new Date());
  const value = useMemo(() => ({ loading, row, active, refresh }), [loading, row, active, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSubscription(): SubscriptionState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSubscription va usato dentro SubscriptionProvider');
  return v;
}
