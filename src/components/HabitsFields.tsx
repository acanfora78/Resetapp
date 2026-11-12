import { StyleSheet, View } from 'react-native';

import it from '@/i18n/it';
import type { ClockTime } from '@/plan/types';
import { spacing } from '@/theme';

import { AppText } from './AppText';
import { PickerField } from './PickerField';
import { Stepper } from './Stepper';

export const SLEEP_NEED_MIN = 6 * 60;
export const SLEEP_NEED_MAX = 9 * 60;
export const SLEEP_NEED_STEP = 30;

export interface HabitsValue {
  wake: ClockTime;
  commuteMin: number;
  sleepNeedMin: number;
}

/** Sveglia nei giorni liberi, tragitto e fabbisogno di sonno. Usato in onboarding e Profilo. */
export function HabitsFields({ value, onChange }: { value: HabitsValue; onChange: (v: HabitsValue) => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <AppText variant="label">{it.onboarding.habits.wake}</AppText>
        <PickerField mode="time" compact value={value.wake} onChange={(wake) => onChange({ ...value, wake })} />
      </View>
      <View style={styles.field}>
        <AppText variant="label">{it.onboarding.habits.commute}</AppText>
        <Stepper
          value={value.commuteMin}
          onChange={(commuteMin) => onChange({ ...value, commuteMin })}
          step={5}
          min={0}
          max={180}
          format={it.common.minutes}
        />
        <AppText variant="caption">{it.onboarding.habits.commuteHint}</AppText>
      </View>
      <View style={styles.field}>
        <AppText variant="label">{it.onboarding.habits.sleepNeed}</AppText>
        <Stepper
          value={value.sleepNeedMin}
          onChange={(sleepNeedMin) => onChange({ ...value, sleepNeedMin })}
          step={SLEEP_NEED_STEP}
          min={SLEEP_NEED_MIN}
          max={SLEEP_NEED_MAX}
          format={it.onboarding.habits.hours}
        />
        <AppText variant="caption">{it.onboarding.habits.sleepNeedHint}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  field: { gap: 6 },
});
