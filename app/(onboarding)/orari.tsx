import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PickerField } from '@/components/PickerField';
import { Screen } from '@/components/Screen';
import { ShiftBadge } from '@/components/ShiftBadge';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { useUserId } from '@/lib/session';
import { DEFAULT_SHIFT_HOURS, fetchShiftTypes, saveShiftTypes, shiftHoursFromTypes } from '@/lib/shifts';
import type { ShiftHoursMap, WorkShiftCode } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

const CODES: WorkShiftCode[] = ['M', 'P', 'N'];

/** Onboarding, passo 5: orari dei turni. */
export default function Hours() {
  const userId = useUserId();
  const [hours, setHours] = useState<ShiftHoursMap>(DEFAULT_SHIFT_HOURS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShiftTypes()
      .then((types) => types.length > 0 && setHours(shiftHoursFromTypes(types)))
      .catch(() => {});
  }, []);

  const set = (code: WorkShiftCode, field: 'start' | 'end', value: string) =>
    setHours((h) => ({ ...h, [code]: { ...h[code], [field]: value } }));

  const next = async () => {
    setSaving(true);
    try {
      await saveShiftTypes(userId, hours);
      router.push('/schema');
    } catch {
      Alert.alert(it.common.error, it.common.retry);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={next} loading={saving} />}>
      <StepHeader step={5} title={it.onboarding.hours.title} subtitle={it.onboarding.hours.subtitle} />
      {CODES.map((code) => (
        <View key={code} style={styles.card}>
          <View style={styles.cardHeader}>
            <ShiftBadge code={code} />
            <AppText variant="bodyMedium">{it.shifts.names[code]}</AppText>
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <AppText variant="caption">{it.onboarding.hours.start}</AppText>
              <PickerField mode="time" compact value={hours[code].start} onChange={(v) => set(code, 'start', v)} />
            </View>
            <View style={styles.flex}>
              <AppText variant="caption">{it.onboarding.hours.end}</AppText>
              <PickerField mode="time" compact value={hours[code].end} onChange={(v) => set(code, 'end', v)} />
            </View>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1, gap: 4 },
});
