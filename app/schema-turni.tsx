import { Ionicons } from '@expo/vector-icons';
import { addDays, format, startOfDay } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PatternForm } from '@/components/PatternForm';
import { Screen } from '@/components/Screen';
import it from '@/i18n/it';
import { errorText } from '@/lib/errors';
import type { ShiftPatternRow } from '@/lib/database.types';
import { usePlanData } from '@/lib/planData';
import { useUserId } from '@/lib/session';
import { availableCodesFromTypes, disablePattern, fetchActivePattern, fetchShiftTypes, savePattern } from '@/lib/shifts';
import { fromISODate, toISODate } from '@/plan/cycle';
import { PATTERN_PRESETS } from '@/plan/shiftSetup';
import type { ShiftCode } from '@/plan/types';
import { colors } from '@/theme';

/** Gestione dello schema ciclico dal Calendario. */
export default function PatternScreen() {
  const userId = useUserId();
  const { reload } = usePlanData();
  const [active, setActive] = useState<ShiftPatternRow | null>(null);
  const [sequence, setSequence] = useState<ShiftCode[]>([...PATTERN_PRESETS[0]!]);
  const [startDate, setStartDate] = useState(startOfDay(addDays(new Date(), 1)));
  const [available, setAvailable] = useState<ShiftCode[]>(['M', 'P', 'N', 'S', 'R']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShiftTypes()
      .then((types) => setAvailable(availableCodesFromTypes(types)))
      .catch(() => {});
    fetchActivePattern()
      .then((p) => {
        setActive(p);
        if (p) {
          setSequence(p.sequenza);
          setStartDate(fromISODate(p.data_inizio));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (sequence.length === 0) return Alert.alert(it.common.error, it.onboarding.pattern.tooShort);
    setSaving(true);
    try {
      await savePattern(userId, sequence, toISODate(startDate));
      reload(); // piano e promemoria aggiornati
      router.back();
    } catch (e) {
      Alert.alert(it.common.error, errorText(e));
      setSaving(false);
    }
  };

  const disable = () =>
    Alert.alert(it.patternScreen.disableConfirmTitle, it.patternScreen.disableConfirmBody, [
      { text: it.common.cancel, style: 'cancel' },
      {
        text: it.patternScreen.disable,
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await disablePattern();
            reload();
            router.back();
          } catch (e) {
            Alert.alert(it.common.error, errorText(e));
            setSaving(false);
          }
        },
      },
    ]);

  return (
    <Screen
      footer={
        <>
          <Button title={it.patternScreen.save} onPress={save} loading={saving} disabled={sequence.length === 0} />
          {active ? (
            <Button variant="danger" title={it.patternScreen.disable} onPress={disable} disabled={saving} />
          ) : null}
        </>
      }
    >
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={it.common.back}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText variant="title">{it.patternScreen.title}</AppText>
      {loading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <>
          <AppText secondary>
            {active
              ? it.patternScreen.active(
                  active.sequenza.join('-'),
                  format(fromISODate(active.data_inizio), 'd MMMM yyyy', { locale: itLocale }),
                )
              : it.patternScreen.none}
          </AppText>
          <PatternForm
            sequence={sequence}
            onSequenceChange={setSequence}
            startDate={startDate}
            onStartDateChange={(d) => setStartDate(startOfDay(d))}
            available={available}
          />
        </>
      )}
    </Screen>
  );
}
