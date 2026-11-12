import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PlanTimeline } from '@/components/PlanTimeline';
import { Screen } from '@/components/Screen';
import { ShiftBadge } from '@/components/ShiftBadge';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { draftPlanContext, useOnboardingDraft } from '@/lib/onboardingDraft';
import { buildPreview } from '@/plan/context';
import { isWorkShift } from '@/plan/types';
import { makeStyles, radius, spacing, useColors } from '@/theme';

/** Onboarding, passo 7: anteprima del piano di domani, calcolata dai dati appena inseriti. */
export default function Preview() {
  const colors = useColors();
  const styles = useStyles();
  const { draft } = useOnboardingDraft();
  const preview = useMemo(() => buildPreview(draftPlanContext(draft), new Date()), [draft]);

  const shift = preview.tomorrowShift;
  const hours = shift && isWorkShift(shift) ? `${draft.hours[shift].start}–${draft.hours[shift].end}` : null;
  const name = shift ? it.shifts.names[shift] : it.shifts.freeDay;

  return (
    <Screen footer={<Button title={it.common.continue} onPress={() => router.push('/salva')} />}>
      <StepHeader step={7} title={it.onboarding.preview.title} />

      <View style={[styles.header, shift && { borderColor: colors.shift[shift] }]}>
        {shift ? <ShiftBadge code={shift} size={44} /> : null}
        <AppText variant="heading" style={{ flex: 1 }}>
          {it.onboarding.preview.header(name, hours)}
        </AppText>
      </View>

      {preview.tonight ? (
        <>
          <AppText variant="label" secondary>
            {it.onboarding.preview.tonight}
          </AppText>
          <PlanTimeline items={[preview.tonight]} />
        </>
      ) : null}

      <AppText variant="label" secondary>
        {it.onboarding.preview.tomorrow}
      </AppText>
      <PlanTimeline items={preview.tomorrow} startIndex={preview.tonight ? 1 : 0} />
      <AppText variant="caption">{it.onboarding.preview.note}</AppText>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
}));
