import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import it from '@/i18n/it';
import { fonts, useColors } from '@/theme';

import { AppText } from './AppText';

/** Anello del punteggio di recupero (0–100). */
export function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const colors = useColors();
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? colors.shift.S : score >= 40 ? colors.accent : colors.danger;
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible
      accessibilityLabel={it.score.a11y(score)}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${(c * score) / 100} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <AppText style={{ fontFamily: fonts.bold, fontSize: size * 0.3, lineHeight: size * 0.38 }}>{score}</AppText>
    </View>
  );
}
