import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PickerField } from '@/components/PickerField';
import { Screen } from '@/components/Screen';
import { ShiftBadge } from '@/components/ShiftBadge';
import { StepHeader } from '@/components/StepHeader';
import it from '@/i18n/it';
import { useOnboardingDraft } from '@/lib/onboardingDraft';
import { availableCodes, presetsFor, sanitizeSequence, setupForMode } from '@/plan/shiftSetup';
import type { EnabledMap } from '@/plan/shiftSetup';
import type { ShiftHoursMap, ShiftMode, WorkShiftCode } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

const MODES: ShiftMode[] = ['8h', '12h', 'personalizzati'];

const CODES_BY_MODE: Record<ShiftMode, WorkShiftCode[]> = {
  '8h': ['M', 'P', 'N'],
  '12h': ['G', 'N'],
  personalizzati: ['M', 'P', 'N', 'G'],
};

/** Onboarding, passo 3: tipo di turni e orari. */
export default function Hours() {
  const { draft, update } = useOnboardingDraft();
  const [mode, setMode] = useState<ShiftMode>(draft.tipoTurni);
  const [hours, setHours] = useState<ShiftHoursMap>(draft.hours);
  const [enabled, setEnabled] = useState<EnabledMap>(draft.enabled);

  const chooseMode = (m: ShiftMode) => {
    if (m === mode) return;
    Haptics.selectionAsync().catch(() => {});
    const setup = setupForMode(m);
    setMode(m);
    setHours(setup.hours);
    setEnabled(setup.enabled);
  };

  const setTime = (code: WorkShiftCode, field: 'start' | 'end', value: string) =>
    setHours((h) => ({ ...h, [code]: { ...h[code], [field]: value } }));

  const visible = CODES_BY_MODE[mode];

  const next = () => {
    if (!visible.some((c) => enabled[c])) return Alert.alert(it.onboarding.hours.atLeastOne);
    const available = availableCodes(enabled);
    let sequence = sanitizeSequence(draft.sequence, available);
    if (sequence.length !== draft.sequence.length || sequence.length === 0) {
      sequence = [...(presetsFor(available)[0] ?? [])];
    }
    update({ tipoTurni: mode, hours, enabled, sequence });
    router.push('/schema');
  };

  return (
    <Screen footer={<Button title={it.common.continue} onPress={next} />}>
      <StepHeader step={3} title={it.onboarding.hours.title} subtitle={it.onboarding.hours.subtitle} />

      <View style={styles.segment} accessibilityRole="radiogroup">
        {MODES.map((m) => {
          const selected = m === mode;
          return (
            <Pressable
              key={m}
              onPress={() => chooseMode(m)}
              style={[styles.segmentItem, selected && styles.segmentOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <AppText variant="label" center color={selected ? colors.onAccent : colors.textSecondary}>
                {it.onboarding.hours.modes[m]}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {visible.map((code) => {
        const on = enabled[code];
        return (
          <View key={code} style={styles.card}>
            <View style={styles.cardHeader}>
              <ShiftBadge code={code} size={32} />
              <AppText variant="bodyMedium" style={{ flex: 1 }}>
                {it.shifts.names[code]}
              </AppText>
            </View>
            {on ? (
              <View style={styles.row}>
                <View style={styles.flex}>
                  <AppText variant="caption">{it.onboarding.hours.start}</AppText>
                  <PickerField mode="time" compact value={hours[code].start} onChange={(v) => setTime(code, 'start', v)} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="caption">{it.onboarding.hours.end}</AppText>
                  <PickerField mode="time" compact value={hours[code].end} onChange={(v) => setTime(code, 'end', v)} />
                </View>
              </View>
            ) : null}
            <View style={styles.switchRow}>
              <AppText variant="caption" style={{ flex: 1 }}>
                {it.onboarding.hours.notDone}
              </AppText>
              <Switch
                value={!on}
                onValueChange={(notDone) => setEnabled((e) => ({ ...e, [code]: !notDone }))}
                trackColor={{ true: colors.accent, false: colors.surfaceAlt }}
                thumbColor="#FFFFFF"
                accessibilityLabel={`${it.onboarding.hours.notDone}: ${it.shifts.names[code]}`}
              />
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segmentItem: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.pill },
  segmentOn: { backgroundColor: colors.accent },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1, gap: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
