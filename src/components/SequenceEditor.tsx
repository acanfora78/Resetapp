import { Pressable, View } from 'react-native';

import it from '@/i18n/it';
import { presetsFor } from '@/plan/shiftSetup';
import type { ShiftCode } from '@/plan/types';
import { makeStyles, radius, spacing, useColors } from '@/theme';

import { AppText } from './AppText';
import { ShiftBadge } from './ShiftBadge';

interface Props {
  value: ShiftCode[];
  onChange: (v: ShiftCode[]) => void;
  /** Turni che l'utente fa davvero (quelli disattivati non compaiono). */
  available: ShiftCode[];
}

const MAX_LENGTH = 60;

export function SequenceEditor({ value, onChange, available }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const presets = presetsFor(available);
  const matchesPreset = presets.some((p) => p.join('-') === value.join('-'));
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{it.onboarding.pattern.presets}</AppText>
      <View style={styles.presets}>
        {presets.map((p) => {
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
        <Pressable
          onPress={() => onChange([])}
          style={[styles.preset, !matchesPreset && styles.presetOn]}
          accessibilityRole="button"
        >
          <AppText variant="label" color={!matchesPreset ? colors.accent : colors.text}>
            {it.onboarding.pattern.custom}
          </AppText>
        </Pressable>
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
        {available.map((c) => (
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

const useStyles = makeStyles((colors) => ({
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
  adders: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
  adder: { alignItems: 'center', gap: 4, padding: 4, minWidth: 56 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
}));
