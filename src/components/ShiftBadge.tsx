import { StyleSheet, View } from 'react-native';

import type { ShiftCode } from '@/plan/types';
import { colors, fonts, shiftColors } from '@/theme';

import { AppText } from './AppText';

interface Props {
  code: ShiftCode;
  size?: number;
}

export function ShiftBadge({ code, size = 28 }: Props) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2.8, backgroundColor: shiftColors[code] },
      ]}
    >
      <AppText style={[styles.text, { fontSize: size * 0.5, lineHeight: size * 0.62 }]}>{code}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.bold, color: colors.background },
});
