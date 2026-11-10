import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/theme';

import { AppText } from './AppText';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Opzione selezionabile in un elenco. */
export function OptionButton({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.base, selected && styles.selected, pressed && { opacity: 0.85 }]}
    >
      <AppText variant="bodyMedium" color={selected ? colors.accent : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selected: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
});
