import { Pressable, StyleSheet, View } from 'react-native';

import it from '@/i18n/it';
import { SHIFT_CODES } from '@/plan/types';
import type { ShiftCode } from '@/plan/types';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { ShiftBadge } from './ShiftBadge';

export const PATTERN_PRESETS: ShiftCode[][] = [
  ['M', 'P', 'N', 'S', 'R'],
  ['M', 'M', 'P', 'P', 'N', 'N', 'S', 'R'],
  ['M', 'P', 'N', 'S', 'R', 'R'],
];

interface Props {
  value: ShiftCode[];
  onChange: (v: ShiftCode[]) => void;
}

const MAX_LENGTH = 60;

export function SequenceEditor({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{it.onboarding.pattern.presets}</AppText>
      <View style={styles.presets}>
        {PATTERN_PRESETS.map((p) => {
          const label = p.join('-');
          const selected = value.join('-') === label;
          return (
            <Pressable
              key={label}
              onPress={() => onChange([...p])}
              style={[styles.preset, selected && styles.presetOn]}
              accessibilityRole="button"
            >
              <AppText variant="label" color={selected ? colors.accent : colors.text}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="label">{it.onboarding.pattern.sequence}</AppText>
      <View style={styles.sequenceBox}>
        {value.length === 0 ? (
          <AppText variant="caption">{it.onboarding.pattern.sequenceEmpty}</AppText>
        ) : (
          <View style={styles.sequence}>
            {value.map((c, i) => (
              <ShiftBadge key={`${c}-${i}`} code={c} size={34} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.adders}>
        {SHIFT_CODES.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`${it.onboarding.pattern.add} ${it.shifts.names[c]}`}
            onPress={() => value.length < MAX_LENGTH && onChange([...value, c])}
            style={({ pressed }) => [styles.adder, pressed && { opacity: 0.7 }]}
          >
            <ShiftBadge code={c} size={30} />
            <AppText variant="caption">{it.shifts.names[c]}</AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => onChange(value.slice(0, -1))} hitSlop={8} accessibilityRole="button">
          <AppText variant="label" color={colors.accent}>
            {it.onboarding.pattern.removeLast}
          </AppText>
        </Pressable>
        <Pressable onPress={() => onChange([])} hitSlop={8} accessibilityRole="button">
          <AppText variant="label" color={colors.textSecondary}>
            {it.onboarding.pattern.clear}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  presetOn: { borderColor: colors.accent },
  sequenceBox: {
    minHeight: 58,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    justifyContent: 'center',
  },
  sequence: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  adders: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  adder: { alignItems: 'center', gap: 4, padding: 4 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
});
