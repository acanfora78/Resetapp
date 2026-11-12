import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { makeStyles, radius, useColors } from '@/theme';

import { AppText } from './AppText';

interface Props<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: (v: T) => string;
}

/** Scelta tra poche opzioni affiancate. */
export function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.segment} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(o);
            }}
            style={[styles.item, selected && styles.on]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <AppText variant="label" center color={selected ? colors.onAccent : colors.textSecondary}>
              {label(o)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4, gap: 4 },
  item: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.pill },
  on: { backgroundColor: colors.accent },
}));
