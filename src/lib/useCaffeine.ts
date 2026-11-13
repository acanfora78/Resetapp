import { addHours } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import it from '@/i18n/it';
import { isAfterCaffeineStop } from '@/plan/caffeine';
import type { PlanContext } from '@/plan/context';
import type { CaffeineType } from '@/plan/rules';

import { fetchCaffeine, logCaffeine } from './caffeine';
import type { CaffeineLogRow } from './database.types';
import { errorText } from './errors';

/** Caffè delle ultime 24 ore e registrazione di un nuovo caffè. */
export function useCaffeine(userId: string, ctx: PlanContext | null) {
  const [rows, setRows] = useState<CaffeineLogRow[]>([]);

  const load = useCallback(async () => {
    try {
      setRows(await fetchCaffeine(addHours(new Date(), -24)));
    } catch {
      // resta l'ultimo elenco
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const add = useCallback(
    async (tipo: CaffeineType) => {
      const now = new Date();
      try {
        await logCaffeine(userId, tipo, now);
        await load();
        if (ctx && isAfterCaffeineStop(ctx, now)) Alert.alert(it.caffeine.lateTitle, it.caffeine.lateBody);
      } catch (e) {
        Alert.alert(it.common.error, errorText(e));
      }
    },
    [userId, ctx, load],
  );

  return { rows, load, add };
}
