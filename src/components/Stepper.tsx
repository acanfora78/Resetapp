import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { makeStyles, radius, useColors } from '@/theme';

import { AppText } from './AppText';

interface Props {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}

export function Stepper({ value, onChange, step = 5, min = 0, max = 240, format }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const btn = (dir: -1 | 1) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir < 0 ? '−' : '+'}
      onPress={() => onChange(Math.min(max, Math.max(min, value + dir * step)))}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={dir < 0 ? 'remove' : 'add'} size={24} color={colors.text} />
    </Pressable>
  );
  return (
    <View style={styles.row}>
      {btn(-1)}
      <AppText variant="heading" style={styles.value}>
        {format ? format(value) : value}
      </AppText>
      {btn(1)}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: 6,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { flex: 1, textAlign: 'center' },
}));
