/**
 * Modalità notte: interfaccia più scura e meno luminosa.
 * Automatica durante i turni di notte, oppure sempre attiva / disattivata.
 * La preferenza è del dispositivo (AsyncStorage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { isNightShiftTime } from '@/plan/today';

import { usePlanData } from './planData';

export type NightModePref = 'auto' | 'on' | 'off';

const STORAGE_KEY = 'reset.nightMode.v1';
const TICK_MS = 60_000;
/** Quanto scurisce lo schermo (0 = niente, 1 = nero). */
export const NIGHT_DIM = 0.45;

interface NightModeState {
  pref: NightModePref;
  setPref: (p: NightModePref) => void;
  active: boolean;
  /** true se attiva perché è in corso un turno di notte. */
  auto: boolean;
}

const NightModeContext = createContext<NightModeState | null>(null);

export function NightModeProvider({ children }: { children: ReactNode }) {
  const { ctx } = usePlanData();
  const [pref, setPrefState] = useState<NightModePref>('auto');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'auto' || v === 'on' || v === 'off') setPrefState(v);
      })
      .catch(() => {});
    const t = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  const setPref = useCallback((p: NightModePref) => {
    setPrefState(p);
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
  }, []);

  const auto = !!ctx && isNightShiftTime(ctx, now);
  const active = pref === 'on' || (pref === 'auto' && auto);

  const value = useMemo(() => ({ pref, setPref, active, auto }), [pref, setPref, active, auto]);
  return <NightModeContext.Provider value={value}>{children}</NightModeContext.Provider>;
}

export function useNightMode(): NightModeState {
  const v = useContext(NightModeContext);
  if (!v) throw new Error('useNightMode va usato dentro NightModeProvider');
  return v;
}

/** Velo scuro sopra tutta l'interfaccia, non blocca i tocchi. */
export function NightDimmer() {
  const { active } = useNightMode();
  if (!active) return null;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${NIGHT_DIM})` }]} />;
}
