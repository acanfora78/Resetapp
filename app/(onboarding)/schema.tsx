import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/Button';
import { PatternForm } from '@/components/PatternForm';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { draftAvailableCodes, useOnboardingDraft } from '@/lib/onboardingDraft';
import { fromISODate, toISODate } from '@/plan/cycle';
import type { ShiftCode } from '@/plan/types';

/** Onboarding, passo 4: schema ciclico e data di inizio (si può saltare). */
export default function Pattern() {
  const { draft, update } = useOnboardingDraft();
  const [sequence, setSequence] = useState<ShiftCode[]>(draft.sequence);
  const [startDate, setStartDate] = useState(fromISODate(draft.startDate));

  const next = () => {
    if (sequence.length === 0) return Alert.alert(it.common.error, it.onboarding.pattern.tooShort);
    update({ sequence, startDate: toISODate(startDate), patternSkipped: false });
    router.push('/abitudini');
  };

  const skip = () => {
    update({ patternSkipped: true });
    router.push('/abitudini');
  };

  return (
    <Screen
      footer={
        <>
          <Button title={it.common.continue} onPress={next} disabled={sequence.length === 0} />
          <Button variant="ghost" title={it.onboarding.pattern.skip} onPress={skip} />
        </>
      }
    >
      <StepHeader step={4} title={it.onboarding.pattern.title} subtitle={it.onboarding.pattern.subtitle} />
      <PatternForm
        sequence={sequence}
        onSequenceChange={setSequence}
        startDate={startDate}
        onStartDateChange={(d) => setStartDate(fromISODate(toISODate(d)))}
        available={draftAvailableCodes(draft)}
      />
    </Screen>
  );
}
