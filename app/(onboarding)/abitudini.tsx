import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PickerField } from '@/components/PickerField';
import { Screen } from '@/components/Screen';
import { StepHeader } from '@/components/StepHeader';
import { Stepper } from '@/components/Stepper';
import it from '@/i18n/it';
import { updateProfile } from '@/lib/profile';
import { useSession, useUserId } from '@/lib/session';
import { toClock } from '@/plan/time';

/** Onboarding, passo 7: sveglia nei giorni liberi e minuti di tragitto. */
export default function Habits() {
  const userId = useUserId();
  const { profile, refreshProfile } = useSession();
  const [wake, setWake] = useState(toClock(profile?.sveglia_preferita, '08:00'));
  const [commute, setCommute] = useState(profile?.tragitto_min ?? 30);
  const [saving, setSaving] = useState(false);

  const next = async () => {
    setSaving(true);
    try {
      await updateProfile(userId, { sveglia_preferita: wake, tragitto_min: commute });
      await refreshProfile();
      router.push('/anteprima');
    } catch {
      Alert.alert(it.common.error, it.common.retry);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={next} loading={saving} />}>
      <StepHeader step={7} title={it.onboarding.habits.title} />
      <PickerField mode="time" label={it.onboarding.habits.wake} value={wake} onChange={setWake} />
      <View style={{ gap: 6 }}>
        <AppText variant="label">{it.onboarding.habits.commute}</AppText>
        <Stepper value={commute} onChange={setCommute} step={5} min={0} max={180} format={it.common.minutes} />
        <AppText variant="caption">{it.onboarding.habits.commuteHint}</AppText>
      </View>
    </Screen>
  );
}
