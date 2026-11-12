import { format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ShiftBadge } from '@/components/ShiftBadge';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import type { ShiftPatternRow, ShiftRow } from '@/lib/database.types';
import { usePlanData } from '@/lib/planData';
import { useUserId } from '@/lib/session';
import {
  availableCodesFromTypes,
  deleteShift,
  fetchActivePattern,
  fetchShiftTypes,
  fetchShifts,
  restoreFromPattern,
  setManualShift,
  shiftHoursFromTypes,
  toCyclePattern,
} from '@/lib/shifts';
import { fromISODate, shiftFromPattern } from '@/plan/cycle';
import { capitalizeFirst } from '@/plan/time';
import { isWorkShift } from '@/plan/types';
import type { ShiftCode, ShiftHoursMap } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

/** Modifica del turno di un singolo giorno. */
export default function DayEditor() {
  const userId = useUserId();
  const { reload } = usePlanData();
  const { data } = useLocalSearchParams<{ data: string }>();
  const date = fromISODate(data);

  const [shift, setShift] = useState<ShiftRow | null>(null);
  const [pattern, setPattern] = useState<ShiftPatternRow | null>(null);
  const [hours, setHours] = useState<ShiftHoursMap | null>(null);
  const [codes, setCodes] = useState<ShiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchShifts(data, data), fetchActivePattern(), fetchShiftTypes()])
      .then(([rows, p, types]) => {
        setShift(rows[0] ?? null);
        setPattern(p);
        setHours(shiftHoursFromTypes(types));
        setCodes(availableCodesFromTypes(types));
      })
      .catch((e) => Alert.alert(it.common.error, errorText(e)))
      .finally(() => setLoading(false));
  }, [data]);

  const fromPattern = pattern ? shiftFromPattern(toCyclePattern(pattern), date) : null;

  const run = async (fn: () => Promise<void>) => {
    setSaving(true);
    try {
      await fn();
      reload(); // piano e promemoria aggiornati
      router.back();
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
      setSaving(false);
    }
  };

  const hoursLabel = (c: ShiftCode) =>
    hours && isWorkShift(c) ? `${hours[c].start}–${hours[c].end}` : '';

  return (
    <Screen>
      <AppText variant="title">
        {capitalizeFirst(format(date, 'EEEE d MMMM', { locale: itLocale }))}
      </AppText>
      {loading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <>
          <AppText variant="label" secondary>
            {it.day.chooseShift}
          </AppText>
          {codes.map((c) => {
            const selected = shift?.codice === c;
            return (
              <Pressable
                key={c}
                disabled={saving}
                onPress={() => run(() => setManualShift(userId, data, c))}
                style={({ pressed }) => [styles.option, selected && styles.selected, pressed && { opacity: 0.8 }]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <ShiftBadge code={c} size={32} />
                <AppText variant="bodyMedium" style={{ flex: 1 }}>
                  {it.shifts.names[c]}
                </AppText>
                <AppText variant="caption">{hoursLabel(c)}</AppText>
              </Pressable>
            );
          })}

          {shift?.manuale ? (
            <View style={styles.note}>
              <AppText variant="caption">{it.day.manualNote}</AppText>
            </View>
          ) : null}

          {shift?.manuale && fromPattern ? (
            <View style={{ gap: 4 }}>
              <Button
                variant="secondary"
                title={it.day.restoreFromPattern}
                disabled={saving}
                onPress={() => run(() => restoreFromPattern(userId, data, fromPattern))}
              />
              <AppText variant="caption" center>
                {it.day.restoreHint(it.shifts.names[fromPattern])}
              </AppText>
            </View>
          ) : null}

          {shift && !fromPattern ? (
            <Button
              variant="danger"
              title={it.day.removeShift}
              disabled={saving}
              onPress={() => run(() => deleteShift(data))}
            />
          ) : null}

          <Button variant="ghost" title={it.common.cancel} onPress={() => router.back()} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12,
  },
  selected: { borderColor: colors.accent },
  note: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
});
