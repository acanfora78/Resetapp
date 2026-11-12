import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PickerField } from '@/components/PickerField';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import { Stepper } from '@/components/Stepper';
import it from '@/i18n/it';
import { useOnboardingDraft } from '@/lib/onboardingDraft';

const SLEEP_MIN = 6 * 60;
const SLEEP_MAX = 9 * 60;
const SLEEP_STEP = 30;

/** Onboarding, passo 5: sveglia nei giorni liberi, tragitto e fabbisogno di sonno. */
export default function Habits() {
  const { draft, update } = useOnboardingDraft();
  const [wake, setWake] = useState(draft.wake);
  const [commute, setCommute] = useState(draft.commuteMin);
  const [sleepNeed, setSleepNeed] = useState(draft.sleepNeedMin);

  const next = () => {
    update({ wake, commuteMin: commute, sleepNeedMin: sleepNeed });
    router.push('/caricamento');
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={next} />}>
      <StepHeader step={5} title={it.onboarding.habits.title} />
      <View style={{ gap: 6 }}>
        <AppText variant="label">{it.onboarding.habits.wake}</AppText>
        <PickerField mode="time" compact value={wake} onChange={setWake} />
      </View>
      <View style={{ gap: 6 }}>
        <AppText variant="label">{it.onboarding.habits.commute}</AppText>
        <Stepper value={commute} onChange={setCommute} step={5} min={0} max={180} format={it.common.minutes} />
        <AppText variant="caption">{it.onboarding.habits.commuteHint}</AppText>
      </View>
      <View style={{ gap: 6 }}>
        <AppText variant="label">{it.onboarding.habits.sleepNeed}</AppText>
        <Stepper
          value={sleepNeed}
          onChange={setSleepNeed}
          step={SLEEP_STEP}
          min={SLEEP_MIN}
          max={SLEEP_MAX}
          format={it.onboarding.habits.hours}
        />
        <AppText variant="caption">{it.onboarding.habits.sleepNeedHint}</AppText>
      </View>
    </Screen>
  );
}
