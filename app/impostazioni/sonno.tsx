import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { HabitsFields } from '@/components/HabitsFields';
import type { HabitsValue } from '@/components/HabitsFields';
import { Screen } from '@/components/Screen';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import { updateProfile } from '@/lib/profile';
import { useSession, useUserId } from '@/lib/session';
import { RULES } from '@/plan/rules';
import { toClock } from '@/plan/time';
import { useColors } from '@/theme';

/** Profilo → Sonno e tragitto. */
export default function SleepSettings() {
  const colors = useColors();
  const userId = useUserId();
  const { profile, refreshProfile } = useSession();
  const [value, setValue] = useState<HabitsValue>({
    wake: toClock(profile?.sveglia_preferita, '08:00'),
    commuteMin: profile?.tragitto_min ?? 30,
    sleepNeedMin: profile?.fabbisogno_sonno_min ?? RULES.DEFAULT_SLEEP_NEED_MIN,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile(userId, {
        sveglia_preferita: value.wake,
        tragitto_min: value.commuteMin,
        fabbisogno_sonno_min: value.sleepNeedMin,
      });
      await refreshProfile(); // il piano e i promemoria si ricalcolano
      router.back();
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
      setSaving(false);
    }
  };

  return (
    <Screen footer={<Button title={it.settings.save} onPress={save} loading={saving} />}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText variant="title">{it.settings.sleepTitle}</AppText>
      <HabitsFields value={value} onChange={setValue} />
    </Screen>
  );
}
