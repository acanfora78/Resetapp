import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { hasActiveShift, ShiftHoursEditor } from '@/components/ShiftHoursEditor';
import type { ShiftHoursValue } from '@/components/ShiftHoursEditor';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import { usePlanData } from '@/lib/planData';
import { updateProfile } from '@/lib/profile';
import { useSession, useUserId } from '@/lib/session';
import { fetchShiftTypes, saveShiftTypes, shiftHoursFromTypes } from '@/lib/shifts';
import { WORK_SHIFT_CODES } from '@/plan/types';
import type { WorkShiftCode } from '@/plan/types';
import { colors } from '@/theme';

/** Profilo → Turni e orari. */
export default function ShiftSettings() {
  const userId = useUserId();
  const { profile, refreshProfile } = useSession();
  const { reload } = usePlanData();
  const [value, setValue] = useState<ShiftHoursValue | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShiftTypes()
      .then((types) => {
        const enabled = Object.fromEntries(
          WORK_SHIFT_CODES.map((c) => [c, !!types.find((t) => t.codice === c && t.attivo !== false)]),
        ) as Record<WorkShiftCode, boolean>;
        setValue({ mode: profile?.tipo_turni ?? '8h', hours: shiftHoursFromTypes(types), enabled });
      })
      .catch((e) => Alert.alert(it.common.error, errorText(e)));
  }, [profile?.tipo_turni]);

  const save = async () => {
    if (!value) return;
    if (!hasActiveShift(value)) return Alert.alert(it.onboarding.hours.atLeastOne);
    setSaving(true);
    try {
      await saveShiftTypes(userId, value.hours, value.enabled);
      await updateProfile(userId, { tipo_turni: value.mode });
      await refreshProfile();
      await reload();
      router.back();
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
      setSaving(false);
    }
  };

  return (
    <Screen footer={<Button title={it.settings.save} onPress={save} loading={saving} disabled={!value} />}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText variant="title">{it.settings.shiftsTitle}</AppText>
      {value ? <ShiftHoursEditor value={value} onChange={setValue} /> : <ActivityIndicator color={colors.accent} />}
    </Screen>
  );
}
