import { format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PlanList } from '@/components/PlanList';
import { Screen } from '@/components/Screen';
import { ShiftBadge } from '@/components/ShiftBadge';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import { loadPlanContext, planForDay } from '@/lib/plan';
import type { PlanContext } from '@/lib/plan';
import { useSession } from '@/lib/session';
import { capitalizeFirst } from '@/plan/time';
import { colors, radius, spacing } from '@/theme';

/** Oggi: turno e piano del giorno (versione base; spunte e punteggio nella Fase 3). */
export default function Today() {
  const { profile } = useSession();
  const [ctx, setCtx] = useState<PlanContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!profile) return;
    setError(null);
    loadPlanContext(profile, new Date())
      .then(setCtx)
      .catch((e) => setError(errorText(e)));
  }, [profile]);

  useFocusEffect(load);

  const today = new Date();
  const shift = ctx?.shiftOn(today) ?? null;
  const hours = ctx && shift && (shift === 'M' || shift === 'P' || shift === 'N') ? ctx.shiftHours[shift] : null;

  return (
    <Screen edges={['top']}>
      <AppText variant="caption">{capitalizeFirst(format(today, 'EEEE d MMMM', { locale: itLocale }))}</AppText>
      <AppText variant="title">{it.today.greeting(profile?.nome ?? null)}</AppText>

      {!ctx && !error ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? (
        <Pressable onPress={load} style={styles.card}>
          <AppText variant="label" color={colors.danger}>
            {it.today.loadError}
          </AppText>
          <AppText variant="caption">{error}</AppText>
        </Pressable>
      ) : null}

      {ctx ? (
        <>
          <View style={[styles.card, styles.shiftRow]}>
            {shift ? <ShiftBadge code={shift} size={40} /> : null}
            <View style={{ flex: 1 }}>
              <AppText variant="heading">
                {shift ? it.today.shiftOf(it.shifts.names[shift]) : it.today.noShift}
              </AppText>
              {hours ? <AppText secondary>{`${hours.start}–${hours.end}`}</AppText> : null}
            </View>
          </View>
          <AppText variant="label" secondary>
            {it.today.planTitle}
          </AppText>
          <PlanList items={planForDay(ctx, today)} />
          <AppText variant="caption">{it.today.comingSoon}</AppText>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
