import { StyleSheet, Text, View } from 'react-native';

import it from '@/i18n/it';
import type { ShiftCode } from '@/plan/types';
import { shiftColors, shiftEmoji } from '@/theme';

interface Props {
  code: ShiftCode;
  size?: number;
}

/** Badge colorato del turno, con l'emoji al posto della lettera. */
export function ShiftBadge({ code, size = 28 }: Props) {
  return (
    <View
      accessible
      accessibilityLabel={it.shifts.names[code]}
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2.8, backgroundColor: shiftColors[code] },
      ]}
    >
      <Text style={{ fontSize: size * 0.56, lineHeight: size * 0.75 }} allowFontScaling={false}>
        {shiftEmoji[code]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});
