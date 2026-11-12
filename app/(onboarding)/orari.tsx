import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { hasActiveShift, ShiftHoursEditor } from '@/components/ShiftHoursEditor';
import type { ShiftHoursValue } from '@/components/ShiftHoursEditor';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { useOnboardingDraft } from '@/lib/onboardingDraft';
import { availableCodes, presetsFor, sanitizeSequence } from '@/plan/shiftSetup';

/** Onboarding, passo 3: tipo di turni e orari. */
export default function Hours() {
  const { draft, update } = useOnboardingDraft();
  const [value, setValue] = useState<ShiftHoursValue>({
    mode: draft.tipoTurni,
    hours: draft.hours,
    enabled: draft.enabled,
  });

  const next = () => {
    if (!hasActiveShift(value)) return Alert.alert(it.onboarding.hours.atLeastOne);
    const available = availableCodes(value.enabled);
    let sequence = sanitizeSequence(draft.sequence, available);
    if (sequence.length !== draft.sequence.length || sequence.length === 0) {
      sequence = [...(presetsFor(available)[0] ?? [])];
    }
    update({ tipoTurni: value.mode, hours: value.hours, enabled: value.enabled, sequence });
    router.push('/schema');
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={next} />}>
      <StepHeader step={3} title={it.onboarding.hours.title} subtitle={it.onboarding.hours.subtitle} />
      <ShiftHoursEditor value={value} onChange={setValue} />
    </Screen>
  );
}
