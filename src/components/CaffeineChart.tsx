import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import it from '@/i18n/it';
import { formatClock } from '@/plan/time';
import { RULES } from '@/plan/rules';
import { fonts, useColors } from '@/theme';

const HEIGHT = 180;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 18;
const PAD_B = 22;

/** Curva stimata della caffeina nelle prossime 24 ore, con soglia sonno e ora a letto. */
export function CaffeineChart({ points, sleepAt }: { points: { t: Date; mg: number }[]; sleepAt: Date | null }) {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  if (points.length < 2) return null;

  const t0 = points[0]!.t.getTime();
  const t1 = points[points.length - 1]!.t.getTime();
  const maxMg = Math.max(RULES.CAFFEINE_SLEEP_THRESHOLD_MG * 2, ...points.map((p) => p.mg)) * 1.1;
  const w = Math.max(width - PAD_L - PAD_R, 1);
  const h = HEIGHT - PAD_T - PAD_B;
  const x = (t: number) => PAD_L + ((t - t0) / (t1 - t0)) * w;
  const y = (mg: number) => PAD_T + h - (mg / maxMg) * h;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t.getTime()).toFixed(1)},${y(p.mg).toFixed(1)}`).join(' ');
  const area = `${line} L${x(t1).toFixed(1)},${y(0)} L${x(t0).toFixed(1)},${y(0)} Z`;
  const thresholdY = y(RULES.CAFFEINE_SLEEP_THRESHOLD_MG);
  const bedX = sleepAt && sleepAt.getTime() <= t1 ? x(sleepAt.getTime()) : null;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="image">
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          <Defs>
            <LinearGradient id="caf" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={0.45} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0.03} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#caf)" />
          <Path d={line} stroke={colors.accent} strokeWidth={2.5} fill="none" />
          <Line x1={PAD_L} x2={PAD_L + w} y1={thresholdY} y2={thresholdY} stroke={colors.shift.S} strokeWidth={1.5} strokeDasharray="6 5" />
          <SvgText x={PAD_L + w} y={thresholdY - 6} fill={colors.shift.S} fontSize={11} fontFamily={fonts.medium} textAnchor="end">
            {it.caffeine.chartLegendThreshold}
          </SvgText>
          {bedX !== null ? (
            <>
              <Line x1={bedX} x2={bedX} y1={PAD_T - 6} y2={y(0)} stroke={colors.shift.N} strokeWidth={1.5} />
              <SvgText
                x={bedX}
                y={PAD_T - 8}
                fill={colors.shift.N}
                fontSize={11}
                fontFamily={fonts.medium}
                textAnchor={bedX > width - 70 ? 'end' : 'middle'}
              >
                {`${it.caffeine.chartLegendBed} ${formatClock(sleepAt!)}`}
              </SvgText>
            </>
          ) : null}
          <SvgText x={PAD_L} y={HEIGHT - 6} fill={colors.textMuted} fontSize={11} fontFamily={fonts.regular}>
            {it.caffeine.nowLabel}
          </SvgText>
          <SvgText x={PAD_L + w} y={HEIGHT - 6} fill={colors.textMuted} fontSize={11} fontFamily={fonts.regular} textAnchor="end">
            {`+${RULES.CAFFEINE_CHART_HOURS} h`}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}
