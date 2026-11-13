import { format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import it from '@/i18n/it';
import { fromISODate } from '@/plan/cycle';
import { fonts, useColors } from '@/theme';

const HEIGHT = 170;
const PAD_T = 16;
const PAD_B = 22;

/** Barre delle ore dormite per giorno, con la linea del fabbisogno. */
export function SleepBars({ days, needMin }: { days: { data: string; minutes: number | null }[]; needMin: number }) {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const maxMin = Math.max(needMin * 1.25, ...days.map((d) => d.minutes ?? 0));
  const h = HEIGHT - PAD_T - PAD_B;
  const y = (m: number) => PAD_T + h - (m / maxMin) * h;
  const slot = width / Math.max(days.length, 1);
  const barW = Math.min(28, slot * 0.6);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="image">
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {days.map((d, i) => {
            const cx = slot * i + slot / 2;
            const label = format(fromISODate(d.data), 'EEEEE', { locale: itLocale }).toUpperCase();
            return (
              <G key={d.data}>
                {d.minutes !== null ? (
                  <Rect
                    x={cx - barW / 2}
                    y={y(d.minutes)}
                    width={barW}
                    height={Math.max(2, y(0) - y(d.minutes))}
                    rx={6}
                    fill={d.minutes >= needMin ? colors.shift.S : colors.accent}
                  />
                ) : (
                  <Rect x={cx - barW / 2} y={y(0) - 2} width={barW} height={2} fill={colors.border} />
                )}
                <SvgText x={cx} y={HEIGHT - 6} fill={colors.textMuted} fontSize={11} fontFamily={fonts.medium} textAnchor="middle">
                  {label}
                </SvgText>
              </G>
            );
          })}
          <Line x1={0} x2={width} y1={y(needMin)} y2={y(needMin)} stroke={colors.shift.N} strokeWidth={1.5} strokeDasharray="6 5" />
          <SvgText x={width} y={y(needMin) - 6} fill={colors.shift.N} fontSize={11} fontFamily={fonts.medium} textAnchor="end">
            {it.diary.needLine}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}
