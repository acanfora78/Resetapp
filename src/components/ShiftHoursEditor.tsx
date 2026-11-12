import { View } from 'react-native';

import it from '@/i18n/it';
import { setupForMode } from '@/plan/shiftSetup';
import type { EnabledMap } from '@/plan/shiftSetup';
import type { ShiftHoursMap, ShiftMode, WorkShiftCode } from '@/plan/types';
import { makeStyles, radius, spacing, useColors } from '@/theme';

import { AppText } from './AppText';
import { Toggle } from './Toggle';
import { PickerField } from './PickerField';
import { Segmented } from './Segmented';
import { ShiftBadge } from './ShiftBadge';

const MODES: ShiftMode[] = ['8h', '12h', 'personalizzati'];

export const CODES_BY_MODE: Record<ShiftMode, WorkShiftCode[]> = {
  '8h': ['M', 'P', 'N'],
  '12h': ['G', 'N'],
  personalizzati: ['M', 'P', 'N', 'G'],
};

export interface ShiftHoursValue {
  mode: ShiftMode;
  hours: ShiftHoursMap;
  enabled: EnabledMap;
}

/** true se almeno un turno visibile è attivo. */
export const hasActiveShift = (v: ShiftHoursValue) => CODES_BY_MODE[v.mode].some((c) => v.enabled[c]);

/** Scelta 8 / 12 ore / personalizzati, orari e "Non faccio questo turno". Usato in onboarding e Profilo. */
export function ShiftHoursEditor({ value, onChange }: { value: ShiftHoursValue; onChange: (v: ShiftHoursValue) => void }) {
  const colors = useColors();
  const styles = useStyles();
  const setTime = (code: WorkShiftCode, field: 'start' | 'end', t: string) =>
    onChange({ ...value, hours: { ...value.hours, [code]: { ...value.hours[code], [field]: t } } });

  return (
    <View style={styles.wrap}>
      <Segmented
        options={MODES}
        value={value.mode}
        onChange={(m) => onChange(setupForMode(m))}
        label={(m) => it.onboarding.hours.modes[m]}
      />
      {CODES_BY_MODE[value.mode].map((code) => {
        const on = value.enabled[code];
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
                  <PickerField mode="time" compact value={value.hours[code].start} onChange={(t) => setTime(code, 'start', t)} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="caption">{it.onboarding.hours.end}</AppText>
                  <PickerField mode="time" compact value={value.hours[code].end} onChange={(t) => setTime(code, 'end', t)} />
                </View>
              </View>
            ) : null}
            <View style={styles.switchRow}>
              <AppText variant="caption" style={{ flex: 1 }}>
                {it.onboarding.hours.notDone}
              </AppText>
              <Toggle
                value={!on}
                onValueChange={(notDone) => onChange({ ...value, enabled: { ...value.enabled, [code]: !notDone } })}
                accessibilityLabel={`${it.onboarding.hours.notDone}: ${it.shifts.names[code]}`}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1, gap: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
}));
