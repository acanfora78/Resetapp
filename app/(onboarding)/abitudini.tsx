import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { HabitsFields } from '@/components/HabitsFields';
import type { HabitsValue } from '@/components/HabitsFields';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { useOnboardingDraft } from '@/lib/onboardingDraft';

/** Onboarding, passo 5: sveglia nei giorni liberi, tragitto e fabbisogno di sonno. */
export default function Habits() {
  const { draft, update } = useOnboardingDraft();
  const [value, setValue] = useState<HabitsValue>({
    wake: draft.wake,
    commuteMin: draft.commuteMin,
    sleepNeedMin: draft.sleepNeedMin,
  });

  const next = () => {
    update(value);
    router.push('/caricamento');
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={next} />}>
      <StepHeader step={5} title={it.onboarding.habits.title} />
      <HabitsFields value={value} onChange={setValue} />
    </Screen>
  );
}
