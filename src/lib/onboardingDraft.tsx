/**
 * Dati dell'onboarding prima della registrazione.
 * Restano sul telefono (AsyncStorage) e vengono scritti su Supabase
 * solo dopo la registrazione e il consenso (vedi finalizeOnboarding).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, startOfDay } from 'date-fns';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import type { PlanContext } from '@/plan/context';
import { resolveShift, toISODate } from '@/plan/cycle';
import { RULES } from '@/plan/rules';
import { availableCodes, PATTERN_PRESETS, setupForMode } from '@/plan/shiftSetup';
import type { EnabledMap } from '@/plan/shiftSetup';
import type { ClockTime, ShiftCode, ShiftHoursMap, ShiftMode } from '@/plan/types';

const STORAGE_KEY = 'reset.onboarding.draft.v1';

export interface OnboardingDraft {
  lavoro: string | null;
  tipoTurni: ShiftMode;
  hours: ShiftHoursMap;
  enabled: EnabledMap;
  sequence: ShiftCode[];
  /** "yyyy-MM-dd" */
  startDate: string;
  patternSkipped: boolean;
  wake: ClockTime;
  commuteMin: number;
  sleepNeedMin: number;
  nome: string;
  /** Consenso dato nella schermata "Salva il tuo piano" (ISO), in attesa di salvataggio. */
  consentAt: string | null;
}

export function initialDraft(): OnboardingDraft {
  const setup = setupForMode('8h');
  return {
    lavoro: null,
    tipoTurni: setup.mode,
    hours: setup.hours,
    enabled: setup.enabled,
    sequence: [...PATTERN_PRESETS[0]!],
    startDate: toISODate(startOfDay(addDays(new Date(), 1))),
    patternSkipped: false,
    wake: '08:00',
    commuteMin: 30,
    sleepNeedMin: RULES.DEFAULT_SLEEP_NEED_MIN,
    nome: '',
    consentAt: null,
  };
}

/** Il piano calcolato solo dai dati dell'onboarding (nessuna lettura dal database). */
export function draftPlanContext(d: OnboardingDraft): PlanContext {
  const pattern =
    !d.patternSkipped && d.sequence.length > 0 ? { sequenza: d.sequence, dataInizio: d.startDate } : null;
  return {
    shiftHours: d.hours,
    commuteMin: d.commuteMin,
    preferredWake: d.wake,
    sleepNeedMin: d.sleepNeedMin,
    shiftOn: (day) => resolveShift(new Map(), pattern, day),
  };
}

/** true se l'utente ha già compilato i passi fino all'anteprima. */
export const isDraftComplete = (d: OnboardingDraft) => !!d.lavoro;

export const draftAvailableCodes = (d: OnboardingDraft) => availableCodes(d.enabled);

interface DraftState {
  ready: boolean;
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  reset: () => Promise<void>;
}

const DraftContext = createContext<DraftState | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const [ready, setReady] = useState(false);
  const latest = useRef(draft);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = { ...initialDraft(), ...(JSON.parse(raw) as Partial<OnboardingDraft>) };
          latest.current = saved;
          setDraft(saved);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((patch: Partial<OnboardingDraft>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setDraft(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const reset = useCallback(async () => {
    const fresh = initialDraft();
    latest.current = fresh;
    setDraft(fresh);
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo(() => ({ ready, draft, update, reset }), [ready, draft, update, reset]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useOnboardingDraft(): DraftState {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useOnboardingDraft va usato dentro OnboardingDraftProvider');
  return ctx;
}
