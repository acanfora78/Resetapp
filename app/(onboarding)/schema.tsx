import { addDays, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/Button';
import { PatternForm } from '@/components/PatternForm';
import { PATTERN_PRESETS } from '@/components/SequenceEditor';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { useUserId } from '@/lib/session';
import { savePattern } from '@/lib/shifts';
import { toISODate } from '@/plan/cycle';
import type { ShiftCode } from '@/plan/types';

/** Onboarding, passo 6: schema ciclico e data di inizio (si può saltare). */
export default function Pattern() {
  const userId = useUserId();
  const [sequence, setSequence] = useState<ShiftCode[]>([...PATTERN_PRESETS[0]!]);
  const [startDate, setStartDate] = useState(startOfDay(addDays(new Date(), 1)));
  const [saving, setSaving] = useState(false);

  const next = async () => {
    if (sequence.length === 0) return Alert.alert(it.common.error, it.onboarding.pattern.tooShort);
    setSaving(true);
    try {
      await savePattern(userId, sequence, toISODate(startDate));
      router.push('/abitudini');
    } catch {
      Alert.alert(it.common.error, it.common.retry);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          <Button title={it.common.continue} onPress={next} loading={saving} disabled={sequence.length === 0} />
          <Button variant="ghost" title={it.onboarding.pattern.skip} onPress={() => router.push('/abitudini')} />
        </>
      }
    >
      <StepHeader step={6} title={it.onboarding.pattern.title} subtitle={it.onboarding.pattern.subtitle} />
      <PatternForm
        sequence={sequence}
        onSequenceChange={setSequence}
        startDate={startDate}
        onStartDateChange={(d) => setStartDate(startOfDay(d))}
      />
    </Screen>
  );
}
