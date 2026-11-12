import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { makeStyles, radius, useColors } from '@/theme';

import { AppText } from './AppText';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
}

/** Opzione selezionabile in un elenco, con vibrazione leggera alla selezione. */
export function OptionButton({ label, selected, onPress, icon }: Props) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.base, selected && styles.selected, pressed && { opacity: 0.85 }]}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <AppText variant="bodyMedium" style={styles.label}>
        {label}
      </AppText>
      <View style={styles.check}>
        {selected ? <Ionicons name="checkmark-circle" size={24} color={colors.accent} /> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  icon: { fontSize: 22 },
  label: { flex: 1 },
  check: { width: 24, alignItems: 'center' },
}));
