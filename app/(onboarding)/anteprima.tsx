import { addDays } from 'date-fns';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PlanList } from '@/components/PlanList';
import { Screen } from '@/components/Screen';
import { ShiftBadge } from '@/components/ShiftBadge';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { useSession } from '@/lib/session';
import { loadPlanContext, planForDay } from '@/lib/plan';
import type { PlanContext } from '@/lib/plan';
import type { PlanItem } from '@/plan/types';

import { colors, spacing } from '@/theme';

/** Onboarding, passo 8: anteprima del piano di domani. */
export default function Preview() {
  const { profile } = useSession();
  const [ctx, setCtx] = useState<PlanContext | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!profile) return;
    loadPlanContext(profile, new Date())
      .then(setCtx)
      .catch(() => setFailed(true));
  }, [profile]);

  const today = new Date();
  const tomorrow = addDays(today, 1);
  let tonight: PlanItem | undefined;
  let items: PlanItem[] = [];
  if (ctx) {
    tonight = planForDay(ctx, today).find((i) => i.key === 'bedtime');
    items = planForDay(ctx, tomorrow);
  }
  const tomorrowShift = ctx?.shiftOn(tomorrow) ?? null;

  return (
    <Screen footer={<Button title={it.common.continue} onPress={() => router.push('/abbonamento')} />}>
      <StepHeader step={8} title={it.onboarding.preview.title} />
      {!ctx && !failed ? <ActivityIndicator color={colors.accent} /> : null}
      {failed ? <AppText secondary>{it.common.error}</AppText> : null}
      {ctx ? (
        <>
          <View style={styles.shiftRow}>
            {tomorrowShift ? <ShiftBadge code={tomorrowShift} size={36} /> : null}
            <AppText variant="heading" style={{ flex: 1 }}>
              {tomorrowShift
                ? it.onboarding.preview.subtitle(it.shifts.names[tomorrowShift])
                : it.onboarding.preview.noShift}
            </AppText>
          </View>
          {tonight ? (
            <>
              <AppText variant="label" secondary>
                {it.onboarding.preview.tonight}
              </AppText>
              <PlanList items={[tonight]} />
            </>
          ) : null}
          <AppText variant="label" secondary>
            {it.onboarding.preview.tomorrow}
          </AppText>
          <PlanList items={items} />
          <AppText variant="caption">{it.onboarding.preview.note}</AppText>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
