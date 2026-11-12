import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { ReactNode } from 'react';

import { makeStyles, radius, useColors } from '@/theme';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}

export function Checkbox({ checked, onChange, children }: Props) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Ionicons name="checkmark" size={18} color={colors.onAccent} /> : null}
      </View>
      <View style={styles.label}>{children}</View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingVertical: 6 },
  box: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { flex: 1 },
}));
