/**
 * Dati del piano condivisi dall'app (turni, orari, preferenze), ricaricati
 * all'apertura, al ritorno in primo piano e dopo ogni modifica. Ogni ricarica
 * riprogramma anche le notifiche.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';

import type { PlanContext } from '@/plan/context';

import { syncNotifications } from './notifications';
import { loadPlanContext } from './plan';
import { useSession } from './session';

interface PlanDataState {
  ctx: PlanContext | null;
  error: unknown;
  loading: boolean;
  /** Ricarica turni e orari e riprogramma le notifiche. */
  reload: () => Promise<void>;
  /** Solo riprogramma le notifiche (es. dopo una spunta). */
  resync: () => Promise<void>;
}

const PlanDataContext = createContext<PlanDataState | null>(null);

export function PlanDataProvider({ children }: { children: ReactNode }) {
  const { profile } = useSession();
  const [ctx, setCtx] = useState<PlanContext | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const ctxRef = useRef<PlanContext | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const onboarded = !!profile?.onboarding_completato_at;

  const reload = useCallback(async () => {
    const p = profileRef.current;
    if (!p?.onboarding_completato_at) {
      ctxRef.current = null;
      setCtx(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await loadPlanContext(p, new Date());
      ctxRef.current = next;
      setCtx(next);
      await syncNotifications(next, p);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const resync = useCallback(() => syncNotifications(ctxRef.current, profileRef.current), []);

  // Ricarica quando cambia il profilo (accesso, onboarding finito, impostazioni salvate).
  useEffect(() => {
    if (onboarded) reload();
    else {
      ctxRef.current = null;
      setCtx(null);
      syncNotifications(null, null);
    }
  }, [onboarded, profile, reload]);

  // Ricarica quando l'app torna in primo piano (es. il giorno è cambiato).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && profileRef.current?.onboarding_completato_at) reload();
    });
    return () => sub.remove();
  }, [reload]);

  const value = useMemo(() => ({ ctx, error, loading, reload, resync }), [ctx, error, loading, reload, resync]);
  return <PlanDataContext.Provider value={value}>{children}</PlanDataContext.Provider>;
}

export function usePlanData(): PlanDataState {
  const v = useContext(PlanDataContext);
  if (!v) throw new Error('usePlanData va usato dentro PlanDataProvider');
  return v;
}
